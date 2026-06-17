import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  pageTitle = signal('الرئيسية');
  pageSubtitle = signal('لوحة التحكم الموحدة');

  ngOnInit(): void {
    this.updatePageMeta(this.router.url);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => this.updatePageMeta(e.urlAfterRedirects));
  }

  displayName(): string {
    const name = this.authService.getUserProfile()?.fullName?.trim();
    return name || 'مستخدم النظام';
  }

  avatarUrl(): string {
    const name = encodeURIComponent(this.displayName());
    return `https://ui-avatars.com/api/?name=${name}&background=ED7A44&color=fff&size=128`;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/auth/login';
  }

  private updatePageMeta(url: string): void {
    if (url.includes('/SystemAvailable/home') && !url.includes('lost-pilgrims') && !url.includes('buses')) {
      this.pageTitle.set('الرئيسية');
      this.pageSubtitle.set('لوحة التحكم الموحدة');
      return;
    }
    if (url.includes('/buses/')) {
      this.pageTitle.set('إدارة الحافلات');
      this.pageSubtitle.set('متابعة الحافلات والرحلات');
      return;
    }
    if (url.includes('/lost-pilgrims/')) {
      this.pageTitle.set('بلاغات التائهين');
      this.pageSubtitle.set('إرشاد ومتابعة البلاغات');
      return;
    }
    this.pageTitle.set('مشارق');
    this.pageSubtitle.set('نظام التشغيل');
  }
}
