import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HalDashboardService } from '../../core/services/hal-dashboard.service';
import { HalDashboardData } from '../../core/models/hal-dashboard.model';

export type HalCityScope = 'all' | 'makkah' | 'madinah';
export type HalMetricTone = 'brand' | 'navy' | 'alert' | 'success' | 'neutral';

export interface HalMetricDef {
  id: string;
  label: string;
  icon: string;
  tone: HalMetricTone;
  totalKey: keyof HalDashboardData;
  mekkahKey?: keyof HalDashboardData;
  group: 'events' | 'reports';
}

const METRICS: HalMetricDef[] = [
  {
    id: 'allEvents',
    label: 'إجمالي الحالات ',
    icon: 'fa-solid fa-layer-group',
    tone: 'brand',
    totalKey: 'allEventsCount',
    mekkahKey: 'allEventsCountMekkah',
    group: 'events',
  },
  {
    id: 'guidance',
    label: 'بلاغات التائهين',
    icon: 'fa-solid fa-route',
    tone: 'navy',
    totalKey: 'guidanceReportsCount',
    mekkahKey: 'guidanceReportsCountMekkah',
    group: 'reports',
  },
  {
    id: 'recovery',
    label: 'حالات المتحسنين',
    icon: 'fa-solid fa-heart-pulse',
    tone: 'success',
    totalKey: 'recoveryCount',
    mekkahKey: 'recoveryCountMekkah',
    group: 'events',
  },
  {
    id: 'tanweem',
    label: 'التنويم',
    icon: 'fa-solid fa-bed-pulse',
    tone: 'navy',
    totalKey: 'tanweemCount',
    mekkahKey: 'tanweemCountMekkah',
    group: 'events',
  },
  {
    id: 'conversion',
    label: 'التحويل',
    icon: 'fa-solid fa-right-left',
    tone: 'brand',
    totalKey: 'conversionCount',
    mekkahKey: 'conversionCountMekkah',
    group: 'events',
  },
  {
    id: 'death',
    label: 'الوفيات',
    icon: 'fa-solid fa-hand-holding-heart',
    tone: 'alert',
    totalKey: 'deathCount',
    mekkahKey: 'deathCountMekkah',
    group: 'events',
  },
  {
    id: 'emergency',
    label: 'الطوارئ',
    icon: 'fa-solid fa-truck-medical',
    tone: 'brand',
    totalKey: 'emergencyCount',
    mekkahKey: 'emergencyCountMekkah',
    group: 'events',
  },
  {
    id: 'health',
    label: 'الحالات الصحية',
    icon: 'fa-solid fa-file-medical',
    tone: 'navy',
    totalKey: 'healthReportsCount',
    group: 'reports',
  },
  {
    id: 'accident',
    label: 'الحوادث',
    icon: 'fa-solid fa-car-burst',
    tone: 'neutral',
    totalKey: 'accidentCount',
    mekkahKey: 'accidentCountMekkah',
    group: 'events',
  },
];

const REPORT_METRICS: HalMetricDef[] = [
  {
    id: 'ambulance',
    label: 'طلبات الإسعاف',
    icon: 'fa-solid fa-ambulance',
    tone: 'alert',
    totalKey: 'requestAmbulanceReportsCount',
    group: 'reports',
  },
  {
    id: 'recoveryReports',
    label: 'بلاغات التحسن',
    icon: 'fa-solid fa-notes-medical',
    tone: 'success',
    totalKey: 'recoveryReportsCount',
    group: 'reports',
  },
  {
    id: 'deathTransfer',
    label: 'نقل الوفيات',
    icon: 'fa-solid fa-truck',
    tone: 'neutral',
    totalKey: 'deathTransferReportsCount',
    group: 'reports',
  },
  {
    id: 'conversionReports',
    label: 'بلاغات النحويل',
    icon: 'fa-solid fa-hospital',
    tone: 'navy',
    totalKey: 'conversionReportsCount',
    group: 'reports',
  },
];

@Component({
  selector: 'app-hal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hal-dashboard.component.html',
  styleUrl: './hal-dashboard.component.css',
})
export class HalDashboardComponent implements OnInit {
  private dashboardService = inject(HalDashboardService);
  private destroyRef = inject(DestroyRef);

  readonly eventMetrics = METRICS.filter((m) => m.group === 'events');
  readonly reportMetrics = [...METRICS.filter((m) => m.group === 'reports'), ...REPORT_METRICS];

  data = signal<HalDashboardData | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  cityScope = signal<HalCityScope>('all');
  selectedMetricId = signal<string>('allEvents');
  lastUpdated = signal<Date | null>(null);
  animatedValues = signal<Record<string, number>>({});

  summaryMetrics = computed(() => {
    const ids = ['allEvents', 'recovery', 'guidance', 'death'] as const;
    return ids
      .map((id) => [...METRICS, ...REPORT_METRICS].find((m) => m.id === id))
      .filter((m): m is HalMetricDef => !!m);
  });

  selectedMetric = computed(() => {
    const id = this.selectedMetricId();
    return [...METRICS, ...REPORT_METRICS].find((m) => m.id === id) ?? METRICS[0];
  });

  chartSegments = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.eventMetrics
      .map((m) => ({
        id: m.id,
        label: m.label,
        value: this.resolveValue(d, m),
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  chartTotal = computed(() =>
    this.chartSegments().reduce((sum, s) => sum + s.value, 0)
  );

  scopeLabel = computed(() => {
    const map: Record<HalCityScope, string> = {
      all: 'جميع المدن',
      makkah: 'مكة المكرمة',
      madinah: 'المدينة المنورة',
    };
    return map[this.cityScope()];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.dashboardService
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.isSuccess && res.data) {
            this.data.set(res.data);
            this.lastUpdated.set(new Date());
            this.animateAllMetrics(res.data);
          } else {
            this.loadError.set(res.message || 'تعذر تحميل لوحة المؤشرات');
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('تعذر الاتصال بالخادم');
          this.isLoading.set(false);
        },
      });
  }

  setScope(scope: HalCityScope): void {
    this.cityScope.set(scope);
    const d = this.data();
    if (d) this.animateAllMetrics(d);
  }

  selectMetric(id: string): void {
    this.selectedMetricId.set(id);
  }

  displayValue(metricId: string): number {
    return this.animatedValues()[metricId] ?? 0;
  }

  resolveValue(d: HalDashboardData, metric: HalMetricDef): number {
    const total = Number(d[metric.totalKey]) || 0;
    if (!metric.mekkahKey) return total;

    const mekkah = Number(d[metric.mekkahKey]) || 0;
    const scope = this.cityScope();

    if (scope === 'makkah') return mekkah;
    if (scope === 'madinah') return Math.max(0, total - mekkah);
    return total;
  }

  mekkahShare(d: HalDashboardData, metric: HalMetricDef): number {
    if (!metric.mekkahKey) return 0;
    const total = Number(d[metric.totalKey]) || 0;
    if (!total) return 0;
    return Math.round(((Number(d[metric.mekkahKey]) || 0) / total) * 100);
  }

  barWidth(value: number, max: number): number {
    if (!max) return 0;
    return Math.min(100, Math.round((value / max) * 100));
  }

  formatNumber(n: number): string {
    return new Intl.NumberFormat('ar-SA').format(Math.round(n));
  }

  formatTime(date: Date | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  segmentPercent(value: number): string {
    const total = this.chartTotal();
    if (!total) return '0';
    return ((value / total) * 100).toFixed(1);
  }

  private animateAllMetrics(d: HalDashboardData): void {
    const all = [...METRICS, ...REPORT_METRICS];
    const targets: Record<string, number> = {};
    for (const m of all) {
      targets[m.id] = this.resolveValue(d, m);
    }
    this.runCounterAnimation(targets);
  }

  private runCounterAnimation(targets: Record<string, number>): void {
    const duration = 500;
    const start = performance.now();
    const from = { ...this.animatedValues() };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current: Record<string, number> = {};
      for (const key of Object.keys(targets)) {
        const startVal = from[key] ?? 0;
        current[key] = startVal + (targets[key] - startVal) * eased;
      }
      this.animatedValues.set(current);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
