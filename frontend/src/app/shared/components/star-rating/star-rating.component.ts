import { ChangeDetectionStrategy, Component, effect, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  readonly max = 5;
  readonly readonlyMode = input(false, { alias: 'readonly' });
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input('Avaliação');
  /** Uso direto (fora de formulários), ex.: exibição somente leitura em cards. */
  readonly rating = input<number | null>(null);
  readonly ratingChange = output<number>();

  protected readonly value = signal(0);
  protected readonly hovered = signal<number | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly stars = Array.from({ length: this.max }, (_, i) => i + 1);

  constructor() {
    effect(() => {
      const direct = this.rating();
      if (direct !== null) this.value.set(direct);
    });
  }

  writeValue(value: number): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(star: number): void {
    if (this.readonlyMode() || this.disabled()) return;
    this.value.set(star);
    this.onChange(star);
    this.onTouched();
    this.ratingChange.emit(star);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.readonlyMode() || this.disabled()) return;
    const current = this.value();

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.select(Math.min(this.max, current + 1 || 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.select(Math.max(1, current - 1));
    } else if (event.key >= '1' && event.key <= '5') {
      this.select(Number(event.key));
    }
  }

  protected isFilled(star: number): boolean {
    const preview = this.hovered();
    return preview !== null ? star <= preview : star <= this.value();
  }
}
