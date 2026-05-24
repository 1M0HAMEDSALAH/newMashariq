export interface HalLostNotification {
  id: number;
  baseNotificationId: number;
  notificationNumber: number;
  latitude: number;
  longitude: number;
  description: string | null;
  notes: string | null;
  groupCode: string | null;
  status: number;
  type: number | null;
  hajjCount: number;
  nationalityId: number | null;
  statusName: string;
  hajjDataId: number | null;
  hajjNumber: string | null;
  hajjName: string | null;
  nationalityName: string | null;
  passportNumber: string | null;
  genderName: string | null;
  incidentType: number | null;
  creatorName: string | null;
  creatorPhone: string | null;
  creatorImagePath: string | null;
  creatorMission: string | null;
  creatorNotificationsCount: number | null;
  date: string;
  incidentTypeName: string | null;
  age: number | null;
  houseId: number | null;
  houseName: string | null;
  hospital_SID: number | null;
  hospitalName: string | null;
  isExcuter: boolean | null;
  sourceLocationLatitude: number | null;
  sourceLocationLongitude: number | null;
  excuterName: string | null;
  finisherName: string | null;
  hajjGroupCode: string | null;
  disableEdit: boolean | null;
  filePaths: string[];
  isRecievedHajj: boolean | null;
  reporterName: string | null;
  reporterPhone: string | null;
  destLongitude: number | null;
  destLatitude: number | null;
  haL_Type: number | null;
  haL_TypeName: string | null;
  destHouseId: number | null;
  destHouseName: string | null;
  assistantName: string | null;
  pilgrim_SID: number | null;
  bagNo: string | null;
  sectorName: string | null;
  companyName: string | null;
  assigneeParty_SID: number | null;
  assistantParty_SID: number | null;
  groupInstance_SID: number | null;
  sector_SID: number | null;
  callCenterNotificationNo: number | null;
  callCenterReport_SID: number | null;
  sourceType: number | null;
  sourceTypeName: string | null;
  dueTime: number | null;
  nosokNo: string | null;
  incidentNo: string | null;
  followParty_SID: number | null;
  followPartyName: string | null;
}

export interface HalLostNotificationDto {
  id: number;
  latitude: number;
  longitude: number;
  description?: string;
  passportNo?: string;
  houseId?: number | null;
  hajjDataId?: number | null;
  hajjName?: string;
  hajjCount?: number;
  nationalityId?: number;
  reporterName?: string;
  reporterPhone?: string;
  houseName?: string;
  filePaths?: string[];
  notes?: string;
  assigneeParty_SID?: number;
  pilgrim_SID?: number;
  cityId: number;
  hD_ID?: number;
}

export interface HalLostCreateRequest {
  notificationDto: HalLostNotificationDto;
  requestedByPartyId: number;
}

export interface HalLostListData {
  totalItemCount: number;
  pageNo: number;
  pageSize: number;
  items: HalLostNotification[];
}

export interface HalLostApiResponse<T = HalLostListData> {
  status: string;
  code: number;
  message: string;
  data: T;
  errors: unknown;
  isSuccess: boolean;
}
