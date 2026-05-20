import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-bar">
      <div class="header-left">
        <button class="menu-toggle" (click)="sidebarService.toggleSidebar()">
          <span class="material-symbols-outlined">
            {{ sidebarService.isCollapsed() ? 'menu' : 'menu_open' }}
          </span>
        </button>
        <div class="page-title">
          <h1>الرئيسية</h1>
          <div class="crumbs">لوحة التحكم الأساسية</div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="search-pill">
          <span class="material-symbols-outlined">search</span>
          <input type="text" placeholder="ابحث في النظام...">
        </div>
        
        <div class="icon-actions">
          <div class="action-item">
            <span class="material-symbols-outlined">notifications</span>
            <span class="dot"></span>
          </div>
        </div>

        <div class="user-chip">
          <div class="avatar">
            <img src="https://ui-avatars.com/api/?name=Mohamed&background=ED7A44&color=fff" alt="">
          </div>
          <div class="info">
            <span class="name">محمد صلاح</span>
            <span class="role">مدير النظام</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      background: white;
      border-radius: 24px;
      padding: 15px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
      border: 1px solid rgba(0,0,0,0.02);
    }

    .header-left { display: flex; align-items: center; gap: 20px; }
    .menu-toggle {
      width: 45px; height: 45px; border: none; background: #f1f5f9;
      color: #1e293b; border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    .page-title h1 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; }
    .crumbs { font-size: 12px; color: #64748b; }

    .header-right { display: flex; align-items: center; gap: 20px; }
    .search-pill {
      background: #f1f5f9; padding: 10px 20px; border-radius: 15px;
      display: flex; align-items: center; gap: 10px; width: 280px;
    }
    .search-pill input { border: none; background: transparent; outline: none; width: 100%; }

    .icon-actions { display: flex; gap: 15px; }
    .action-item {
      position: relative; color: #64748b; cursor: pointer;
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      background: #f8fafc; border-radius: 12px;
    }
    .action-item .dot { position: absolute; top: 10px; right: 10px; width: 6px; height: 6px; background: #ED7A44; border-radius: 50%; }

    .user-chip {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 6px 6px 15px; background: white; border-radius: 50px;
      border: 1px solid #f1f5f9; cursor: pointer;
    }
    .user-chip .avatar img { width: 38px; height: 38px; border-radius: 50%; }
    .user-chip .name { font-size: 14px; font-weight: 700; color: #1e293b; display: block; }
    .user-chip .role { font-size: 11px; color: #64748b; display: block; }
  `]
})
export class HeaderComponent {
  sidebarService = inject(SidebarService);
}
