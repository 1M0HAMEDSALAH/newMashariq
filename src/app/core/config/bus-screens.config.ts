export interface BusScreenConfig {
  pageId: number;
  /** URL path under /SystemAvailable/buses/ (may contain slashes) */
  path: string;
  eName: string;
  iconPath: string;
  extraPageIds?: number[];
}

export const BUS_SCREENS: BusScreenConfig[] = [
  {
    pageId: 14041,
    path: 'reception',
    eName: 'الحافلات القادمة - الإستقبال',
    iconPath: 'far fa-clipboard-check',
  },
  {
    pageId: 13061,
    path: 'upcoming/busesCenter',
    eName: 'عرض الحافلات القادمة',
    iconPath: 'far fa-bus-alt',
  },
  {
    pageId: 13062,
    path: 'upcoming/nouriya',
    eName: 'عرض الحافلات القادمة - النورية',
    iconPath: 'far fa-bus-school',
  },
  {
    pageId: 30040,
    path: 'upcoming/center-9',
    eName: 'عرض الحافلات القادمة - مركز 9',
    iconPath: 'far fa-tv-alt',
  },
  {
    pageId: 30041,
    path: 'upcoming/city-arrival',
    eName: 'الحافلات القادمة - وصول المدينة',
    iconPath: 'far fa-house-return',
  },
  {
    pageId: 13079,
    path: 'departure/jeddah-arrival',
    eName: 'المغادرة - وصول جدة',
    iconPath: 'far fa-map-marked-alt',
  },
  {
    pageId: 13080,
    path: 'departure/k40-station',
    eName: 'المغادرة - محطة ك40',
    iconPath: 'far fa-map-signs',
  },
  {
    pageId: 13112,
    path: 'train/makkah-arrival',
    eName: 'عرض وصول محطة قطار مكة',
    iconPath: 'far fa-car-bus',
  },
  {
    pageId: 13113,
    path: 'train/makkah-departure',
    eName: 'عرض مغادرة محطة قطار مكة',
    iconPath: 'far fa-sign-out',
  },
  {
    pageId: 13114,
    path: 'train/madinah-arrival',
    eName: 'عرض وصول محطة قطار المدينة',
    iconPath: 'far fa-truck-container',
  },
  {
    pageId: 13115,
    path: 'train/madinah-departure',
    eName: 'عرض مغادرة محطة قطار المدينة',
    iconPath: 'far fa-list-alt',
  },
];

const screenByPageId = new Map(BUS_SCREENS.map((s) => [s.pageId, s]));
const screenByPath = new Map(BUS_SCREENS.map((s) => [s.path, s]));

export const BUS_SCREEN_PAGE_IDS = new Set(BUS_SCREENS.map((s) => s.pageId));

export const BUS_SCREEN_BASE_PATH = '/SystemAvailable/buses';

export function isBusScreenPageId(pageId: number): boolean {
  return BUS_SCREEN_PAGE_IDS.has(pageId);
}

export function getBusScreen(pageId: number): BusScreenConfig | undefined {
  return screenByPageId.get(pageId);
}

export function getBusScreenByPath(path: string): BusScreenConfig | undefined {
  return screenByPath.get(path.replace(/^\/+|\/+$/g, ''));
}

export function getBusPageIds(pageId: number): number[] {
  const screen = getBusScreen(pageId);
  if (!screen) return [pageId];
  const ids = [screen.pageId, ...(screen.extraPageIds ?? [])];
  return [...new Set(ids)];
}

export function getBusRoute(pageId: number | string): string[] {
  const screen = getBusScreen(Number(pageId));
  if (!screen) return [BUS_SCREEN_BASE_PATH, 'reception'];
  return [BUS_SCREEN_BASE_PATH, ...screen.path.split('/')];
}

export function getBusRoutePath(pageId: number): string {
  const screen = getBusScreen(pageId);
  if (!screen) return `${BUS_SCREEN_BASE_PATH}/reception`;
  return `${BUS_SCREEN_BASE_PATH}/${screen.path}`;
}

/** Routes registered in app.routes for each bus screen */
export function getBusScreenRouteDefinitions(): {
  path: string;
  pageId: number;
}[] {
  return BUS_SCREENS.map((s) => ({
    path: `SystemAvailable/buses/${s.path}`,
    pageId: s.pageId,
  }));
}

/** Redirects from legacy numeric URLs to slug paths */
export function getBusLegacyRedirects(): {
  from: string;
  to: string;
}[] {
  return BUS_SCREENS.map((s) => ({
    from: `SystemAvailable/buses/${s.pageId}`,
    to: `SystemAvailable/buses/${s.path}`,
  }));
}
