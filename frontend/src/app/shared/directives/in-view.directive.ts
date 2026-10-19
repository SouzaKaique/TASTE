import { Directive, ElementRef, OnDestroy, OnInit, inject, input, output } from '@angular/core';

/**
 * Avisa quando o elemento aparece (ou está para aparecer) na tela.
 * Usado no fim do feed para carregar a próxima página antes de a pessoa chegar lá.
 */
@Directive({
  selector: '[appInView]',
  standalone: true,
})
export class InViewDirective implements OnInit, OnDestroy {
  /** Distância antes da borda da tela em que já conta como "visível". */
  readonly inViewMargin = input('600px');
  readonly inView = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && this.inView.emit(),
      { rootMargin: `0px 0px ${this.inViewMargin()} 0px` },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
