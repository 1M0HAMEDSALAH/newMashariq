import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export type LoginStep = 'credentials' | 'select-method' | 'verify-otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    deviceNo: ['web-browser'],
    rememberMe: [true]
  });

  otpCode = signal('');
  step = signal<LoginStep>('credentials');
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  userData = signal<any>(null);
  selectedMethod = signal<number | null>(null);

  verificationId = signal<number | null>(null);

  maskEmail(email: string): string {
    if (!email) return '********@domain.com';
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    const maskedUser = user.length > 3 ? user.substring(0, 3) + '****' : '***';
    return `${maskedUser}@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone) return '*******890';
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 5) return '*****';
    return `${cleanPhone.substring(0, 3)}****${cleanPhone.substring(cleanPhone.length - 3)}`;
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.status === 'success') {
          this.userData.set(response.data);
          if (response.data.loginStatus === 4) {
            this.step.set('select-method');
          } else {
            this.authService.saveUserSession(response.data);
            this.router.navigate(['/SystemAvailable/home']);
          }
        } else {
          this.errorMessage.set(response.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'حدث خطأ في الاتصال بالخادم.');
      }
    });
  }

  onSelectMethod(method: number) {
    this.selectedMethod.set(method);
  }

  requestOtp() {
    if (!this.selectedMethod()) {
      console.warn('No method selected');
      return;
    }

    this.isLoading.set(true);
    const username = this.loginForm.get('username')?.value || '';
    const receiverValue = this.selectedMethod() === 2 ? this.userData()?.email : this.userData()?.phone;

    console.log('Requesting OTP:', { username, method: this.selectedMethod(), receiverValue });

    this.authService.requestOtp(username, this.selectedMethod()!, receiverValue).subscribe({
      next: (res: any) => {
        console.log('OTP Request Response:', res);
        this.isLoading.set(false);

        // Deep extraction based on Flutter Repo structure: data -> otpResponse -> verficationId
        const otpResponse = res.data?.otpResponse;
        const vId = otpResponse?.verficationId || otpResponse?.verificationId || res.data?.verificationId || res.verificationId;

        if (vId) {
          this.verificationId.set(vId);
          this.step.set('verify-otp');
        } else {
          this.errorMessage.set('فشل استلام رقم التحقق من السيرفر.');
          console.error('Could not find verificationId in:', res);
        }
      },
      error: (err) => {
        console.error('OTP Request Error:', err);
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'حدث خطأ أثناء إرسال رمز التحقق.');
      }
    });
  }

  otpArray = ['', '', '', ''];

  updateOtp(val: string, index: number) {
    this.otpArray[index] = val;
    this.otpCode.set(this.otpArray.join(''));

    // Auto focus next input
    if (val && index < 3) {
      const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement;
      nextInput?.focus();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpArray[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement;
      prevInput?.focus();
    }
  }

  verifyOtp() {
    if (this.otpCode().length < 4 || !this.verificationId()) return;

    this.isLoading.set(true);
    const username = this.loginForm.get('username')?.value || '';
    const receiverValue = this.selectedMethod() === 2 ? this.userData()?.email : this.userData()?.phone;

    this.authService.verifyOtp({
      verificationId: this.verificationId()!,
      code: this.otpCode(),
      userName: username,
      otpReceiver: this.selectedMethod()!,
      otpReceiverValue: receiverValue,
      deviceNo: this.loginForm.get('deviceNo')?.value || 'web-browser'
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.status === 'success') {
          if (res.data?.jwtTokenDto) {
            this.authService.saveToken(res.data.jwtTokenDto);
          }
          this.authService.saveUserSession({
            ...this.userData(),
            ...res.data,
          });
          this.router.navigate(['/SystemAvailable/home']);
        } else {
          this.errorMessage.set(res.message || 'رمز التحقق غير صحيح.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'رمز التحقق غير صحيح.');
      }
    });
  }

  togglePassword() {
    const input = document.getElementById('password') as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  backToCredentials() {
    this.step.set('credentials');
    this.errorMessage.set(null);
  }
}
