import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FilterBarComponent, FilterField } from '../../../shared/components/filter-bar/filter-bar.component';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-user-signature-login',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, FilterBarComponent],
  templateUrl: './user-signature-login.component.html',
  styleUrl: './user-signature-login.component.css'
})
export class UserSignatureLoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private sidebarService = inject(SidebarService);

  filterFields: FilterField[] = [
    { key: 'Username', type: 'text', label: 'اسم المستخدم', placeholder: 'ادخل اسم المستخدم...' },
    { key: 'CardNo', type: 'text', label: 'رقم البطاقة', placeholder: 'ادخل رقم البطاقة...' },
    { key: 'FullName', type: 'text', label: 'الاسم بالكامل', placeholder: 'ادخل الاسم بالكامل...' }
  ];

  filters = {
    Username: '',
    CardNo: '',
    FullName: ''
  };

  users: any[] = [];
  totalItemCount = 0;
  pageNo = 1;
  pageSize = 10;
  isLoading = false;

  ngOnInit(): void {
    this.fetchUsers();
  }

  onFilterSubmit(filters: Record<string, any>): void {
    this.filters = {
      Username: filters['Username'] || '',
      CardNo: filters['CardNo'] || '',
      FullName: filters['FullName'] || ''
    };
    this.pageNo = 1;
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading = true;
    const params = {
      ...this.filters,
      pageNo: this.pageNo,
      pageSize: this.pageSize
    };

    this.authService.getAllUsers(params).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        console.log('getAllUsers response:', res);
        if (res && res.data) {
          this.users = res.data.items || [];
          this.totalItemCount = res.data.totalItemCount || 0;
        } else {
          this.users = [];
          this.totalItemCount = 0;
        }
      },
      error: (err) => {
        console.error('getAllUsers error:', err);
        this.users = [];
        this.totalItemCount = 0;
      }
    });
  }

  onPageChange(page: number): void {
    this.pageNo = page;
    this.fetchUsers();
  }

  loginAs(user: any): void {
    const identifier = user.userName || user.cardNumber;
    if (!identifier) {
      this.toastService.error('لا يمكن تسجيل الدخول لعدم وجود اسم مستخدم أو رقم بطاقة');
      return;
    }

    this.isLoading = true;
    this.authService.virtualLogin(identifier).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.toastService.success('تم تسجيل الدخول بنجاح');
          this.sidebarService.fetchMenu();
          this.router.navigate(['/SystemAvailable/home']);
        } else {
          this.toastService.error(res.message || 'حدث خطأ أثناء تسجيل الدخول');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error('فشل الاتصال بالخادم أثناء تسجيل الدخول');
      }
    });
  }
}
