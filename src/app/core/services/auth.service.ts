import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { LoginResponse } from '../models/menu-item.model';

export interface UserProfile {
  fullName: string;
  phone: string;
  partyId: number;
}

const USER_PROFILE_KEY = 'user_profile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`Auth/login`, credentials).pipe(
      tap(res => {
        if (res.status === 'success' && res.data) {
          if (res.data.jwtTokenDto) {
            this.saveToken(res.data.jwtTokenDto);
          }
          this.saveUserSession(res.data);
        }
      })
    );
  }

  virtualLogin(usernameOrCardNumber: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`Auth/VirtualLogin`, { usernameOrCardNumber }).pipe(
      tap(res => {
        if (res.status === 'success' && res.data) {
          if (res.data.jwtTokenDto) {
            this.saveToken(res.data.jwtTokenDto);
          }
          this.saveUserSession(res.data);
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

  getAllUsers(params: { Username?: string; CardNo?: string; FullName?: string; pageNo: number; pageSize: number }): Observable<any> {
    let queryParams = `SM.Page=${params.pageNo}&SM.PageSize=${params.pageSize}`;
    if (params.Username) queryParams += `&Username=${encodeURIComponent(params.Username)}`;
    if (params.CardNo) queryParams += `&CardNo=${encodeURIComponent(params.CardNo)}`;
    if (params.FullName) queryParams += `&FullName=${encodeURIComponent(params.FullName)}`;

    return this.http.get(`Auth/GetAllUsers?${queryParams}`, {
      headers: { 'X-Skip-Global-Loader': 'true' }
    });
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

  saveUserSession(data: Record<string, unknown> | null | undefined): void {
    if (!data) return;

    const partyId = this.pickField(data, [
      'party_SID',
      'partySid',
      'partyId',
      'requestedByPartyId',
    ]);
    if (partyId != null && partyId !== '') {
      localStorage.setItem('party_sid', String(partyId));
    }

    const existing = this.getUserProfile();
    const fullName = this.pickField(data, [
      'fullName',
      'FullName',
      'partyName',
      'PartyName',
      'name',
      'userFullName',
      'displayName',
    ]);
    const phone = this.pickField(data, [
      'phone',
      'Phone',
      'mobile',
      'Mobile',
      'phoneNumber',
      'partyMobile',
      'mobileNo',
      'mobileNumber',
    ]);

    const profile: UserProfile = {
      fullName: (fullName != null ? String(fullName) : '') || existing?.fullName || '',
      phone: (phone != null ? String(phone) : '') || existing?.phone || '',
      partyId: partyId != null ? Number(partyId) : existing?.partyId ?? 0,
    };

    if (profile.fullName || profile.phone || profile.partyId) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    }
  }

  getUserProfile(): UserProfile | null {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  getReporterDefaults(): { reporterName: string; reporterPhone: string } {
    const profile = this.getUserProfile();
    return {
      reporterName: profile?.fullName?.trim() ?? '',
      reporterPhone: profile?.phone?.trim() ?? '',
    };
  }

  getPartyId(): number {
    const fromProfile = this.getUserProfile()?.partyId;
    if (fromProfile) return fromProfile;
    const raw = localStorage.getItem('party_sid');
    return raw ? Number(raw) : 0;
  }

  private pickField(
    data: Record<string, unknown>,
    keys: string[]
  ): unknown {
    for (const key of keys) {
      const val = data[key];
      if (val != null && val !== '') return val;
    }
    return null;
  }

  getSystemMenus(): Observable<any> {
    return this.http.get('layouts/SystemMenus');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('party_sid');
    localStorage.removeItem(USER_PROFILE_KEY);
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
