const KEY = 'taste.invite';

/**
 * Convite aberto antes do login/cadastro: fica guardado nesta aba até a pessoa entrar,
 * para virar amiga de quem convidou logo em seguida.
 */
export const pendingInvite = {
  get(): string | null {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(code: string): void {
    try {
      sessionStorage.setItem(KEY, code);
    } catch {
      // sem armazenamento: o convite vale só se a pessoa já estiver logada
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // nada a limpar
    }
  },
};
