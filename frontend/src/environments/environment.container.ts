// Configuração usada no build da imagem Docker da raiz (Coolify): o site vai dentro do backend,
// então a API fica no mesmo endereço do site e basta o caminho relativo.
export const environment = {
  production: true,
  apiUrl: '/api',
  // Monitoramento de erros (Sentry). Vazio = desligado. O DSN é público por natureza (vai no app).
  sentryDsn: 'https://24046159486b6dfd38535acb5e618bd7@o4512295761739776.ingest.us.sentry.io/4512295801520128',
};
