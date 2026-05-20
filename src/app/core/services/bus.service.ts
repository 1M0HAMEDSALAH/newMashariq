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
    pageNo: number = 1,
    pageSize: number = 10,
    search?: string,
    date?: string
  ): Observable<MasterAmTdmResponse> {
    let params = new HttpParams()
      .set('PageId', 14041)
      .set('PageNo', pageNo)
      .set('PageSize', pageSize);

    if (search) {
      params = params.set('FilterBy', search);
    }

    if (date) {
      params = params
        .set('Date', date)
        .set('TripDate', date);
    }

    return this.http.get<MasterAmTdmResponse>(
      'MasterAmTdm',
      { params }
    );
  }
}