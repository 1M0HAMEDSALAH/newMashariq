export interface Bus {
  sid: number;
  pathId: number;
  pathName: string;

  isPageHasDeparture: boolean;
  isPageHasArrival: boolean;
  canUpdate: boolean;

  status: number;
  statusName: string;

  isByTrain: boolean | null;

  transportationCompany: string;

  bus: BusInfo;

  driver: DriverInfo;

  maydaniInfo?: MaydaniInfo | null;

  nationalityBusId?: number | null;

  tripDate: string;
  tripDateHij: number;

  passportCount: number;

  manifestId?: number | null;
  tdmId?: number | null;

  flightDetails?: FlightDetails | null;

  fromScId?: number | null;
  scName?: string | null;

  bagNo?: string | null;

  guideName?: string | null;
  guideMobile?: string | null;

  canUpdateGuideInfo: boolean;

  busDepartureTime: string;

  confirmationNo?: string | null;

  fromCity?: string | null;
  toCity?: string | null;

  notes?: string | null;

  companyName?: string | null;

  nationalities: Nationality[];

  houses: House[];

  serviceCenters: any[];

  statusList: StatusHistory[];
}

export interface BusInfo {
  busId: number;
  busNeqabaId?: number;
  busNumber: string;
}

export interface DriverInfo {
  driverId: number;
  driverName: string;
  phoneNumber?: number;
  nationalityId?: number;
  nationality?: string;
}

export interface MaydaniInfo {
  driverName: string;
  driverMobileNo: string;
  notes?: string;
  nationality?: string;
}

export interface FlightDetails {
  flightId: number;
  flightNumber: string;
  flightIata: string;
  flightDate: string;
  airPortCode: string;
  airTransportationCompany: string;
  terminalNo: string;
  direction: string;
}

export interface Nationality {
  nationalityId: number;
  nationalityName: string;
  hajjCount: number;
}

export interface House {
  houseId: number;
  houseName: string;
  contractNumber: number;
  latitude: number;
  longitude: number;
  hajjCount: number;
  contractStartDate: string;
  contractEndDate: string;
}

export interface StatusHistory {
  status: number;
  statusName: string;
  moveTime: string;
  partyName?: string | null;
  partyMobile?: string | null;
  notes?: string | null;
}

export interface MasterAmTdmResponse {
  message: string;
  isSuccess: boolean;
  errors: any[];
  count: number;
  data: MasterAmTdmData;
  statusCode: number;
}

export interface MasterAmTdmData {
  totalItemCount: number;
  pageNo: number;
  pageSize: number;
  items: Bus[];
}