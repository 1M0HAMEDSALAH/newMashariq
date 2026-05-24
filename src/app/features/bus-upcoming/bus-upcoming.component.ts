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
  imports: [CommonModule, RouterModule],
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

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItemCount() / this.pageSize()))
  );

  paginationPages = computed(() => {
    const total = this.totalPages();
    const current = this.pageNo();
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  rangeStart = computed(() => {
    if (!this.totalItemCount()) return 0;
    return (this.pageNo() - 1) * this.pageSize() + 1;
  });

  rangeEnd = computed(() =>
    Math.min(this.pageNo() * this.pageSize(), this.totalItemCount())
  );

  private searchSubject = new Subject<string>();
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
        this.fetchBuses();
      });

    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.pageNo.set(1);
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

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.pageNo.set(1);
    this.fetchBuses();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(input?: HTMLInputElement): void {
    if (input) input.value = '';
    this.searchQuery.set('');
    this.pageNo.set(1);
    this.fetchBuses();
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(value);
    this.pageNo.set(1);
    this.fetchBuses();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.pageNo()) return;
    this.pageNo.set(page);
    this.fetchBuses();
  }

  nextPage(): void {
    this.goToPage(this.pageNo() + 1);
  }

  prevPage(): void {
    this.goToPage(this.pageNo() - 1);
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
