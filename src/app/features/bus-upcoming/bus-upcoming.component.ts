import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { FilterBarComponent, FilterField } from '../../shared/components/filter-bar/filter-bar.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BusService } from '../../core/services/bus.service';
import { Bus } from '../../core/models/bus.model';
import {
  BusScreenConfig,
  getBusPageIds,
  getBusScreen,
} from '../../core/config/bus-screens.config';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

@Component({
  selector: 'app-bus-upcoming',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent, FilterBarComponent],
  templateUrl: './bus-upcoming.component.html',
  styleUrl: './bus-upcoming.component.css',
})
export class BusUpcomingComponent implements OnInit {
  private busService = inject(BusService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  screen = signal<BusScreenConfig | null>(null);
  buses = signal<Bus[]>([]);
  expandedBusId = signal<number | null>(null);
  isLoading = signal(false);

  searchQuery = signal('');
  selectedDate = signal(this.todayIso());

  pageNo = signal(1);
  pageSize = signal(10);
  totalItemCount = signal(0);

  filterFields: FilterField[] = [
    { key: 'searchQuery', type: 'search', placeholder: 'بحث برقم الحافلة، المسار، الشركة...' },
    { key: 'tripDate', type: 'date', label: 'تاريخ الرحلة', icon: 'fa-regular fa-calendar' }
  ];

  private activePageIds = signal<number[]>([14041]);

  ngOnInit(): void {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const pageId = Number(data['busPageId']);
        const screen = getBusScreen(pageId);
        if (!screen) return;

        this.screen.set(screen);
        this.activePageIds.set(getBusPageIds(pageId));
        this.pageNo.set(1);
        this.expandedBusId.set(null);
        this.selectedDate.set(this.todayIso());
        this.fetchBuses();
      });
  }

  fetchBuses(): void {
    this.isLoading.set(true);

    this.busService
      .getUpcomingBuses(
        this.activePageIds(),
        this.pageNo(),
        this.pageSize(),
        this.searchQuery(),
        this.selectedDate()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.buses.set(response.data?.items ?? []);
          this.totalItemCount.set(response.data?.totalItemCount ?? 0);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error(error);
          this.buses.set([]);
          this.totalItemCount.set(0);
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(filters: Record<string, any>): void {
    const query = filters['searchQuery'] || '';
    if (this.searchQuery() !== query) {
      this.searchQuery.set(query);
    }
    const date = filters['tripDate'] || this.todayIso();
    if (this.selectedDate() !== date) {
      this.selectedDate.set(date);
    }
    this.pageNo.set(1);
    this.fetchBuses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNo.set(1);
    this.fetchBuses();
  }

  onPageChange(page: number): void {
    this.pageNo.set(page);
    this.fetchBuses();
  }

  trackByBus(_index: number, bus: Bus): number {
    return bus.sid;
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 10:
        return 'status-departed';
      case 33:
        return 'status-arrived';
      default:
        return 'status-default';
    }
  }

  getDriverMobile(bus: Bus): string {
    return (
      bus.maydaniInfo?.driverMobileNo ||
      bus.driver?.phoneNumber?.toString() ||
      'غير متوفر'
    );
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleExpand(busId: number): void {
    this.expandedBusId.set(this.expandedBusId() === busId ? null : busId);
  }

  private todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
