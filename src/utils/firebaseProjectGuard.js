const REQUIRED_FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export function getFirebaseConfigurationError(environment) {
  if (REQUIRED_FIREBASE_ENV_KEYS.some((key) => !String(environment?.[key] || '').trim())) {
    return 'Storm Plus Firebase ayarları eksik. Mevcut ayrı Storm Plus Firebase web uygulaması ayarlarını ekleyin; başka uygulamanın ayarlarını kopyalamayın.';
  }

  return null;
}
