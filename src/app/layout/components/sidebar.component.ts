import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { getFeatureRoute } from '../../core/navigation/feature-navigation';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="sidebarService.isCollapsed()">
      <div class="sidebar-inner">
        <a routerLink="/SystemAvailable/home" class="sidebar-header" (click)="sidebarService.closeMobileMenu()">
          @if (!sidebarService.isCollapsed()) {
            <img src="https://haj.mashariq.com.sa/Content/layouts/assets/images/logo-dark.png" alt="Logo" class="logo">
          } @else {
            <div class="brand-circle">M</div>
          }
        </a>

        <div class="sidebar-search" *ngIf="!sidebarService.isCollapsed()">
          <div class="search-input-wrapper">
            <input type="text" placeholder="بحث" #searchInput>
            <button class="search-icon-btn">
              <span class="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        <div class="sidebar-content">
          <nav class="nav-list">
            @for (item of sidebarService.menuItems(); track item.pageId) {
              <div class="nav-group" [title]="sidebarService.isCollapsed() ? item.eName : ''">
                <div class="nav-item" 
                     (click)="toggleGroup(item)" 
                     [class.active]="item === sidebarService.activeItem()"
                     [class.expanded]="isOpen(item)">
                  @if (isSvg(item.iconPath)) {
                    <div class="nav-icon svg-icon" [style.-webkit-mask-image]="getSvgUrl(item.iconPath)" [style.mask-image]="getSvgUrl(item.iconPath)"></div>
                  } @else {
                    <i [class]="item.iconPath || 'fa-solid fa-layer-group'" class="nav-icon"></i>
                  }
                  <span class="label" *ngIf="!sidebarService.isCollapsed()">{{ item.eName }}</span>
                  @if (hasSub(item) && !sidebarService.isCollapsed()) {
                    <span class="material-symbols-outlined arrow">chevron_left</span>
                  }
                </div>
                
                @if (hasSub(item) && isOpen(item) && !sidebarService.isCollapsed()) {
                  <div class="nav-sub">
                    @for (sub of (item.subMenu || item.subMenus || []); track sub.pageId || $index) {
                      
                      @if (hasSub(sub)) {
                        <div class="nav-sub-item" 
                             (click)="toggleGroup(sub)" 
                             [class.expanded]="isOpen(sub)">
                          @if (isSvg(sub.iconPath)) {
                            <div class="nav-icon svg-icon sub-icon" [style.-webkit-mask-image]="getSvgUrl(sub.iconPath)" [style.mask-image]="getSvgUrl(sub.iconPath)"></div>
                          } @else {
                            <i [class]="sub.iconPath || 'fa-solid fa-folder'" class="nav-icon sub-icon"></i>
                          }
                          <span class="label">{{ sub.eName }}</span>
                          <span class="material-symbols-outlined arrow">chevron_left</span>
                        </div>
                        
                        @if (isOpen(sub)) {
                          <div class="nav-sub level-3">
                            @for (subSub of sub.subMenus; track subSub.pageId || $index) {
                              <a [routerLink]="getRoute(subSub.pageId)" class="sub-link" routerLinkActive="active" [title]="sidebarService.isCollapsed() ? subSub.eName : ''" (click)="sidebarService.closeMobileMenu()">
                                <span class="dot"></span>
                                <span>{{ subSub.eName }}</span>
                              </a>
                            }
                          </div>
                        }
                      } @else {
                        <a [routerLink]="getRoute(sub.pageId)" class="sub-link" routerLinkActive="active" [title]="sidebarService.isCollapsed() ? sub.eName : ''" (click)="sidebarService.closeMobileMenu()">
                          @if (isSvg(sub.iconPath)) {
                            <div class="nav-icon svg-icon sub-icon" [style.-webkit-mask-image]="getSvgUrl(sub.iconPath)" [style.mask-image]="getSvgUrl(sub.iconPath)"></div>
                          } @else if (sub.iconPath) {
                            <i [class]="sub.iconPath" class="nav-icon sub-icon"></i>
                          } @else {
                            <span class="dot"></span>
                          }
                          <span>{{ sub.eName }}</span>
                        </a>
                      }
                    }
                  </div>
                }
              </div>
            }
          </nav>
        </div>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()" [title]="sidebarService.isCollapsed() ? 'خروج' : ''">
            <span class="material-symbols-outlined">logout</span>
            <span class="label" *ngIf="!sidebarService.isCollapsed()">خروج</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: calc(100vh - 30px);
    }
    
    .sidebar.collapsed {
      width: 85px;
    }

    .sidebar-inner {
      background: white;
      height: 100%;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.02);
      overflow: hidden;
    }

    .sidebar-header {
      padding: 30px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100px;
      transition: all 0.3s;
      text-decoration: none;
    }

    .logo { max-width: 160px; transition: all 0.3s; }
    .brand-circle {
      width: 45px; height: 45px;
      background: #ED7A44;
      color: white;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    .sidebar-search {
      padding: 0 15px 15px 15px;
    }
    
    .search-input-wrapper {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 4px;
    }
    
    .search-input-wrapper input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 8px 12px;
      font-size: 14px;
      color: #1e293b;
      outline: none;
      font-family: inherit;
    }
    
    .search-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: #f97316;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 15px;
    }
    
    .sidebar-content::-webkit-scrollbar { width: 4px; }
    .sidebar-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

    .nav-list { display: flex; flex-direction: column; gap: 6px; }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-radius: 12px;
      color: #5b6b82;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      font-size: 14px;
      gap: 12px;
      background: transparent;
    }
    
    .label {
      white-space: normal;
      line-height: 1.4;
      flex: 1;
    }
    
    .sidebar.collapsed .nav-item {
      padding: 14px 0;
      justify-content: center;
    }

    .nav-icon { font-size: 22px; width: 24px; text-align: center; transition: all 0.3s; flex-shrink: 0; color: currentColor; }
    
    .svg-icon {
      background-color: currentColor;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      height: 24px;
    }
    
    .sidebar.collapsed .nav-item .nav-icon {
      font-size: 22px;
    }

    .nav-item:hover { background: #f1f5f9; color: #1e293b; }
    .nav-item.active { background: #fff5f0; color: #ED7A44; }

    .arrow { font-size: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; color: #94a3b8; }
    .expanded .arrow { transform: rotate(-90deg); color: #1e293b; }

    .nav-sub {
      margin-top: 5px;
      display: flex; flex-direction: column; gap: 4px;
      padding-right: 15px;
    }

    .nav-sub-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 15px;
      border-radius: 12px;
      color: #5b6b82;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sub-icon { font-size: 18px; width: 20px; height: 20px; }

    .nav-sub-item:hover { background: #f1f5f9; color: #1e293b; }
    .nav-sub-item.expanded { color: #ED7A44; font-weight: 600; }
    .nav-sub-item .dot { width: 4px; height: 4px; background: #cbd5e1; border-radius: 50%; flex-shrink: 0; }
    .nav-sub-item.expanded .dot { background: #ED7A44; transform: scale(1.5); }
    
    .nav-sub-item .label {
      white-space: normal;
      line-height: 1.4;
      flex: 1;
    }

    .nav-sub.level-3 {
      padding-right: 25px;
      margin-top: 0;
    }

    .sub-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 15px;
      border-radius: 12px;
      text-decoration: none;
      color: #5b6b82;
      font-size: 13px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sub-link span:not(.dot) {
      white-space: normal;
      line-height: 1.4;
      flex: 1;
    }

    .sub-link .dot { width: 4px; height: 4px; background: #cbd5e1; border-radius: 50%; flex-shrink: 0; }
    .sub-link:hover, .sub-link.active { background: #fff5f0; color: #ED7A44; }
    .sub-link.active .dot { background: #ED7A44; transform: scale(1.5); }

    .sidebar-footer { padding: 20px; border-top: 1px solid #f1f5f9; }
    .logout-btn {
      width: 100%; border: none; background: #fff1f2; color: #e11d48;
      padding: 10px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      cursor: pointer; font-weight: 700; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
    }
    .logout-btn:hover { background: #ffe4e6; transform: translateY(-2px); }
  `]
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  openGroups = new Set<any>();

  isSvg(path: string | undefined | null): boolean {
    return !!path && path.trim().toLowerCase().endsWith('.svg');
  }

  getSvgUrl(path: string): string {
    const cleanPath = path.trim();
    return `url(/Content/layouts/assets/images/icons/${cleanPath})`;
  }
  hasSub(item: any) {
    return (item.subMenu?.length || item.subMenus?.length) > 0;
  }

  toggleGroup(item: any) {
    if (this.sidebarService.isCollapsed()) return;
    if (this.openGroups.has(item)) {
      this.openGroups.delete(item);
    } else {
      this.openGroups.add(item);
    }
  }

  isOpen(item: any) {
    return this.openGroups.has(item);
  }

  logout() {
    this.authService.logout();
    window.location.href = '/auth/login';
  }

  getRoute(pageId: number | string): any[] {
    return getFeatureRoute(pageId);
  }
}
