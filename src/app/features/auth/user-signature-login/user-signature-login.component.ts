import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FilterBarComponent, FilterField } from '../../../shared/components/filter-bar/filter-bar.component';

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

    this.authService.getAllUsers(params).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.users = res.data.items || [];
          this.totalItemCount = res.data.totalItemCount || 0;
        } else {
          this.users = [];
          this.totalItemCount = 0;
        }
        this.isLoading = false;
      },
      error: () => {
        this.users = [];
        this.totalItemCount = 0;
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.pageNo = page;
    this.fetchUsers();
  }

  loginAs(user: any): void {
    console.log('Logging in as:', user);
    alert('جاري تسجيل الدخول بحساب: ' + user.fullNameArabic);
  }
}
