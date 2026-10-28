import { getStoredToken } from './auth.service';

const PREFIX = 'taste.cache.v1:';
/** Limite aproximado (em caracteres) para não encher o armazenamento do navegador. */
const MAX_TOTAL = 3_000_000;

interface Entry {
  at: number;
  body: unknown;
}

/**
 * Últimas respostas da API guardadas no aparelho, separadas por conta.
 * Fotos não entram aqui: elas já ficam no cache do navegador pelo endereço próprio.
 */
export const offlineCache = {
  get(key: string): unknown | undefined {
    try {
      const raw = localStorage.getItem(fullKey(key));
      return raw ? (JSON.parse(raw) as Entry).body : undefined;
    } catch {
      return undefined;
    }
  },

  set(key: string, body: unknown): void {
    const value = JSON.stringify({ at: Date.now(), body } satisfies Entry);
    if (value.length > MAX_TOTAL / 4) return; // resposta grande demais para guardar
    try {
      localStorage.setItem(fullKey(key), value);
    } catch {
      // Armazenamento cheio: abre espaço apagando as respostas mais antigas e tenta de novo
      evictOldest();
      try {
        localStorage.setItem(fullKey(key), value);
      } catch {
        // sem espaço: segue sem guardar
      }
    }
  },

  /** Apaga só as respostas cujo endereço começa com algum dos prefixos (ex.: "/feed"). */
  clearMatching(prefixes: string[]): void {
    try {
      for (const key of ownKeys()) {
        const path = key.slice(key.indexOf(':', PREFIX.length) + 1);
        if (prefixes.some((p) => path.startsWith(p))) localStorage.removeItem(key);
      }
    } catch {
      // nada a limpar
    }
  },

  /** Ao sair da conta: apaga tudo. */
  clear(): void {
    try {
      for (const key of ownKeys()) localStorage.removeItem(key);
    } catch {
      // nada a limpar
    }
  },
};

/** Cada conta tem o seu espaço (a chave usa um trecho do token, nunca dados pessoais). */
function fullKey(key: string): string {
  const token = getStoredToken() ?? 'anon';
  return `${PREFIX}${token.slice(-16)}:${key}`;
}

function ownKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

function evictOldest(): void {
  const entries = ownKeys()
    .map((key) => {
      try {
        return { key, at: (JSON.parse(localStorage.getItem(key) ?? '{}') as Entry).at ?? 0 };
      } catch {
        return { key, at: 0 };
      }
    })
    .sort((a, b) => a.at - b.at);
  for (const { key } of entries.slice(0, Math.max(1, Math.ceil(entries.length / 2)))) {
    localStorage.removeItem(key);
  }
}
