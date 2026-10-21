// Configuração usada no build de produção (Vercel).
// apiUrl = endereço público do backend no Render, terminando em /api.
export const environment = {
  production: true,
  apiUrl: 'https://taste-backend-dgn4.onrender.com/api',
  // Monitoramento de erros (Sentry). Vazio = desligado. O DSN é público por natureza (vai no app).
  sentryDsn: '',
};
