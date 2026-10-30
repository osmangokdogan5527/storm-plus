import { useEffect, useState } from 'react';
import {
  auth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  setActiveUser,
  isFirebaseConfigured,
} from '../firebase';
import { logUserActivity } from '../utils/userLogger';

function toAuthMessage(error: any) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresiyle zaten bir hesap var.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter olmalıdır.';
    case 'auth/invalid-email':
      return 'Geçerli bir e-posta adresi girin.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.';
    default:
      return error?.message || 'Firebase bağlantısı kurulamadı.';
  }
}

export function useAppAuth(
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void,
  setUserRole: (role: 'admin' | 'employee') => void,
  setActiveTab: (tab: any) => void
) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('storm_muhasebe_active_user');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setActiveUser(firebaseUser?.uid || null);
      if (!firebaseUser) {
        setUserRole('employee');
        setAuthLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdTokenResult();
        setUserRole(token.claims.admin === true ? 'admin' : 'employee');
        logUserActivity(firebaseUser.uid, firebaseUser.displayName || firebaseUser.email || 'Kullanıcı', 'login');
        setActiveTab(window.innerWidth < 768 ? 'menu' : 'dashboard');
      } catch {
        setUserRole('employee');
      } finally {
        setAuthLoading(false);
      }
    }, () => {
      setUser(null);
      setActiveUser(null);
      setUserRole('employee');
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [setActiveTab, setUserRole]);

  const ensureConfigured = () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase ayarları eksik. Yeni proje bilgilerini yerel .env dosyasına ekleyin.');
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    ensureConfigured();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthError(null);
    } catch (error: any) {
      throw new Error(toAuthMessage(error));
    }
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    ensureConfigured();
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(credential.user, { displayName });
      setAuthError(null);
    } catch (error: any) {
      throw new Error(toAuthMessage(error));
    }
  };

  const handlePasswordReset = async (email: string) => {
    ensureConfigured();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(toAuthMessage(error));
    }
  };

  const handleSignOut = async () => {
    if (user) {
      logUserActivity(user.uid, user.displayName || user.email || 'Kullanıcı', 'logout');
    }
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch {
      showToast('Çıkış yapılırken bir hata oluştu.', 'error');
    }
  };

  return {
    user,
    authLoading,
    setAuthLoading,
    authError,
    setAuthError,
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
    handleSignOut,
  };
}