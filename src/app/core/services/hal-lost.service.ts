import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  HalLostApiResponse,
  HalLostCreateRequest,
  HalLostListData,
} from '../models/hal-lost.model';
import { HalCityId, HalListEndpoint } from '../config/hal-screens.config';

@Injectable({ providedIn: 'root' })
export class HalLostService {
  private http = inject(HttpClient);

  private readonly createPath = 'HAL/Lost';

  getNotifications(
    listEndpoint: HalListEndpoint,
    cityId: HalCityId,
    pageNo: number,
    pageSize: number,
    filterBy?: string
  ): Observable<HalLostApiResponse<HalLostListData>> {
    let params = new HttpParams()
      .set('CityId', cityId.toString())
      .set('PageNo', pageNo.toString())
      .set('PageSize', pageSize.toString());

    if (filterBy?.trim()) {
      params = params.set('FilterBy', filterBy.trim());
    }

    return this.http.get<HalLostApiResponse<HalLostListData>>(listEndpoint, {
      params,
    });
  }

  createNotification(
    body: HalLostCreateRequest
  ): Observable<HalLostApiResponse<unknown>> {
    return this.http.post<HalLostApiResponse<unknown>>(this.createPath, body);
  }
}
