import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="toast.type" (click)="toastService.remove(toast.id)">
          <div class="icon">
            @if (toast.type === 'success') { <span class="material-symbols-outlined">check_circle</span> }
            @if (toast.type === 'error') { <span class="material-symbols-outlined">error</span> }
            @if (toast.type === 'warning') { <span class="material-symbols-outlined">warning</span> }
            @if (toast.type === 'info') { <span class="material-symbols-outlined">info</span> }
          </div>
          <div class="message">{{ toast.message }}</div>
          <button class="close-btn">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      min-width: 300px;
      max-width: 450px;
      padding: 16px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      border-right: 6px solid #ccc;
      direction: rtl;
    }

    .toast-item.success { border-right-color: #10b981; color: #065f46; }
    .toast-item.error { border-right-color: #ef4444; color: #991b1b; }
    .toast-item.warning { border-right-color: #f59e0b; color: #92400e; }
    .toast-item.info { border-right-color: #3b82f6; color: #1e40af; }

    .icon { display: flex; align-items: center; }
    .message { flex: 1; font-weight: 600; font-size: 14px; }
    .close-btn { background: none; border: none; font-size: 20px; color: currentColor; opacity: 0.5; }

    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
