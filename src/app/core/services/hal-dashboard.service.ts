import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HalDashboardApiResponse } from '../models/hal-dashboard.model';

@Injectable({ providedIn: 'root' })
export class HalDashboardService {
  private http = inject(HttpClient);

  private readonly path = 'HAL/Dashboard';

  getDashboard(): Observable<HalDashboardApiResponse> {
    return this.http.get<HalDashboardApiResponse>(this.path);
  }
}
