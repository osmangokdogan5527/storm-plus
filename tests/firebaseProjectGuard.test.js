import test from 'node:test';
import assert from 'node:assert/strict';
import { getFirebaseConfigurationError } from '../src/utils/firebaseProjectGuard.js';

const configuredEnvironment = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'storm-plus-test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'storm-plus-test',
  VITE_FIREBASE_STORAGE_BUCKET: 'storm-plus-test.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:test',
  VITE_FIREBASE_DATABASE_ID: '(default)',
};

test('accepts complete settings for the existing Storm Plus project', () => {
  assert.equal(getFirebaseConfigurationError(configuredEnvironment), null);
});

test('requires explicit Storm Plus settings instead of falling back to another app', () => {
  assert.match(getFirebaseConfigurationError({}), /başka uygulamanın ayarlarını kopyalamayın/);
  assert.match(getFirebaseConfigurationError({
    VITE_FIREBASE_API_KEY: 'other-app-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'other-app.firebaseapp.com',
  }), /Storm Plus Firebase ayarları eksik/);
});

test('requires the existing Firestore database ID explicitly', () => {
  const { VITE_FIREBASE_DATABASE_ID, ...withoutDatabaseId } = configuredEnvironment;
  assert.match(getFirebaseConfigurationError(withoutDatabaseId), /Firestore veritabanı bilgilerini ekleyin/);
  assert.equal(getFirebaseConfigurationError(configuredEnvironment), null);
});
