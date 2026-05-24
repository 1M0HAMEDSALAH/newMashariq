export interface HalDashboardData {
  allEventsCount: number;
  allEventsCountMekkah: number;
  deathCount: number;
  deathCountMekkah: number;
  tanweemCount: number;
  tanweemCountMekkah: number;
  conversionCount: number;
  conversionCountMekkah: number;
  recoveryCount: number;
  recoveryCountMekkah: number;
  emergencyCount: number;
  emergencyCountMekkah: number;
  guidanceReportsCount: number;
  guidanceReportsCountMekkah: number;
  healthReportsCount: number;
  accidentCount: number;
  accidentCountMekkah: number;
  requestAmbulanceReportsCount: number;
  recoveryReportsCount: number;
  deathTransferReportsCount: number;
  conversionReportsCount: number;
  id: number | null;
  encId: string | null;
}

export interface HalDashboardApiResponse {
  status: string;
  code: number;
  message: string;
  data: HalDashboardData;
  errors: unknown;
  isSuccess: boolean;
}
