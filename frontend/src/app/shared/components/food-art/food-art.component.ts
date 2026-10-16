import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FoodSegment, foodSegment } from './food-segment';

/** Fundo de cada segmento: tons escuros e quentes da paleta do TASTE. */
const BACKGROUNDS: Record<FoodSegment, string> = {
  pizza: '#6b2a22',
  japonesa: '#3a2630',
  hamburguer: '#5a3424',
  cafe: '#4a2f27',
  doces: '#6b2737',
  sorvete: '#5e2a40',
  carnes: '#4f1f22',
  arabe: '#6a4424',
  'frutos-do-mar': '#3b3a3f',
  bar: '#5a4220',
  padaria: '#6a4a2a',
  mexicana: '#6b3a1f',
  massas: '#5a2430',
  saudavel: '#3d4428',
  asiatica: '#5a1f24',
  brasileira: '#4a3020',
  geral: '#521c2c',
};

let uid = 0;

/**
 * Ilustração do tipo de comida (pizza, japonesa, café...), usada como capa quando
 * não existe foto. Desenhos próprios do TASTE, sem imagens de terceiros.
 */
@Component({
  selector: 'app-food-art',
  standalone: true,
  template: `
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" role="img" [attr.aria-label]="label()" class="art">
      <defs>
        <pattern [attr.id]="patternId" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#F8F6F1" opacity="0.09" />
        </pattern>
        <radialGradient [attr.id]="glowId" cx="50%" cy="45%" r="55%">
          <stop offset="0" stop-color="#F8F6F1" stop-opacity="0.14" />
          <stop offset="1" stop-color="#F8F6F1" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="100" [attr.fill]="background()" />
      <rect width="160" height="100" [attr.fill]="'url(#' + patternId + ')'" />
      <ellipse cx="80" cy="50" rx="52" ry="44" [attr.fill]="'url(#' + glowId + ')'" />

      <g transform="translate(38 8) scale(0.7)" stroke-linecap="round" stroke-linejoin="round">
        @switch (segment()) {
          @case ('pizza') {
            <path d="M60 18 L98 88 Q60 104 22 88 Z" fill="#E3B26A" />
            <path d="M22 88 Q60 104 98 88" fill="none" stroke="#B8925A" stroke-width="9" />
            <circle cx="60" cy="48" r="7" fill="#8E3A4E" />
            <circle cx="47" cy="72" r="7" fill="#8E3A4E" />
            <circle cx="73" cy="74" r="7" fill="#8E3A4E" />
            <circle cx="62" cy="64" r="2.5" fill="#F8F6F1" />
          }
          @case ('japonesa') {
            <line x1="62" y1="16" x2="104" y2="40" stroke="#B8925A" stroke-width="4" />
            <line x1="58" y1="24" x2="102" y2="48" stroke="#B8925A" stroke-width="4" />
            <rect x="12" y="78" width="96" height="14" rx="4" fill="#B8925A" />
            <rect x="20" y="92" width="8" height="6" rx="2" fill="#8a6a3a" />
            <rect x="92" y="92" width="8" height="6" rx="2" fill="#8a6a3a" />
            <circle cx="38" cy="62" r="17" fill="#1f1418" />
            <circle cx="38" cy="62" r="13" fill="#F8F6F1" />
            <circle cx="38" cy="62" r="6" fill="#E07A5F" />
            <ellipse cx="80" cy="70" rx="20" ry="9" fill="#F8F6F1" />
            <path d="M60 64 Q80 46 100 62 Q80 70 60 64 Z" fill="#E07A5F" />
            <path d="M70 58 L74 64 M80 55 L83 63 M90 57 L91 64" stroke="#F8D0C4" stroke-width="2" />
          }
          @case ('hamburguer') {
            <path d="M28 58 Q60 18 92 58 Z" fill="#D9A15A" />
            <ellipse cx="50" cy="42" rx="2.5" ry="1.5" fill="#F8F6F1" />
            <ellipse cx="64" cy="36" rx="2.5" ry="1.5" fill="#F8F6F1" />
            <ellipse cx="74" cy="46" rx="2.5" ry="1.5" fill="#F8F6F1" />
            <path d="M26 63 q8 7 17 0 t17 0 t17 0 t17 0" fill="none" stroke="#9DB36B" stroke-width="5" />
            <rect x="28" y="68" width="64" height="13" rx="6.5" fill="#6B3423" />
            <rect x="26" y="79" width="68" height="5" rx="2.5" fill="#F2C14E" />
            <rect x="30" y="86" width="60" height="12" rx="6" fill="#D9A15A" />
          }
          @case ('cafe') {
            <path d="M44 22 q-6 8 0 16 M58 18 q-6 8 0 16 M72 22 q-6 8 0 16" fill="none" stroke="#B8925A" stroke-width="3" opacity="0.8" />
            <path d="M32 46 h56 v18 a28 28 0 0 1 -56 0 Z" fill="#F8F6F1" />
            <path d="M88 52 a11 11 0 0 1 0 22" fill="none" stroke="#F8F6F1" stroke-width="6" />
            <ellipse cx="60" cy="47" rx="28" ry="4" fill="#6B3E2E" />
            <ellipse cx="60" cy="96" rx="40" ry="6" fill="#B8925A" />
          }
          @case ('doces') {
            <path d="M36 70 L84 70 L77 100 L43 100 Z" fill="#B8925A" />
            <path d="M50 72 L52 98 M60 72 L60 98 M70 72 L68 98" stroke="#8a6a3a" stroke-width="2" />
            <path d="M32 72 Q30 52 46 50 Q48 36 60 38 Q72 36 74 50 Q90 52 88 72 Z" fill="#F3D6DC" />
            <circle cx="60" cy="30" r="7" fill="#8E3A4E" />
            <path d="M60 23 q4 -8 10 -9" fill="none" stroke="#9DB36B" stroke-width="2.5" />
          }
          @case ('sorvete') {
            <path d="M42 60 L78 60 L60 106 Z" fill="#D9A15A" />
            <path d="M48 66 L70 88 M72 66 L54 90 M60 62 L66 76" stroke="#B07D3A" stroke-width="2" />
            <circle cx="50" cy="54" r="15" fill="#F3D6DC" />
            <circle cx="70" cy="54" r="15" fill="#F8F6F1" />
            <circle cx="60" cy="38" r="15" fill="#8E3A4E" />
            <circle cx="64" cy="26" r="4" fill="#C9475E" />
          }
          @case ('carnes') {
            <path d="M22 62 C20 38 56 28 82 36 C102 42 104 70 86 82 C66 96 26 90 22 62 Z" fill="#9B3B3B" />
            <path d="M22 62 C20 38 56 28 82 36 C102 42 104 70 86 82 C66 96 26 90 22 62 Z" fill="none" stroke="#F3D6DC" stroke-width="3" opacity="0.55" />
            <path d="M38 50 L58 76 M54 44 L74 70 M70 40 L88 64" stroke="#5a2020" stroke-width="5" />
            <path d="M84 20 q-4 10 2 18 M84 26 l-7 -2 M85 32 l7 -2" fill="none" stroke="#9DB36B" stroke-width="3" />
            <path d="M20 100 L100 100" stroke="#B8925A" stroke-width="4" />
          }
          @case ('arabe') {
            <path d="M60 28 L94 86 L26 86 Z" fill="#D9A15A" stroke="#D9A15A" stroke-width="12" />
            <path d="M60 52 L74 76 L46 76 Z" fill="#8E3A4E" stroke="#8E3A4E" stroke-width="4" />
            <circle cx="56" cy="68" r="2" fill="#9DB36B" />
            <circle cx="64" cy="70" r="2" fill="#9DB36B" />
          }
          @case ('frutos-do-mar') {
            <path d="M22 60 Q54 26 88 60 Q54 94 22 60 Z" fill="#F8F6F1" />
            <path d="M86 60 L106 42 L104 60 L106 78 Z" fill="#F8F6F1" />
            <path d="M50 46 q8 14 0 28 M62 46 q8 14 0 28" fill="none" stroke="#B8925A" stroke-width="2.5" />
            <circle cx="36" cy="56" r="3.5" fill="#1f1418" />
            <path d="M30 98 q10 -6 20 0 t20 0 t20 0" fill="none" stroke="#9fb7c4" stroke-width="3" opacity="0.7" />
          }
          @case ('bar') {
            <rect x="34" y="40" width="40" height="58" rx="6" fill="#F2B544" />
            <path d="M74 52 h8 a9 9 0 0 1 9 9 v16 a9 9 0 0 1 -9 9 h-8" fill="none" stroke="#F2B544" stroke-width="7" />
            <path d="M30 46 q2 -14 14 -10 q6 -12 18 -4 q10 -8 16 4 q8 2 6 12 Z" fill="#F8F6F1" />
            <circle cx="46" cy="66" r="2.5" fill="#F8F6F1" opacity="0.8" />
            <circle cx="58" cy="78" r="2" fill="#F8F6F1" opacity="0.8" />
            <circle cx="50" cy="88" r="2.5" fill="#F8F6F1" opacity="0.8" />
          }
          @case ('padaria') {
            <path d="M22 78 Q22 42 60 40 Q98 42 98 78 Z" fill="#D9A15A" />
            <rect x="22" y="74" width="76" height="16" rx="5" fill="#B07D3A" />
            <path d="M40 52 L48 66 M56 48 L64 64 M72 50 L80 64" stroke="#F3D9A8" stroke-width="4" />
          }
          @case ('mexicana') {
            <path d="M22 86 A38 38 0 0 1 98 86 Z" fill="#F2C14E" />
            <path d="M28 70 q8 -10 16 -2 t16 -4 t16 2 t14 -4" fill="none" stroke="#9DB36B" stroke-width="6" />
            <circle cx="42" cy="62" r="4" fill="#C9475E" />
            <circle cx="62" cy="58" r="4" fill="#C9475E" />
            <circle cx="80" cy="62" r="4" fill="#C9475E" />
            <path d="M22 86 A38 38 0 0 1 98 86" fill="none" stroke="#D99A2B" stroke-width="4" />
          }
          @case ('massas') {
            <path d="M34 34 q6 10 0 18 q-6 8 0 16 M48 28 q6 10 0 20 q-6 10 0 20 M62 30 q6 10 0 18 q-6 8 0 16 M76 34 q6 8 0 16" fill="none" stroke="#F2C14E" stroke-width="4" />
            <path d="M18 62 h84 a42 34 0 0 1 -84 0 Z" fill="#F8F6F1" />
            <circle cx="52" cy="58" r="7" fill="#9B3B3B" />
            <circle cx="70" cy="60" r="6" fill="#9B3B3B" />
            <path d="M30 78 q30 10 60 0" fill="none" stroke="#B8925A" stroke-width="3" />
          }
          @case ('saudavel') {
            <ellipse cx="44" cy="44" rx="10" ry="20" transform="rotate(-30 44 44)" fill="#9DB36B" />
            <ellipse cx="66" cy="38" rx="9" ry="20" transform="rotate(15 66 38)" fill="#7E9A55" />
            <ellipse cx="82" cy="50" rx="8" ry="16" transform="rotate(45 82 50)" fill="#B5C77F" />
            <circle cx="56" cy="54" r="7" fill="#E07A5F" />
            <path d="M18 60 h84 a42 34 0 0 1 -84 0 Z" fill="#F8F6F1" />
            <path d="M30 76 q30 10 60 0" fill="none" stroke="#9DB36B" stroke-width="3" />
          }
          @case ('asiatica') {
            <line x1="70" y1="10" x2="96" y2="58" stroke="#B8925A" stroke-width="4" />
            <line x1="82" y1="8" x2="104" y2="56" stroke="#B8925A" stroke-width="4" />
            <path d="M40 40 q4 10 0 20 M52 36 q4 12 0 24 M64 38 q4 10 0 22" fill="none" stroke="#F2C14E" stroke-width="4" />
            <path d="M18 60 h84 a42 36 0 0 1 -84 0 Z" fill="#C9475E" />
            <path d="M18 60 h84" stroke="#F8F6F1" stroke-width="4" />
            <path d="M44 80 h32" stroke="#F8F6F1" stroke-width="3" opacity="0.6" />
          }
          @case ('brasileira') {
            <path d="M18 64 h84 a42 32 0 0 1 -84 0 Z" fill="#F8F6F1" />
            <ellipse cx="44" cy="58" rx="20" ry="10" fill="#F3E6C8" />
            <ellipse cx="76" cy="58" rx="20" ry="10" fill="#4A2A22" />
            <circle cx="70" cy="56" r="2" fill="#2b1611" />
            <circle cx="80" cy="60" r="2" fill="#2b1611" />
            <rect x="52" y="42" width="18" height="12" rx="4" fill="#9B3B3B" />
            <path d="M30 80 q30 10 60 0" fill="none" stroke="#B8925A" stroke-width="3" />
          }
          @default {
            <path d="M26 82 A34 32 0 0 1 94 82 Z" fill="#F8F6F1" />
            <circle cx="60" cy="46" r="5" fill="#B8925A" />
            <rect x="16" y="82" width="88" height="7" rx="3.5" fill="#B8925A" />
            <path d="M40 66 q6 -12 18 -16" fill="none" stroke="#E9D8C4" stroke-width="4" />
          }
        }
      </g>
    </svg>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; }
      .art { display: block; width: 100%; height: 100%; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodArtComponent {
  /** Culinárias, nome do restaurante e/ou do prato: tudo serve de pista. */
  hints = input<(string | null | undefined)[]>([]);

  protected readonly patternId = `food-dots-${++uid}`;
  protected readonly glowId = `food-glow-${uid}`;

  protected readonly segment = computed(() => foodSegment(this.hints()));
  protected readonly background = computed(() => BACKGROUNDS[this.segment()]);
  protected readonly label = computed(() => `Ilustração: ${LABELS[this.segment()]}`);
}

const LABELS: Record<FoodSegment, string> = {
  pizza: 'pizza',
  japonesa: 'comida japonesa',
  hamburguer: 'hambúrguer',
  cafe: 'café',
  doces: 'doces',
  sorvete: 'sorvete',
  carnes: 'carnes',
  arabe: 'comida árabe',
  'frutos-do-mar': 'frutos do mar',
  bar: 'bar',
  padaria: 'padaria',
  mexicana: 'comida mexicana',
  massas: 'massas',
  saudavel: 'comida saudável',
  asiatica: 'comida asiática',
  brasileira: 'comida brasileira',
  geral: 'restaurante',
};
