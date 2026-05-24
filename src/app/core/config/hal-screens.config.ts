export type HalCityId = 603 | 605;

export type HalScreenMode = 'guidance' | 'inquiry' | 'execution';

/** GET list endpoint (relative to API base — no PageId) */
export type HalListEndpoint =
  | 'HAL/Lost'
  | 'HAL/Lost/Guidance-search'
  | 'HAL/Lost/GuidanceExecuting-search';

export interface HalScreenConfig {
  pageId: number;
  path: string;
  cityId: HalCityId;
  cityName: string;
  eName: string;
  iconPath: string;
  canCreate: boolean;
  mode: HalScreenMode;
  listEndpoint: HalListEndpoint;
}

export const HAL_CITY = {
  MAKKAH: 603 as HalCityId,
  MADINAH: 605 as HalCityId,
} as const;

export const HAL_SCREENS: HalScreenConfig[] = [
  {
    pageId: 21035,
    path: 'makkah/guidance',
    cityId: HAL_CITY.MAKKAH,
    cityName: 'مكة المكرمة',
    eName: 'ارشاد التائهين',
    iconPath: 'far fa-road',
    canCreate: true,
    mode: 'guidance',
    listEndpoint: 'HAL/Lost',
  },
  {
    pageId: 29005,
    path: 'makkah/inquiry',
    cityId: HAL_CITY.MAKKAH,
    cityName: 'مكة المكرمة',
    eName: 'استعلام لجنة بلاغات التائهين',
    iconPath: 'far fa-headset',
    canCreate: false,
    mode: 'inquiry',
    listEndpoint: 'HAL/Lost/Guidance-search',
  },
  {
    pageId: 29007,
    path: 'makkah/execution',
    cityId: HAL_CITY.MAKKAH,
    cityName: 'مكة المكرمة',
    eName: 'تنفيذ بلاغات التائهين',
    iconPath: 'far fa-compass-slash',
    canCreate: false,
    mode: 'execution',
    listEndpoint: 'HAL/Lost/GuidanceExecuting-search',
  },
  {
    pageId: 21043,
    path: 'madinah/guidance',
    cityId: HAL_CITY.MADINAH,
    cityName: 'المدينة المنورة',
    eName: 'إرشاد التائهين',
    iconPath: 'far fa-map-marked-alt',
    canCreate: true,
    mode: 'guidance',
    listEndpoint: 'HAL/Lost',
  },
  {
    pageId: 29012,
    path: 'madinah/inquiry',
    cityId: HAL_CITY.MADINAH,
    cityName: 'المدينة المنورة',
    eName: 'استعلام البلاغات',
    iconPath: 'far fa-clipboard-user',
    canCreate: false,
    mode: 'inquiry',
    listEndpoint: 'HAL/Lost/Guidance-search',
  },
  {
    pageId: 29013,
    path: 'madinah/execution',
    cityId: HAL_CITY.MADINAH,
    cityName: 'المدينة المنورة',
    eName: 'تنفيذ البلاغات',
    iconPath: 'far fa-street-view',
    canCreate: false,
    mode: 'execution',
    listEndpoint: 'HAL/Lost/GuidanceExecuting-search',
  },
];

const screenByPageId = new Map(HAL_SCREENS.map((s) => [s.pageId, s]));

export const HAL_SCREEN_PAGE_IDS = new Set(HAL_SCREENS.map((s) => s.pageId));

export const HAL_SCREEN_BASE_PATH = '/SystemAvailable/lost-pilgrims';

export function isHalScreenPageId(pageId: number): boolean {
  return HAL_SCREEN_PAGE_IDS.has(pageId);
}

export function getHalScreen(pageId: number): HalScreenConfig | undefined {
  return screenByPageId.get(pageId);
}

export function getHalRoute(pageId: number | string): string[] {
  const screen = getHalScreen(Number(pageId));
  if (!screen) return [HAL_SCREEN_BASE_PATH, 'makkah', 'guidance'];
  return [HAL_SCREEN_BASE_PATH, ...screen.path.split('/')];
}

export function getHalScreenRouteDefinitions(): {
  path: string;
  pageId: number;
}[] {
  return HAL_SCREENS.map((s) => ({
    path: `SystemAvailable/lost-pilgrims/${s.path}`,
    pageId: s.pageId,
  }));
}

export function getHalLegacyRedirects(): { from: string; to: string }[] {
  return HAL_SCREENS.map((s) => ({
    from: `SystemAvailable/lost-pilgrims/${s.pageId}`,
    to: `SystemAvailable/lost-pilgrims/${s.path}`,
  }));
}
