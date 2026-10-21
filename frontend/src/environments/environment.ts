// Configuração usada no build de produção (Vercel).
// apiUrl = endereço público do backend no Render, terminando em /api.
export const environment = {
  production: true,
  apiUrl: 'https://taste-backend-dgn4.onrender.com/api',
  // Monitoramento de erros (Sentry). Vazio = desligado. O DSN é público por natureza (vai no app).
  sentryDsn: 'https://24046159486b6dfd38535acb5e618bd7@o4512295761739776.ingest.us.sentry.io/4512295801520128',
};
