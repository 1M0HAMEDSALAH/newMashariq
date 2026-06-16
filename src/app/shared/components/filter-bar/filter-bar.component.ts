import { Component, EventEmitter, Input, OnInit, Output, effect, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface FilterField {
  key: string;
  type: 'text' | 'search' | 'date' | 'select' | 'number';
  label?: string;
  placeholder?: string;
  options?: { value: any; label: string }[];
  defaultValue?: any;
  icon?: string;
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css'
})
export class FilterBarComponent implements OnInit {
  @Input() fields: FilterField[] = [];
  @Input() emitMode: 'onChange' | 'onSubmit' = 'onChange';
  
  // Page Size Input
  @Input() showPageSize = false;
  @Input() set pageSize(val: number) {
    this._pageSize.set(val);
  }
  @Input() pageSizeOptions: readonly number[] = [10, 20, 50, 100];

  @Output() filterChange = new EventEmitter<Record<string, any>>();
  @Output() pageSizeChange = new EventEmitter<number>();

  form: FormGroup;
  protected _pageSize = signal(10);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    const group: Record<string, any> = {};
    for (const field of this.fields) {
      group[field.key] = [field.defaultValue || ''];
    }
    this.form = this.fb.group(group);

    if (this.emitMode === 'onChange') {
      this.form.valueChanges
        .pipe(debounceTime(400), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
        .subscribe(val => {
          this.filterChange.emit(val);
        });
    }
  }

  onSearchSubmit(): void {
    if (this.emitMode === 'onSubmit') {
      this.filterChange.emit(this.form.value);
    }
  }

  clearField(key: string): void {
    this.form.get(key)?.setValue('');
    if (this.emitMode === 'onSubmit') {
      // Optional: auto submit on clear even if submit mode
      // this.onSearchSubmit();
    }
  }

  onPageSizeChange(event: Event): void {
    const val = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSizeChange.emit(val);
  }

  get hasSearchButton(): boolean {
    return this.emitMode === 'onSubmit';
  }
}
