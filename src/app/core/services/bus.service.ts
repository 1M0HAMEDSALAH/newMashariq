import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Bus,
  MasterAmTdmResponse,
} from '../models/bus.model';

@Injectable({
  providedIn: 'root',
})
export class BusService {
  private http = inject(HttpClient);

  getUpcomingBuses(
    pageIds: number[],
    pageNo: number = 1,
    pageSize: number = 10,
    search?: string,
    date?: string
  ): Observable<MasterAmTdmResponse> {
    let params = new HttpParams()
      .set('PageNo', pageNo)
      .set('PageSize', pageSize);

    pageIds.forEach((id) => {
      params = params.append('PageId', id.toString());
    });

    if (search?.trim()) {
      params = params.set('FilterBy', search.trim());
    }

    if (date) {
      params = params.set('Date', date).set('TripDate', date);
    }

    return this.http.get<MasterAmTdmResponse>('MasterAmTdm', { params });
  }
}