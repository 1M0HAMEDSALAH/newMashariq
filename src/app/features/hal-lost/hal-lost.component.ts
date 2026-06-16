import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { FilterBarComponent, FilterField } from '../../shared/components/filter-bar/filter-bar.component';
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
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTemplateDirective } from '../../shared/components/dynamic-form/dynamic-template.directive';
import { DynamicFormConfig } from '../../shared/components/dynamic-form/dynamic-form.model';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

@Component({
  selector: 'app-hal-lost',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DynamicFormComponent, DynamicTemplateDirective, PaginationComponent, FilterBarComponent],
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
  showCreateModal = signal(false);
  isLocating = signal(false);
  locationError = signal<string | null>(null);
  showManualLocation = signal(false);
  reportType = signal<'single' | 'group'>('single');

  searchQuery = signal('');
  pageNo = signal(1);
  pageSize = signal(10);
  totalItemCount = signal(0);

  formConfig = signal<DynamicFormConfig | null>(null);

  @ViewChild(DynamicFormComponent) dynamicForm?: DynamicFormComponent;

  filterFields: FilterField[] = [
    { key: 'searchQuery', type: 'search', placeholder: 'بحث برقم البلاغ، الاسم، الجواز، الوصف...' }
  ];



  /** يُستدعى من القالب عند كل دورة change detection — يتفاعل مع الإدخال اليدوي */
  hasValidLocation(): boolean {
    const form = this.dynamicForm?.form;
    if (!form) return false;
    const lat = Number(form.controls['latitude']?.value);
    const lng = Number(form.controls['longitude']?.value);
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

  onFilterChange(filters: Record<string, any>): void {
    const query = filters['searchQuery'] || '';
    if (this.searchQuery() !== query) {
      this.searchQuery.set(query);
      this.pageNo.set(1);
      this.fetchNotifications();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNo.set(1);
    this.fetchNotifications();
  }

  onPageChange(page: number): void {
    this.pageNo.set(page);
    this.fetchNotifications();
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  openCreateModal(): void {
    const screen = this.screen();
    if (!screen?.canCreate) return;

    const reporter = this.authService.getReporterDefaults();
    this.reportType.set('single');
    this.showManualLocation.set(false);
    this.locationError.set(null);

    this.formConfig.set({
      apiPath: 'HAL/Lost',
      apiMethod: 'POST',
      payloadMapper: (v: any) => {
        const isSingle = this.reportType() === 'single';
        const hajjCount = isSingle ? 1 : Math.max(2, v.hajjCount ?? 2);
        const description =
          v.description?.trim() ||
          v.notes?.trim() ||
          (isSingle ? 'بلاغ تائه — حاج واحد' : `بلاغ تائه — مجموعة (${hajjCount} حاج)`);

        return {
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
        };
      },
      sections: [
        { customTemplateName: 'typeSwitchTemplate' },
        {
          customTemplateName: 'locationTemplate',
          fields: [
            { key: 'latitude', type: 'hidden' },
            { key: 'longitude', type: 'hidden' }
          ]
        },
        {
          title: 'بيانات الحاج',
          stepNum: 3,
          fields: [
            { key: 'hajjName', type: 'text', label: 'اسم الحاج', placeholder: 'الاسم كما في الجواز', customTemplateName: 'singleOnlyNameTemplate' },
            { key: 'passportNo', type: 'text', label: 'رقم الجواز', placeholder: 'رقم الجواز', customTemplateName: 'singleOnlyPassportTemplate' },
            { key: 'hajjCount', type: 'number', label: 'عدد الحجاج في المجموعة', min: 2, defaultValue: 1, customTemplateName: 'groupOnlyCountTemplate' },
            { key: 'description', type: 'textarea', label: 'وصف البلاغ / الموقع', placeholder: 'مثال: حاج تائه عند فندق الجوهرة — شارع منصور', cssClass: 'full', rows: 3 },
            { key: 'notes', type: 'textarea', label: 'ملاحظات إضافية', placeholder: 'اختياري', cssClass: 'full', rows: 2 }
          ]
        },
        {
          title: 'بيانات المُبلّغ',
          stepNum: 4,
          autoTag: 'من حسابك',
          cssClass: 'reporter-section',
          fields: [
            { key: 'reporterName', type: 'text', label: 'الاسم', placeholder: 'اسمك', defaultValue: reporter.reporterName },
            { key: 'reporterPhone', type: 'tel', label: 'الجوال', placeholder: '05xxxxxxxx', defaultValue: reporter.reporterPhone }
          ]
        }
      ]
    });

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
    const form = this.dynamicForm?.form;
    if (!form) return;

    if (type === 'single') {
      form.patchValue({ hajjCount: 1 });
      return;
    }
    const count = form.controls['hajjCount']?.value;
    if (!count || count < 2) {
      form.patchValue({ hajjCount: 2 });
    }
    form.patchValue({ hajjName: '', passportNo: '' });
  }

  onManualCoordChange(): void {
    const form = this.dynamicForm?.form;
    if (!form) return;
    const lat = Number(form.controls['latitude']?.value);
    const lng = Number(form.controls['longitude']?.value);
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
      this.dynamicForm?.form.patchValue({
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
    const form = this.dynamicForm?.form;
    if (!form) return;
    const lat = form.controls['latitude']?.value;
    const lng = form.controls['longitude']?.value;
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

  onSubmitCheck(): void {
    if (!this.hasValidLocation()) {
      this.toast.warning('يجب إدخال الموقع (خط العرض وخط الطول) قبل الإرسال');
      this.showManualLocation.set(true);
      // We manually throw an error here to prevent the dynamic form from submitting if we wanted,
      // but the dynamic form handles submitting if form is valid. Wait, latitude/longitude aren't marked 'required'
      // in the config, so the form might be valid. If we want to block it, we should add 'required' validators to them!
      // But we will handle this in the template via [disabled].
    }
  }

  onFormSuccess(res: any): void {
    this.closeCreateModal();
    this.pageNo.set(1);
    this.fetchNotifications();
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
