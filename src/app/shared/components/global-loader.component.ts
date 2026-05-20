import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading$ | async) {
      <div class="global-loader-overlay">
        <div class="spheres-container">
          <div class="sphere"></div>
          <div class="sphere"></div>
          <div class="sphere"></div>
          <div class="sphere"></div>
          <div class="sphere"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .global-loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in-out;
    }

    .spheres-container {
      position: relative;
      width: 70px;
      height: 70px;
      animation: rotate-container 2.5s infinite linear;
    }

    .sphere {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 100%;
      animation: scale-sphere 2s infinite ease-in-out both;
    }

    /* Top Orange Sphere */
    .sphere:nth-child(1) { 
      top: 0; 
      left: 23px; 
      background-color: #ED7A44; 
      box-shadow: 0 4px 15px rgba(237, 122, 68, 0.5); 
      animation-delay: -1.33s; 
    }
    
    /* Bottom Left Navy Sphere */
    .sphere:nth-child(2) { 
      bottom: 0; 
      left: 0; 
      background-color: #ED7A44; 
      box-shadow: 0 4px 15px #ED7A44; 
      animation-delay: -0.66s; 
    }
    
    /* Bottom Right Grey Sphere */
    .sphere:nth-child(3) { 
      bottom: 0; 
      right: 0; 
      background-color: #ED7A44; 
      box-shadow: 0 4px 15px #ED7A44; 
      animation-delay: 0s; 
    }

    @keyframes rotate-container {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes scale-sphere {
      0%, 80%, 100% { 
        transform: scale(0); 
        opacity: 0.3; 
      }
      40% { 
        transform: scale(1); 
        opacity: 1; 
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class GlobalLoaderComponent {
  loadingService = inject(LoadingService);
  isLoading$ = this.loadingService.isLoading$;
}
