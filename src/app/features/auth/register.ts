import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  currentStep = signal(1);
  isLoading = signal(false);

  registerForm = this.fb.group({
    // Step 1: Identity
    cardNo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],

    // Step 2: Dates
    birthDatHijri: ['', [Validators.required]],
    cardExpiredDate: ['', [Validators.required]],

    // Step 3: Names
    firstNameArabic: ['', [Validators.required]],
    surNameArabic: ['', [Validators.required]],
    grandparentNameArabic: ['', [Validators.required]],
    familyNameArabic: ['', [Validators.required]],

    // Step 4: Contact & Type
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    type: [0, [Validators.required]], // 0: مساهم, 1: آخر
    mtovType: [0],

    // Step 5: Security
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async nextStep() {
    const step = this.currentStep();
    console.log('Next Step Clicked. Current Step:', step);

    if (step === 1) {
      const cardNo = this.registerForm.get('cardNo')?.value;
      if (this.registerForm.get('cardNo')?.invalid) {
        this.toast.warning('يرجى إدخال رقم هوية صحيح (10 أرقام)');
        return;
      }
      this.validateField('checkCardNo', cardNo!, 2);
    }
    else if (step === 2) {
      if (this.registerForm.get('birthDatHijri')?.invalid || this.registerForm.get('cardExpiredDate')?.invalid) {
        this.toast.warning('يرجى إكمال جميع التواريخ');
        return;
      }
      this.currentStep.set(3);
    }
    else if (step === 3) {
      const fullName = `${this.registerForm.value.firstNameArabic} ${this.registerForm.value.surNameArabic} ${this.registerForm.value.grandparentNameArabic} ${this.registerForm.value.familyNameArabic}`;
      this.validateField('checkFullName', fullName, 4);
    }
    else if (step === 4) {
      if (this.registerForm.get('email')?.invalid || this.registerForm.get('phone')?.invalid) {
        this.toast.warning('يرجى إدخال بريد إلكتروني وجوال صحيح');
        return;
      }

      this.isLoading.set(true);

      const checkAvailability = (res: any) => {
        const msg = (
          res?.error?.message ||
          res?.raw?.error?.message ||
          res?.message ||
          (res?.errors && res?.errors[0]) ||
          ''
        ).toLowerCase();

        if (res === true || res?.data === true || (msg === 'success' && res?.data === true)) return false;
        return res === false || res?.data === false || msg.includes('not found') || msg.includes('not exist');
      };

      this.authService.checkEmail(this.registerForm.value.email!).subscribe({
        next: (res: any) => {
          if (checkAvailability(res)) {
            this.authService.checkPhone(this.registerForm.value.phone!).subscribe({
              next: (pRes: any) => {
                this.isLoading.set(false);
                if (checkAvailability(pRes)) this.currentStep.set(5);
                else this.toast.error(pRes?.message || 'رقم الهاتف مسجل مسبقاً');
              },
              error: (pErr) => {
                this.isLoading.set(false);
                if (checkAvailability(pErr.raw || pErr)) this.currentStep.set(5);
              }
            });
          } else {
            this.isLoading.set(false);
            this.toast.error(res?.message || 'البريد الإلكتروني مسجل مسبقاً');
          }
        },
        error: (err) => {
          if (checkAvailability(err.raw || err)) {
            this.authService.checkPhone(this.registerForm.value.phone!).subscribe({
              next: (pRes: any) => {
                this.isLoading.set(false);
                if (checkAvailability(pRes)) this.currentStep.set(5);
                else this.toast.error(pRes?.message || 'رقم الهاتف مسجل مسبقاً');
              },
              error: (pErr) => {
                this.isLoading.set(false);
                if (checkAvailability(pErr.raw || pErr)) this.currentStep.set(5);
              }
            });
          } else {
            this.isLoading.set(false);
          }
        }
      });
    }
  }

  private validateField(method: keyof AuthService, value: string, targetStep: number) {
    this.isLoading.set(true);
    const serviceMethod = this.authService[method] as Function;

    const handleValidationResponse = (res: any) => {
      console.log('--- DEBUG VALIDATION START ---');
      console.log('Full Response Object:', res);

      // Extract message - PRIORITIZE the error body message over generic HttpErrorResponse message
      const message = (
        res?.error?.message ||
        res?.raw?.error?.message ||
        res?.message ||
        (res?.errors && res?.errors[0]) ||
        ''
      ).toLowerCase();

      console.log('Extracted Message Text:', message);

      // 1. If response is explicitly TRUE, or message is "success" with data: true -> It EXISTS
      const explicitlyExists = res === true || res?.data === true || (message === 'success' && res?.data === true);

      if (explicitlyExists) {
        console.log('Result: ALREADY EXISTS');
        this.toast.error('هذه البيانات مسجلة مسبقاً بالفعل');
        return false;
      }

      // 2. If it's a "Not Found" message or explicitly FALSE -> AVAILABLE
      const isNotFound = message.includes('not found') || message.includes('not exist') || res === false || res?.data === false;

      if (isNotFound) {
        console.log('Result: SUCCESS (Available)');
        this.currentStep.set(targetStep);
        this.toast.success('تم التحقق من البيانات بنجاح');
        return true;
      }

      console.warn('Result: FAILED (Duplicate or Other Error)');
      console.log('--- DEBUG VALIDATION END ---');
      return false;
    };

    serviceMethod.call(this.authService, value).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (!handleValidationResponse(res)) {
          if (res?.message !== 'success') this.toast.error(res?.message || 'هذه البيانات مسجلة مسبقاً');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        // Pass the whole error object which contains our extracted message from interceptor
        if (!handleValidationResponse(err)) {
          console.error(`Validation error for ${method}:`, err);
        }
      }
    });
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.toast.warning('يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    this.isLoading.set(true);
    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.status === 'success') {
          this.toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
          this.router.navigate(['/auth/login']);
        } else {
          this.toast.error(res.message || 'فشل إنشاء الحساب');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        // Toast is already handled by interceptor
      }
    });
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
