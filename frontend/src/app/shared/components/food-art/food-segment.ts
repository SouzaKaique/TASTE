/** Segmentos com ilustração própria. */
export type FoodSegment =
  | 'pizza'
  | 'japonesa'
  | 'hamburguer'
  | 'cafe'
  | 'doces'
  | 'sorvete'
  | 'carnes'
  | 'arabe'
  | 'frutos-do-mar'
  | 'bar'
  | 'padaria'
  | 'mexicana'
  | 'massas'
  | 'saudavel'
  | 'asiatica'
  | 'brasileira'
  | 'geral';

/**
 * Palavras que indicam cada segmento, na ordem de prioridade
 * ("Pizzaria Italiana" é pizza antes de ser massa; "Pad thai de camarão" é asiática).
 */
const RULES: [FoodSegment, string[]][] = [
  ['pizza', ['pizza', 'pizzaria', 'pizzeria']],
  ['japonesa', ['japon', 'sushi', 'temaki', 'sashimi', 'ramen', 'lamen', 'izakaya', 'poke', 'yakisoba', 'omakase', 'nigiri', 'udon', 'tempura', 'gyoza', 'hashi']],
  ['hamburguer', ['hamburg', 'burger', 'burguer', 'lanche', 'lanchonete', 'sanduich', 'hot dog', 'cachorro']],
  ['sorvete', ['sorvete', 'gelato', 'ice cream', 'acai', 'paleta', 'frozen']],
  ['doces', ['doce', 'confeitaria', 'bolo', 'cake', 'brigadeir', 'chocolat', 'sobremesa', 'dessert', 'torta', 'cupcake']],
  ['cafe', ['cafe', 'cafeteria', 'coffee', 'espresso', 'starbucks', 'cha ']],
  ['padaria', ['padaria', 'panificadora', 'bakery', 'pao', 'croissant', 'boulangerie']],
  ['carnes', ['churrasc', 'steak', 'carne', 'grill', 'parrilla', 'barbecue', 'bbq', 'costela', 'espetinho', 'outback', 'frango', 'chicken']],
  ['arabe', ['arabe', 'libanes', 'esfiha', 'esfirra', 'kebab', 'shawarma', 'falafel', 'quibe', 'kibe', 'habib']],
  ['mexicana', ['mexican', 'taco', 'burrito', 'nacho', 'tex mex', 'quesadilla']],
  ['asiatica', ['chines', 'china', 'tailand', 'thai', 'vietna', 'coreana', 'korean', 'indiana', 'asiat', 'wok', 'pad thai', 'bangkok']],
  ['frutos-do-mar', ['frutos do mar', 'peixe', 'seafood', 'camarao', 'marisco', 'ostra', 'peixaria', 'coco bambu']],
  ['massas', ['italian', 'massa', 'trattoria', 'cantina', 'osteria', 'spaghetti', 'lasanha', 'risoto', 'nhoque']],
  ['saudavel', ['vegan', 'vegetarian', 'saudavel', 'natural', 'salada', 'fit', 'organico', 'bowl']],
  ['bar', ['bar', 'pub', 'boteco', 'choperia', 'cervejaria', 'chopp', 'chope', 'brewery', 'drinks']],
  ['brasileira', ['brasileir', 'regional', 'mineira', 'nordestin', 'feijoada', 'restaurante popular', 'comida caseira', 'self service', 'buffet']],
];

function normalize(text: string): string {
  return ` ${text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()} `;
}

/** Descobre o segmento a partir de culinárias, nome do lugar ou do prato. */
export function foodSegment(hints: (string | null | undefined)[]): FoodSegment {
  const text = normalize(hints.filter(Boolean).join(' | '));
  for (const [segment, words] of RULES) {
    // "bar" e "fit" só valem como palavra inteira, para não casar com "Barbecue" ou "Fitzgerald"
    if (words.some((w) => (w.length <= 3 ? new RegExp(`[^a-z]${w}[^a-z]`).test(text) : text.includes(w)))) {
      return segment;
    }
  }
  return 'geral';
}
