import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [],
  templateUrl: './metric-card.component.html',
})
export class MetricCardComponent {
  @Input() icon: 'clock' | 'trending-up' | 'alert-triangle' = 'clock';
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() color = 'text-slate-800';

  get iconSymbol(): string {
    const map: Record<string, string> = {
      clock: '⏱',
      'trending-up': '📈',
      'alert-triangle': '⚠️',
    };
    return map[this.icon] ?? '📊';
  }
}
