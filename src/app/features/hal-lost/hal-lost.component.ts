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
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HalLostService } from '../../core/services/hal-lost.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HalLostNotification } from '../../core/models/hal-lost.model';
import {
  HalScreenConfig,
  getHalScreen,
} from '../../core/config/hal-screens.config';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

@Component({
  selector: 'app-hal-lost',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './hal-lost.component.html',
  styleUrl: './hal-lost.component.css',
})
export class HalLostComponent implements OnInit {
  private halService = inject(HalLostService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  screen = signal<HalScreenConfig | null>(null);
  notifications = signal<HalLostNotification[]>([]);
  expandedId = signal<number | null>(null);
  isLoading = signal(false);
  isSubmitting = signal(false);
  showCreateModal = signal(false);
  isLocating = signal(false);
  locationError = signal<string | null>(null);
  showManualLocation = signal(false);
  reportType = signal<'single' | 'group'>('single');

  searchQuery = signal('');
  pageNo = signal(1);
  pageSize = signal(10);
  totalItemCount = signal(0);

  createForm = this.fb.group({
    latitude: [null as number | null],
    longitude: [null as number | null],
    description: [''],
    notes: [''],
    passportNo: [''],
    hajjName: [''],
    hajjCount: [1, [Validators.required, Validators.min(1)]],
    reporterName: [''],
    reporterPhone: [''],
  });

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

  /** يُستدعى من القالب عند كل دورة change detection — يتفاعل مع الإدخال اليدوي */
  hasValidLocation(): boolean {
    const lat = Number(this.createForm.controls.latitude.value);
    const lng = Number(this.createForm.controls.longitude.value);
    return !Number.isNaN(lat) && !Number.isNaN(lng) && !(lat === 0 && lng === 0);
  }

  ngOnInit(): void {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const pageId = Number(data['halPageId']);
        const screen = getHalScreen(pageId);
        if (!screen) return;

        this.screen.set(screen);
        this.pageNo.set(1);
        this.expandedId.set(null);
        this.closeCreateModal();
        this.fetchNotifications();
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
        this.fetchNotifications();
      });
  }

  fetchNotifications(): void {
    const screen = this.screen();
    if (!screen) return;

    this.isLoading.set(true);
    this.halService
      .getNotifications(
        screen.listEndpoint,
        screen.cityId,
        this.pageNo(),
        this.pageSize(),
        this.searchQuery()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.notifications.set(res.data?.items ?? []);
          this.totalItemCount.set(res.data?.totalItemCount ?? 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.notifications.set([]);
          this.totalItemCount.set(0);
          this.isLoading.set(false);
        },
      });
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
    this.fetchNotifications();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.pageNo.set(1);
    this.fetchNotifications();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.pageNo()) return;
    this.pageNo.set(page);
    this.fetchNotifications();
  }

  nextPage(): void {
    this.goToPage(this.pageNo() + 1);
  }

  prevPage(): void {
    this.goToPage(this.pageNo() - 1);
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  openCreateModal(): void {
    if (!this.screen()?.canCreate) return;

    const reporter = this.authService.getReporterDefaults();
    this.reportType.set('single');
    this.showManualLocation.set(false);
    this.createForm.reset({
      latitude: null,
      longitude: null,
      description: '',
      notes: '',
      passportNo: '',
      hajjName: '',
      hajjCount: 1,
      reporterName: reporter.reporterName,
      reporterPhone: reporter.reporterPhone,
    });
    this.locationError.set(null);
    this.showCreateModal.set(true);
    setTimeout(() => this.captureLocation(), 300);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.isLocating.set(false);
    this.locationError.set(null);
    this.showManualLocation.set(false);
  }

  setReportType(type: 'single' | 'group'): void {
    this.reportType.set(type);
    if (type === 'single') {
      this.createForm.patchValue({ hajjCount: 1 });
      return;
    }
    const count = this.createForm.controls.hajjCount.value;
    if (!count || count < 2) {
      this.createForm.patchValue({ hajjCount: 2 });
    }
    this.createForm.patchValue({ hajjName: '', passportNo: '' });
  }

  onManualCoordChange(): void {
    const lat = Number(this.createForm.controls.latitude.value);
    const lng = Number(this.createForm.controls.longitude.value);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
      this.locationError.set(null);
    }
  }

  captureLocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('المتصفح لا يدعم GPS — استخدم الإدخال اليدوي');
      this.showManualLocation.set(true);
      return;
    }

    this.isLocating.set(true);
    this.locationError.set(null);

    const onSuccess = (pos: GeolocationPosition) => {
      this.createForm.patchValue({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      this.isLocating.set(false);
      this.locationError.set(null);
    };

    const onError = (err: GeolocationPositionError) => {
      this.isLocating.set(false);
      this.showManualLocation.set(true);
      const messages: Record<number, string> = {
        1: 'تم رفض صلاحية الموقع — فعّلها من إعدادات المتصفح أو أدخل الإحداثيات يدوياً',
        2: 'الموقع غير متاح — جرّب الإدخال اليدوي أو افتح من HTTPS',
        3: 'انتهت مهلة GPS — جرّب مرة أخرى أو أدخل الإحداثيات يدوياً',
      };
      this.locationError.set(
        messages[err.code] ?? 'تعذر تحديد الموقع — استخدم الإدخال اليدوي'
      );
      this.tryLowAccuracyLocation(onSuccess);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000,
    });
  }

  private tryLowAccuracyLocation(onSuccess: (pos: GeolocationPosition) => void): void {
    if (!navigator.geolocation || this.hasValidLocation()) return;

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => undefined,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  }

  openMapsPicker(): void {
    const lat = this.createForm.controls.latitude.value;
    const lng = this.createForm.controls.longitude.value;
    const q =
      lat != null && lng != null && (lat !== 0 || lng !== 0)
        ? `${lat},${lng}`
        : '';
    window.open(
      q ? `https://www.google.com/maps/@${q},17z` : 'https://www.google.com/maps',
      '_blank',
      'noopener'
    );
  }

  submitCreate(): void {
    const screen = this.screen();
    if (!screen?.canCreate) return;

    if (!this.hasValidLocation()) {
      this.toast.warning('يجب إدخال الموقع (خط العرض وخط الطول) قبل الإرسال');
      this.showManualLocation.set(true);
      return;
    }

    const v = this.createForm.getRawValue();
    const isSingle = this.reportType() === 'single';
    const hajjCount = isSingle ? 1 : Math.max(2, v.hajjCount ?? 2);
    const description =
      v.description?.trim() ||
      v.notes?.trim() ||
      (isSingle ? 'بلاغ تائه — حاج واحد' : `بلاغ تائه — مجموعة (${hajjCount} حاج)`);

    this.isSubmitting.set(true);
    this.halService
      .createNotification({
        notificationDto: {
          id: 0,
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          description,
          notes: v.notes?.trim() || description,
          passportNo: isSingle ? v.passportNo?.trim() || undefined : undefined,
          hajjName: isSingle ? v.hajjName?.trim() || undefined : undefined,
          hajjCount,
          reporterName: v.reporterName?.trim() || undefined,
          reporterPhone: v.reporterPhone?.trim() || undefined,
          cityId: screen.cityId,
          filePaths: [],
        },
        requestedByPartyId: this.authService.getPartyId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.isSuccess || res.status === 'success') {
            this.toast.success(res.message || 'تم تسجيل البلاغ بنجاح');
            this.closeCreateModal();
            this.pageNo.set(1);
            this.fetchNotifications();
          } else {
            this.toast.error(res.message || 'فشل تسجيل البلاغ');
          }
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 5:
        return 'status-done';
      case 1:
      case 2:
        return 'status-active';
      default:
        return 'status-default';
    }
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('ar-EG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  mapsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  trackById(_i: number, item: HalLostNotification): number {
    return item.id;
  }
}
