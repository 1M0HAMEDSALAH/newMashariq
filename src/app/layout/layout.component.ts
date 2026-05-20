import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarService } from '../core/services/sidebar.service';
// import { SidebarComponent } from './components/sidebar.component';
import { HeaderComponent } from './components/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <div class="layout-wrapper" [class.sidebar-collapsed]="sidebarService.isCollapsed()">
      <!-- <app-sidebar></app-sidebar> -->

      <main class="main-container">
        <app-header></app-header>

        <section class="main-content">
          <div class="content-view">
             <router-outlet></router-outlet>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      height: 100vh;
      background: #f8fafc;
      direction: rtl;
      padding: 15px;
      gap: 15px;
    }

    .main-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: white;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
      border: 1px solid rgba(0,0,0,0.02);
    }

    .sidebar-collapsed app-sidebar {
      width: 85px;
    }
  `]
})
export class LayoutComponent implements OnInit {
  sidebarService = inject(SidebarService);

  ngOnInit() {
    this.sidebarService.fetchMenu();
  }
}
