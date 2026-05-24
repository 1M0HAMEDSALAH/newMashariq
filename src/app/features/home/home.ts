import { Component, inject, OnInit, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';
import { getFeatureRoute } from '../../core/navigation/feature-navigation';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  menuItems = this.sidebarService.menuItems;
  isLoading = computed(() => !this.sidebarService.menuLoaded());
  searchQuery = signal('');

  /** Tracks which system pageIds are expanded */
  expandedSystems = signal<Set<number>>(new Set());

  /** Tracks the currently selected system for Desktop Split View */
  selectedSystemId = signal<number | null>(null);

  /** Responsive Layout Signals */
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(true);

  constructor() {
    effect(() => {
      const items = this.menuItems();
      if (this.sidebarService.menuLoaded() && items.length > 0 && !this.selectedSystemId()) {
        this.expandedSystems.set(new Set([items[0].pageId]));
        this.selectedSystemId.set(items[0].pageId);
      }
    });
  }

  ngOnInit() {
    this.setupResponsiveLayout();
  }

  setupResponsiveLayout() {
    const mobileQuery = '(max-width: 767.98px)';
    const tabletQuery = '(min-width: 768px) and (max-width: 1023.98px)';
    const desktopQuery = '(min-width: 1024px)';

    this.breakpointObserver
      .observe([mobileQuery, tabletQuery, desktopQuery])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isMobile.set(this.breakpointObserver.isMatched(mobileQuery));
        this.isTablet.set(this.breakpointObserver.isMatched(tabletQuery));
        this.isDesktop.set(this.breakpointObserver.isMatched(desktopQuery));
      });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    // Auto-expand all systems when searching
    if (value.trim()) {
      const allIds = new Set(this.menuItems().map(item => item.pageId));
      this.expandedSystems.set(allIds);
    }
  }

  get filteredMenu(): MenuItem[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.menuItems();

    return this.menuItems()
      .map(item => {
        const mainMatch = item.eName?.toLowerCase().includes(query);

        const filteredSubs = (item.subMenu || item.subMenus || [])
          .map(sub => {
            const subMatch = sub.eName?.toLowerCase().includes(query);
            const filteredSubSubs = (sub.subMenu || sub.subMenus || [])
              .filter(ss => ss.eName?.toLowerCase().includes(query));

            if (subMatch) return sub; // keep whole group
            if (filteredSubSubs.length > 0) return { ...sub, subMenus: filteredSubSubs, subMenu: filteredSubSubs };
            return null;
          })
          .filter(Boolean) as MenuItem[];

        if (mainMatch) return item;
        if (filteredSubs.length > 0) return { ...item, subMenu: filteredSubs, subMenus: filteredSubs };
        return null;
      })
      .filter(Boolean) as MenuItem[];
  }

  /** Gets the currently selected system object */
  get selectedSystem(): MenuItem | null {
    const currentId = this.selectedSystemId();
    if (!currentId) return null;
    return this.filteredMenu.find(item => item.pageId === currentId) || null;
  }

  toggleSystem(pageId: number) {
    const current = new Set(this.expandedSystems());
    if (current.has(pageId)) {
      current.delete(pageId);
    } else {
      current.add(pageId);
    }
    this.expandedSystems.set(current);
  }

  selectSystem(pageId: number) {
    this.selectedSystemId.set(pageId);
  }

  /** Count all leaf services inside a system */
  countLeaves(item: MenuItem): number {
    return (item.subMenu || item.subMenus || []).reduce((total, sub) => {
      const children = sub.subMenu || sub.subMenus || [];
      return total + (children.length > 0 ? children.length : 1);
    }, 0);
  }

  get totalServicesCount(): number {
    return this.menuItems().reduce((total, system) => total + this.countLeaves(system), 0);
  }

  isSvg(path: string | undefined | null): boolean {
    return !!path && path.trim().toLowerCase().endsWith('.svg');
  }

  getSvgUrl(path: string): string {
    return `url(/Content/layouts/assets/images/icons/${path.trim()})`;
  }

  getRoute(pageId: number | string): any[] {
    return getFeatureRoute(pageId);
  }

  displayName(): string {
    const name = this.authService.getUserProfile()?.fullName?.trim();
    return name || 'مستخدم النظام';
  }

  avatarUrl(): string {
    const name = encodeURIComponent(this.displayName());
    return `https://ui-avatars.com/api/?name=${name}&background=ED7A44&color=fff&size=128`;
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.searchQuery.set('');
  }
}