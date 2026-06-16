import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  // We use setter inputs to update our internal signals seamlessly
  @Input() set pageNo(val: number) {
    this._pageNo.set(val);
  }
  @Input() set pageSize(val: number) {
    this._pageSize.set(val);
  }
  @Input() set totalItemCount(val: number) {
    this._totalItemCount.set(val);
  }

  @Output() pageChange = new EventEmitter<number>();

  // Internal signals
  protected _pageNo = signal(1);
  protected _pageSize = signal(10);
  protected _totalItemCount = signal(0);

  // Computed properties
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this._totalItemCount() / this._pageSize()))
  );

  paginationPages = computed(() => {
    const total = this.totalPages();
    const current = this._pageNo();
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  rangeStart = computed(() => {
    if (!this._totalItemCount()) return 0;
    return (this._pageNo() - 1) * this._pageSize() + 1;
  });

  rangeEnd = computed(() =>
    Math.min(this._pageNo() * this._pageSize(), this._totalItemCount())
  );

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this._pageNo()) return;
    this.pageChange.emit(page);
  }

  nextPage(): void {
    this.goToPage(this._pageNo() + 1);
  }

  prevPage(): void {
    this.goToPage(this._pageNo() - 1);
  }
}
