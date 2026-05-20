import { Component, signal } from '@angular/core';
import { ToastComponent } from './shared/components/toast.component';
import { GlobalLoaderComponent } from './shared/components/global-loader.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, GlobalLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('newMashariq');
}
