import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-risk-input',
  standalone: true,
  imports: [NgFor],
  templateUrl: './risk-input.component.html',
})
export class RiskInputComponent {
  @Input() label = '';
  @Input() value = 1;
  @Output() valueChange = new EventEmitter<number>();

  readonly levels = [1, 2, 3, 4, 5];

  select(num: number): void {
    this.valueChange.emit(num);
  }

  barClass(num: number): string {
    if (num <= this.value) {
      return this.value > 3 ? 'bg-rose-400' : 'bg-indigo-400';
    }
    return 'bg-slate-100';
  }
}
