import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private authService = inject(AuthService);

  menuItems = signal<MenuItem[]>([]);
  menuLoaded = signal(false);
  isCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  isMobileNav = signal(false);
  activeItem = signal<MenuItem | null>(null);

  fetchMenu(): void {
    this.authService.getSystemMenus().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.menuItems.set(res.data);
        }
        this.menuLoaded.set(true);
      },
      error: () => this.menuLoaded.set(true),
    });
  }

  setMobileNav(isMobile: boolean): void {
    this.isMobileNav.set(isMobile);
  }

  toggleSidebar(): void {
    if (this.isMobileNav()) {
      this.mobileMenuOpen.update((v) => !v);
      return;
    }
    this.isCollapsed.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }
}
