import { Component, Input, ContentChildren, QueryList, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DynamicFormConfig } from './dynamic-form.model';
import { DynamicTemplateDirective } from './dynamic-template.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.css'
})
export class DynamicFormComponent implements OnInit {
  @Input({ required: true }) config!: DynamicFormConfig;
  @Input() formGroup?: FormGroup; // optional: if not provided, we build it from config
  @Output() onSubmit = new EventEmitter<any>();
  @Output() onSuccess = new EventEmitter<any>();
  @Output() onError = new EventEmitter<any>();

  internalFormGroup!: FormGroup;
  isSubmitting = false;

  @ContentChildren(DynamicTemplateDirective) templates!: QueryList<DynamicTemplateDirective>;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  get form() {
    return this.formGroup || this.internalFormGroup;
  }

  ngOnInit() {
    if (!this.formGroup) {
      this.buildForm();
    }
  }

  private buildForm() {
    this.internalFormGroup = this.fb.group({});
    for (const section of this.config.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          const controlValidators = this.parseValidators(field.validators);
          this.internalFormGroup.addControl(
            field.key,
            this.fb.control(field.defaultValue !== undefined ? field.defaultValue : null, controlValidators)
          );
        }
      }
    }
  }

  private parseValidators(validators?: string[]): ValidatorFn[] {
    if (!validators) return [];
    const fns: ValidatorFn[] = [];
    for (const v of validators) {
      if (v === 'required') fns.push(Validators.required);
      if (v === 'email') fns.push(Validators.email);
      if (v.startsWith('min:')) fns.push(Validators.min(Number(v.split(':')[1])));
      if (v.startsWith('max:')) fns.push(Validators.max(Number(v.split(':')[1])));
      if (v.startsWith('minLength:')) fns.push(Validators.minLength(Number(v.split(':')[1])));
      if (v.startsWith('maxLength:')) fns.push(Validators.maxLength(Number(v.split(':')[1])));
    }
    return fns;
  }

  getTemplate(name: string) {
    return this.templates?.find(t => t.name === name)?.template || null;
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.onSubmit.emit(this.form.value);

    if (this.config.apiPath) {
      this.isSubmitting = true;
      const rawValue = this.form.getRawValue();
      const payload = this.config.payloadMapper ? this.config.payloadMapper(rawValue) : rawValue;
      const method = this.config.apiMethod || 'POST';

      this.http.request(method, this.config.apiPath, { body: payload }).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res?.isSuccess || res?.status === 'success') {
            this.toast.success(res?.message || 'تم الحفظ بنجاح');
            this.onSuccess.emit(res);
          } else {
            this.toast.error(res?.message || 'خطأ في الحفظ');
            this.onError.emit(res);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toast.error('حدث خطأ أثناء الاتصال بالخادم');
          this.onError.emit(err);
        }
      });
    }
  }
}
