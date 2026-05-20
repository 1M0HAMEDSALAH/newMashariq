import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private authService = inject(AuthService);

  menuItems = signal<MenuItem[]>([]);
  isCollapsed = signal(false);
  activeItem = signal<MenuItem | null>(null);

  fetchMenu() {
    this.authService.getSystemMenus().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          console.log(res.data);
          this.menuItems.set(res.data);
        }
      }
    });
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }
}
