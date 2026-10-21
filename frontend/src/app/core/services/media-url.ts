import { environment } from '../../../environments/environment';

/** Origem do backend (ex.: https://taste-backend.onrender.com), sem o "/api" do fim. */
const API_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

/**
 * As fotos vêm da API como caminho ("/api/public/photos/12?v=...&s=...");
 * aqui vira o endereço completo do backend, que fica em outro domínio.
 */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith('/api/') ? API_ORIGIN + path : path;
}
