import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../core/services/sidebar.service';
import { SidebarComponent } from './components/sidebar.component';
import { HeaderComponent } from './components/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  sidebarService = inject(SidebarService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.sidebarService.fetchMenu();

    this.breakpointObserver
      .observe('(max-width: 1023.98px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.sidebarService.setMobileNav(state.matches);
        if (!state.matches) {
          this.sidebarService.closeMobileMenu();
        }
      });
  }
}
