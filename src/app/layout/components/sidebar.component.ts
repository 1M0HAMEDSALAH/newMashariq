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
            <img src="https://haj.mashariq.com.sa/Content/layouts/assets/images/logo-dark.png" alt="Logo" class="logo-mini">
          }
        </a>

        @if (!sidebarService.isCollapsed()) {
          <div class="sidebar-search">
            <div class="search-input-wrapper">
              <input type="text" placeholder="بحث" #searchInput>
              <button class="search-icon-btn">
                <span class="material-symbols-outlined">search</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="collapsed-search">
            <button class="collapsed-search-btn" title="بحث">
              <span class="material-symbols-outlined">search</span>
            </button>
          </div>
        }

        <div class="sidebar-content">
          <nav class="nav-list">
            @for (item of sidebarService.menuItems(); track item.pageId) {
              <div class="nav-group" 
                   [title]="sidebarService.isCollapsed() && !hasSub(item) ? item.eName : ''"
                   (mouseenter)="onGroupHover(item, $event)"
                   (mouseleave)="onGroupLeave()">
                <div class="nav-item" 
                     (click)="toggleGroup(item)" 
                     [class.active]="item === sidebarService.activeItem()"
                     [class.expanded]="isOpen(item)"
                     [class.flyout-active]="sidebarService.isCollapsed() && hoveredItem === item">
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
                
                <!-- Normal expanded sub-menu (non-collapsed) -->
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
                              <a [routerLink]="getRoute(subSub.pageId)" class="sub-link" routerLinkActive="active" (click)="sidebarService.closeMobileMenu()">
                                <span class="dot"></span>
                                <span>{{ subSub.eName }}</span>
                              </a>
                            }
                          </div>
                        }
                      } @else {
                        <a [routerLink]="getRoute(sub.pageId)" class="sub-link" routerLinkActive="active" (click)="sidebarService.closeMobileMenu()">
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

                <!-- Flyout popup (collapsed mode on hover) -->
                @if (sidebarService.isCollapsed() && hoveredItem === item && hasSub(item)) {
                  <div class="flyout-popup" [ngStyle]="flyoutStyle">
                    <div class="flyout-header">{{ item.eName }}</div>
                    <div class="flyout-body">
                      @for (sub of (item.subMenu || item.subMenus || []); track sub.pageId || $index) {
                        @if (hasSub(sub)) {
                          <div class="flyout-group">
                            <div class="flyout-group-title" (click)="toggleFlyoutSub(sub)">
                              <span>{{ sub.eName }}</span>
                              <span class="material-symbols-outlined flyout-arrow" [class.open]="isFlyoutSubOpen(sub)">chevron_left</span>
                            </div>
                            @if (isFlyoutSubOpen(sub)) {
                              @for (subSub of sub.subMenus; track subSub.pageId || $index) {
                                <a [routerLink]="getRoute(subSub.pageId)" class="flyout-link" routerLinkActive="active" (click)="closeFlyout()">
                                  <span class="dot"></span>
                                  <span>{{ subSub.eName }}</span>
                                </a>
                              }
                            }
                          </div>
                        } @else {
                          <a [routerLink]="getRoute(sub.pageId)" class="flyout-link" routerLinkActive="active" (click)="closeFlyout()">
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
                  </div>
                }

                <!-- Flyout tooltip (collapsed mode, no sub-items) -->
                @if (sidebarService.isCollapsed() && hoveredItem === item && !hasSub(item)) {
                  <div class="flyout-tooltip" [ngStyle]="flyoutStyle">{{ item.eName }}</div>
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
    /* ==============================
       FULL SIDEBAR
    ============================== */
    .sidebar {
      width: 250px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: calc(100vh - 30px);
    }

    /* ==============================
       MINI / COLLAPSED MODE
       → matches the orange icon strip
    ============================== */
    .sidebar.collapsed {
      width: 62px;
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
      transition: background 0.3s, border-radius 0.3s;
    }

    .sidebar.collapsed .sidebar-inner {
      background: #ED7A44;
      border-color: transparent;
      box-shadow: 0 8px 32px rgba(237, 122, 68, 0.35);
      overflow: visible;
    }

    /* ── Header ── */
    .sidebar-header {
      padding: 30px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100px;
      transition: all 0.3s;
      text-decoration: none;
    }

    .sidebar.collapsed .sidebar-header {
      padding: 18px 0;
      min-height: auto;
    }

    .logo { max-width: 160px; transition: all 0.3s; }

    .logo-mini {
      width: 36px;
      height: 36px;
      object-fit: contain;
      filter: brightness(0) invert(1);
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    /* ── Search ── */
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
      width: 28px; height: 28px;
      border-radius: 10px;
      background: #f97316;
      color: white;
      border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .collapsed-search {
      display: flex;
      justify-content: center;
      padding: 0 8px 10px;
    }

    .collapsed-search-btn {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 20px;
    }

    .collapsed-search-btn:hover {
      background: rgba(255,255,255,0.35);
    }

    /* ── Nav content ── */
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 15px;
    }

    .sidebar.collapsed .sidebar-content {
      padding: 0 8px;
      overflow: visible;
    }

    .sidebar-content::-webkit-scrollbar { width: 4px; }
    .sidebar-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

    .sidebar.collapsed .sidebar-content::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
    }

    /* ── Nav list ── */
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

    /* Collapsed nav item → white icon centered on orange bg */
    .sidebar.collapsed .nav-item {
      padding: 12px 0;
      justify-content: center;
      color: rgba(255,255,255,0.75);
      border-radius: 14px;
    }

    .sidebar.collapsed .nav-item:hover {
      background: rgba(255,255,255,0.18);
      color: white;
    }

    .sidebar.collapsed .nav-item.active {
      background: rgba(255,255,255,0.28);
      color: white;
    }

    /* ── Icons ── */
    .nav-icon {
      font-size: 22px;
      width: 24px;
      text-align: center;
      transition: all 0.3s;
      flex-shrink: 0;
      color: currentColor;
    }

    .sidebar.collapsed .nav-icon {
      font-size: 22px;
      width: 24px;
    }

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

    /* Normal hover / active */
    .nav-item:hover { background: #f1f5f9; color: #1e293b; }
    .nav-item.active { background: #fff5f0; color: #ED7A44; }

    /* ── Arrow ── */
    .arrow {
      font-size: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      color: #94a3b8;
    }
    .expanded .arrow { transform: rotate(-90deg); color: #1e293b; }

    /* ── Sub menus ── */
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

    /* ── Footer ── */
    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid #f1f5f9;
    }

    .sidebar.collapsed .sidebar-footer {
      padding: 14px 8px;
      border-top-color: rgba(255,255,255,0.2);
    }

    .logout-btn {
      width: 100%; border: none; background: #fff1f2; color: #e11d48;
      padding: 10px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      cursor: pointer; font-weight: 700;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
    }
    .logout-btn:hover { background: #ffe4e6; transform: translateY(-2px); }

    .sidebar.collapsed .logout-btn {
      background: rgba(255,255,255,0.2);
      color: white;
      border-radius: 14px;
      padding: 10px 0;
    }

    .sidebar.collapsed .logout-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }

    /* ==============================
       FLYOUT POPUP (collapsed hover)
    ============================== */
    .nav-group {
      position: relative;
    }

    .flyout-popup {
      position: absolute;
      right: calc(100% + 12px);
      left: auto;
      top: 0;
      width: 260px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      z-index: 500;
      direction: rtl;
      animation: flyoutIn 0.2s ease-out;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.04);
    }

    @keyframes flyoutIn {
      from { opacity: 0; transform: translateX(8px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .flyout-header {
      padding: 14px 18px;
      font-weight: 800;
      font-size: 15px;
      color: #1e293b;
      background: linear-gradient(135deg, #fff8f5, #fff);
      border-bottom: 1px solid #f1f5f9;
    }

    .flyout-body {
      padding: 8px;
      max-height: 350px;
      overflow-y: auto;
    }

    .flyout-body::-webkit-scrollbar { width: 4px; }
    .flyout-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 4px; }

    .flyout-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      color: #5b6b82;
      font-size: 13px;
      transition: all 0.2s;
      font-weight: 500;
    }

    .flyout-link:hover {
      background: #fff5f0;
      color: #ED7A44;
    }

    .flyout-link.active {
      background: #fff5f0;
      color: #ED7A44;
      font-weight: 700;
    }

    .flyout-link .dot {
      width: 5px; height: 5px;
      background: #cbd5e1;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .flyout-link.active .dot,
    .flyout-link:hover .dot {
      background: #ED7A44;
    }

    .flyout-link .sub-icon {
      font-size: 16px;
      width: 18px;
      height: 18px;
      color: currentColor;
    }

    /* Flyout sub-groups */
    .flyout-group {
      margin-bottom: 2px;
    }

    .flyout-group-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 10px;
      color: #334155;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .flyout-group-title:hover {
      background: #f8fafc;
    }

    .flyout-arrow {
      font-size: 18px;
      color: #94a3b8;
      transition: transform 0.2s;
    }

    .flyout-arrow.open {
      transform: rotate(-90deg);
      color: #ED7A44;
    }

    .flyout-group .flyout-link {
      padding-right: 28px;
    }

    /* Flyout tooltip (no subs) */
    .flyout-tooltip {
      position: absolute;
      right: calc(100% + 12px);
      left: auto;
      top: 50%;
      transform: translateY(-50%);
      background: #1e293b;
      color: white;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      z-index: 500;
      direction: rtl;
      animation: flyoutIn 0.15s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .flyout-tooltip::after {
      content: '';
      position: absolute;
      left: -6px;
      right: auto;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: #1e293b;
      border-radius: 2px;
    }

    /* Active icon highlight when flyout is open */
    .sidebar.collapsed .nav-item.flyout-active {
      background: rgba(255,255,255,0.3);
      color: white;
    }
  `]
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  openGroups = new Set<any>();
  hoveredItem: any = null;
  private hoverTimeout: any = null;
  flyoutOpenSubs = new Set<any>();
  flyoutStyle: any = {};

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

  /* ── Flyout hover logic ── */
  onGroupHover(item: any, event?: MouseEvent) {
    if (!this.sidebarService.isCollapsed()) return;
    clearTimeout(this.hoverTimeout);
    this.hoveredItem = item;
    this.flyoutOpenSubs.clear();

    if (event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If the item is in the bottom half of the screen, align popup bottom to item bottom
      if (rect.top > windowHeight / 2) {
        this.flyoutStyle = {
          bottom: '0px',
          top: 'auto'
        };
      } else {
        this.flyoutStyle = {
          top: '0px',
          bottom: 'auto'
        };
      }
    } else {
      this.flyoutStyle = { top: '0px', bottom: 'auto' };
    }
  }

  onGroupLeave() {
    if (!this.sidebarService.isCollapsed()) return;
    this.hoverTimeout = setTimeout(() => {
      this.hoveredItem = null;
      this.flyoutOpenSubs.clear();
      this.flyoutStyle = {};
    }, 150);
  }

  toggleFlyoutSub(sub: any) {
    if (this.flyoutOpenSubs.has(sub)) {
      this.flyoutOpenSubs.delete(sub);
    } else {
      this.flyoutOpenSubs.add(sub);
    }
  }

  isFlyoutSubOpen(sub: any): boolean {
    return this.flyoutOpenSubs.has(sub);
  }

  closeFlyout() {
    this.hoveredItem = null;
    this.flyoutOpenSubs.clear();
    this.sidebarService.closeMobileMenu();
  }

  logout() {
    this.authService.logout();
    window.location.href = '/auth/login';
  }

  getRoute(pageId: number | string): any[] {
    return getFeatureRoute(pageId);
  }
}
