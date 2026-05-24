/** Menu pageId for HAL dashboard — update when linked from backend menu */
export const HAL_DASHBOARD_PAGE_ID = 21025;

export const HAL_DASHBOARD_BASE_PATH = '/SystemAvailable/hal/dashboard';

export function isHalDashboardPageId(pageId: number): boolean {
  return pageId === HAL_DASHBOARD_PAGE_ID;
}

export function getHalDashboardRoute(): string[] {
  return [HAL_DASHBOARD_BASE_PATH];
}
