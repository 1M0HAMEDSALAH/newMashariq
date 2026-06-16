import { getBusRoute, isBusScreenPageId } from '../config/bus-screens.config';
import { getHalRoute, isHalScreenPageId } from '../config/hal-screens.config';
import {
  getHalDashboardRoute,
  isHalDashboardPageId,
} from '../config/hal-dashboard.config';

export function getFeatureRoute(pageId: number | string): (string | number)[] {
  const id = Number(pageId);
  if (id === 2025) return ['/SystemAvailable/user-signature'];
  if (isBusScreenPageId(id)) return getBusRoute(id);
  if (isHalDashboardPageId(id)) return getHalDashboardRoute();
  if (isHalScreenPageId(id)) return getHalRoute(id);
  return ['/SystemAvailable/home', pageId];
}
