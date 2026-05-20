import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Tracks the number of active HTTP requests.
 * The interceptor calls show() / hide() automatically —
 * components just subscribe to isLoading$.
 *
 * Usage in a component:
 *   isLoading$ = inject(LoadingService).isLoading$;
 *
 * Usage in a template:
 *   <app-spinner *ngIf="isLoading$ | async" />
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = 0;
  private loading$ = new BehaviorSubject<number>(0);

  /** Emits true while at least one request is in-flight */
  readonly isLoading$: Observable<boolean> = this.loading$.pipe(
    map((count) => count > 0),
    distinctUntilChanged(),
  );

  show(): void {
    this.activeRequests++;
    this.loading$.next(this.activeRequests);
  }

  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.loading$.next(this.activeRequests);
  }
}