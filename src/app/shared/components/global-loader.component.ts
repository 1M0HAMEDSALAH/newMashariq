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

        <div class="sun-loader">
          @for (ray of rays; track $index) {
            <span
              class="ray"
              [style.--i]="$index">
            </span>
          }
        </div>

      </div>
    }
  `,

  styles: [`
    .global-loader-overlay {
      position: fixed;
      inset: 0;

      background: rgba(255,255,255,.06);
      backdrop-filter: blur(3px);

      display: flex;
      justify-content: center;
      align-items: center;

      z-index: 99999;
    }

    .sun-loader {
      --color: #ED7A44;

      position: relative;

      width: 90px;
      height: 90px;

      animation:
        rotate 1.7s linear infinite,
        bounce 1.7s ease-in-out infinite;
    }

    .ray {
      position: absolute;

      top: 50%;
      left: 50%;

      width: 6px;
      height: 34px;

      border-radius: 50px;

      background: var(--color);

      /* خلي الدوران من النص */
      transform-origin: center center;

      transform:
        translate(-50%, -50%)
        rotate(calc(var(--i) * 30deg))
        translateY(-18px);

      box-shadow:
        0 0 14px rgba(237,122,68,.45);

      animation:
        glow 1.7s infinite ease-in-out;

      animation-delay:
        calc(var(--i) * -.08s);
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @keyframes bounce {

      0%,100% {
        scale: .88;
      }

      50% {
        scale: 1.18;
      }

    }

    @keyframes glow {

      0%,100% {
        opacity: .55;
      }

      50% {
        opacity: 1;
      }

    }
  `]
})
export class GlobalLoaderComponent {

  loadingService = inject(LoadingService);

  isLoading$ =
    this.loadingService.isLoading$;

  rays =
    Array(12).fill(0);

}