import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { LoginResponse } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`Auth/login`, credentials).pipe(
      tap(res => {
        if (res.status === 'success' && res.data.jwtTokenDto) {
          this.saveToken(res.data.jwtTokenDto);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post('Auth/register', userData);
  }

  checkCardNo(cardNo: string): Observable<any> {
    return this.http.post('Auth/checkCardno', { cardNumber: cardNo });
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post('Auth/checkEmailAddress', { email });
  }

  checkPhone(phone: string): Observable<any> {
    return this.http.post('Auth/checkPhoneNumber', { phone });
  }

  checkFullName(fullName: string): Observable<any> {
    return this.http.post('Auth/checkFullName', { fullName });
  }

  checkUsername(username: string): Observable<any> {
    return this.http.post('Auth/checkUserName', { userName: username });
  }

  requestOtp(username: string, otpReceiver: number, otpReceiverValue: string): Observable<any> {
    const body = {
      userName: username,
      otpReceiver: otpReceiver,
      otpReceiverValue: otpReceiverValue
    };
    return this.http.post('Auth/SendOTPToVerifyMobileAndEmail', body);
  }

  verifyOtp(params: {
    verificationId: number,
    code: string,
    userName: string,
    otpReceiver: number,
    otpReceiverValue: string,
    deviceNo: string
  }): Observable<any> {
    const body = {
      ...params,
      remember: true
    };
    return this.http.post('Auth/CheckVericationAndVerifyReceiverValue', body);
  }

  saveToken(token: any) {
    let tokenStr = '';
    if (typeof token === 'object') {
      tokenStr = token.accessToken || token.authToken || JSON.stringify(token);
    } else {
      tokenStr = token;
    }
    
    if (tokenStr.toLowerCase().startsWith('bearer ')) {
      tokenStr = tokenStr.substring(7);
    }
    
    localStorage.setItem('auth_token', tokenStr);
  }

  getSystemMenus(): Observable<any> {
    return this.http.get('layouts/SystemMenus');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  /**
   * Placeholder for token refresh logic.
   * If the backend supports a refresh token endpoint, implement it here.
   */
  refreshToken(): Observable<string> {
    // This is a placeholder. Real implementation would call /api/Auth/refresh
    // For now, we return an error to trigger the logout logic in the interceptor
    return throwError(() => new Error('Refresh token not implemented'));
  }
}
