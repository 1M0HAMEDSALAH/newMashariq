import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BusService } from '../../core/services/bus.service';
import { Bus } from '../../core/models/bus.model';

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

  buses = signal<Bus[]>([]);
  isLoading = signal(false);

  searchQuery = signal('');
  selectedDate = signal('2026-05-05');

  // Pagination
  pageNo = signal(1);
  pageSize = signal(10);
  totalItemCount = signal(0);

  get totalPages(): number {
  return Math.ceil(
    this.totalItemCount() / this.pageSize()
  );
}

  private searchSubject = new Subject<string>();
  ngOnInit(): void {
    this.fetchBuses();

    this.searchSubject
      .pipe(
        debounceTime(500),
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
        this.pageNo(),
        this.pageSize(),
        this.searchQuery(),
        this.selectedDate()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.buses.set(response.data.items);
          this.totalItemCount.set(response.data.totalItemCount);
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
    this.searchSubject.next(value);
  }

  nextPage(): void {
    if (this.pageNo() * this.pageSize() < this.totalItemCount()) {
      this.pageNo.update((page) => page + 1);
      this.fetchBuses();
    }
  }

  prevPage(): void {
    if (this.pageNo() > 1) {
      this.pageNo.update((page) => page - 1);
      this.fetchBuses();
    }
  }

  trackByBus(index: number, bus: Bus): number {
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
}