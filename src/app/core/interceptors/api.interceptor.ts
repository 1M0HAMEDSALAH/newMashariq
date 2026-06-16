import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  BehaviorSubject,
  throwError,
  timer,
} from 'rxjs';
import {
  catchError,
  filter,
  switchMap,
  take,
  retry,
  tap,
  finalize,
} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment.development';

// ─── Constants ───────────────────────────────────────────────────────────────

const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 1000;
const APP_LANGUAGE = 'ar';
const BASE_URL = environment.apiUrl;


/** Status codes that should NEVER be retried */
const NON_RETRYABLE_CODES = new Set([400, 401, 403, 404, 422]);

// ─── Token-refresh shared state ──────────────────────────────────────────────
// Kept outside the function so all concurrent requests share the same state.

let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generates a short unique ID for request correlation / tracing */
function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Clones the request and injects standard headers */
function addHeaders(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  const headers: Record<string, string> = {
    'Accept-Language': APP_LANGUAGE,
    'X-Correlation-Id': generateCorrelationId(),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return req.clone({ setHeaders: headers });
}

/** Returns true for transient network/server errors worth retrying */
function isRetryable(error: HttpErrorResponse): boolean {
  // Network error (status 0) or 5xx server errors — but not 4xx client errors
  return error.status === 0 || (error.status >= 500 && !NON_RETRYABLE_CODES.has(error.status));
}

/** Maps an HTTP status code to a user-friendly Arabic/English message */
function resolveErrorMessage(error: HttpErrorResponse): string {
  // 1. If it's a network/client-side error
  if (error.error instanceof ErrorEvent) {
    return `خطأ في الشبكة: ${error.error.message}`;
  }

  // 2. Try to get message from server response body (Priority)
  const serverMessage = error.error?.message || error.error?.Message || error.error?.data;
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }

  // 3. Fallback to predefined status messages
  const messages: Record<number, string> = {
    400: 'طلب غير صحيح — تحقق من البيانات المرسلة',
    401: 'انتهت الجلسة — يرجى تسجيل الدخول مجدداً',
    403: 'ليس لديك صلاحية للوصول إلى هذا المورد',
    404: 'المورد المطلوب غير موجود',
    408: 'انتهت مهلة الطلب — يرجى المحاولة مرة أخرى',
    422: 'بيانات غير صالحة',
    429: 'طلبات كثيرة جداً — يرجى الانتظار قليلاً',
    500: 'خطأ في الخادم — يرجى المحاولة لاحقاً',
    502: 'الخادم غير متاح مؤقتاً',
    503: 'الخدمة غير متاحة حالياً',
    504: 'انتهت مهلة الاستجابة من الخادم',
  };

  return messages[error.status] ?? `خطأ غير متوقع (كود: ${error.status})`;
}

// ─── Token Refresh Logic ──────────────────────────────────────────────────────

function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {

  if (!isRefreshing) {
    // First request to hit a 401 — kick off the refresh
    isRefreshing = true;
    refreshToken$.next(null); // block the queue

    return authService.refreshToken().pipe(
      tap((newToken: string) => {
        isRefreshing = false;
        refreshToken$.next(newToken); // unblock the queue with the new token
      }),
      switchMap((newToken: string) => next(addHeaders(req, newToken))),
      catchError((refreshError) => {
        // Refresh itself failed — log out completely
        isRefreshing = false;
        refreshToken$.next(null);
        authService.logout();
        router.navigate(['/auth/login'], { queryParams: { reason: 'session_expired' } });
        return throwError(() => refreshError);
      }),
    );
  }

  // Other concurrent requests wait for the refresh to complete, then retry
  return refreshToken$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((newToken) => next(addHeaders(req, newToken))),
  );
}

// ─── Main Interceptor ─────────────────────────────────────────────────────────

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loadingService = inject(LoadingService);
  const toastService = inject(ToastService);

  // Check if this request should bypass the global loader
  const skipGlobalLoader = req.headers.has('X-Skip-Global-Loader');
  
  let modifiedReq = req;
  if (skipGlobalLoader) {
    modifiedReq = req.clone({ headers: req.headers.delete('X-Skip-Global-Loader') });
  }

  // Prepend BASE_URL for relative URLs (skip if already a full URL)
  const apiReq = modifiedReq.url.startsWith('http')
    ? modifiedReq
    : modifiedReq.clone({ url: `${BASE_URL}${modifiedReq.url}` });

  const token = authService.getToken();
  const authReq = addHeaders(apiReq, token);

  // Signal that a request is in-flight (e.g. to show a global spinner)
  if (!skipGlobalLoader) {
    loadingService.show();
  }

  return next(authReq).pipe(

    // ── Smart retry: only for transient errors, with exponential back-off ──
    retry({
      count: RETRY_COUNT,
      delay: (error, attempt) => {
        if (error instanceof HttpErrorResponse && !isRetryable(error)) {
          // Non-retryable — surface the error immediately
          return throwError(() => error);
        }
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s
        console.warn(`[API] Retry attempt ${attempt} in ${delay}ms`, error);
        return timer(delay);
      },
    }),

    // ── Centralised error handling ─────────────────────────────────────────
    catchError((error: HttpErrorResponse) => {
      const message = resolveErrorMessage(error);

      // Show global error notification (Except for "Not Found" which are used for validation)
      const isValidationNotFound = message.toLowerCase().includes('not found') || message.toLowerCase().includes('not exist');

      if (error.status !== 401 && !isValidationNotFound) {
        toastService.error(message);
      }

      if (error.status === 401) {
        // Try to silently refresh the token before logging out
        return handleTokenRefresh(req, next, authService, router);
      }

      if (error.status === 403) {
        router.navigate(['/forbidden']);
      }

      if (error.status === 404) {
        router.navigate(['/notfound']);
      }

      // Log to console (swap with your monitoring service — Sentry, Datadog, etc.)
      console.error(`[API Error] ${req.method} ${req.url}`, {
        status: error.status,
        message,
        correlationId: authReq.headers.get('X-Correlation-Id'),
      });

      return throwError(() => ({
        status: error.status,
        message,
        raw: error,
      }));
    }),

    // ── Always hide the loader when the request completes ─────────────────
    finalize(() => {
      if (!skipGlobalLoader) {
        loadingService.hide();
      }
    }),
  );
};