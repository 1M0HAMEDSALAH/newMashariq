import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login';
import { RegisterComponent } from './features/auth/register';
import { HomeComponent } from './features/home/home';
import { LayoutComponent } from './layout/layout.component';
import { BusUpcomingComponent } from './features/bus-upcoming/bus-upcoming.component';

export const routes: Routes = [
  // Root & Legacy Redirections
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'SystemAvailable/buses/BusesReception', redirectTo: 'SystemAvailable/home/BusesReception', pathMatch: 'full' },

  // Auth Group
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  // Main Application & Dashboard Layout
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'SystemAvailable/home', component: HomeComponent },
      { path: 'SystemAvailable/home/BusesReception', component: BusUpcomingComponent },
      // Future internal screens will go here
    ]
  },

  // Fallback Wildcard Route
  { path: '**', redirectTo: 'auth/login' }
];
