import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login';
import { RegisterComponent } from './features/auth/register';
import { HomeComponent } from './features/home/home';
import { LayoutComponent } from './layout/layout.component';
import { BusUpcomingComponent } from './features/bus-upcoming/bus-upcoming.component';
import { HalLostComponent } from './features/hal-lost/hal-lost.component';
import { HalDashboardComponent } from './features/hal-dashboard/hal-dashboard.component';
import {
  getBusLegacyRedirects,
  getBusScreenRouteDefinitions,
} from './core/config/bus-screens.config';
import {
  getHalLegacyRedirects,
  getHalScreenRouteDefinitions,
} from './core/config/hal-screens.config';

const busScreenRoutes: Routes = getBusScreenRouteDefinitions().map((def) => ({
  path: def.path,
  component: BusUpcomingComponent,
  data: { busPageId: def.pageId },
}));

const busLegacyRedirects: Routes = getBusLegacyRedirects().map((r) => ({
  path: r.from,
  redirectTo: r.to,
  pathMatch: 'full' as const,
}));

const halScreenRoutes: Routes = getHalScreenRouteDefinitions().map((def) => ({
  path: def.path,
  component: HalLostComponent,
  data: { halPageId: def.pageId },
}));

const halLegacyRedirects: Routes = getHalLegacyRedirects().map((r) => ({
  path: r.from,
  redirectTo: r.to,
  pathMatch: 'full' as const,
}));

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  ...busLegacyRedirects,
  ...halLegacyRedirects,
  {
    path: 'SystemAvailable/buses/BusesReception',
    redirectTo: 'SystemAvailable/buses/reception',
    pathMatch: 'full',
  },
  {
    path: 'SystemAvailable/home/BusesReception',
    redirectTo: 'SystemAvailable/buses/reception',
    pathMatch: 'full',
  },

  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'SystemAvailable/home', component: HomeComponent },
      { path: 'SystemAvailable/hal/dashboard', component: HalDashboardComponent },
      ...busScreenRoutes,
      ...halScreenRoutes,
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
