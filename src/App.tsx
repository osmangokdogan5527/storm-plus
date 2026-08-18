import { getBusinessDateStr } from "./utils/DateUtils";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSettings } from './hooks/useAppSettings';
import { useAppData } from './hooks/useAppData';
import { useAppAuth } from './hooks/useAppAuth';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { usePrintSettings } from './hooks/usePrintSettings';
import { useBackupActions } from './hooks/useBackupActions';
import { useLogoActions } from './hooks/useLogoActions';
import { renderToStaticMarkup } from 'react-dom/server';
import { Cari, Stock, Transaction, Expense, Employee, EmployeeTransaction, BankAccount, AccountTransaction, KeyboardShortcut } from './types';
import { 
  subscribeCariler, 
  subscribeStoklar, 
  subscribeIslemler, 
  clearAllDatabaseData, 
  importAllDatabaseData,
  subscribeExpenses, 
  subscribeEmployees, 
  subscribeEmployeeTransactions,
  subscribeBankAccounts,
  subscribeAccountTransactions,
  auth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  setActiveUser,
  getActiveWorkspace,
  saveBankAccount,
  createTransaction,
  saveOnlineOrder,
  db,
  saveSettings,
} from './firebase';
import { reportErrorToTelegram } from './utils/telegramLogger';
import { PosCartItem, PosPaymentSplit } from './types/pos';
import { PosView } from './components/pos/PosView';
import { OnlineMarketlerView } from './components/OnlineMarketlerView';
import { GunlukSatisRaporuView } from './components/GunlukSatisRaporuView';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { BackupWizardModal } from './components/backup/BackupWizardModal';
import DashboardView from './components/DashboardView';
import CarilerView from './components/CarilerView';
import StoklarView from './components/StoklarView';
import IslemlerView from './components/IslemlerView';
import MasraflarView from './components/MasraflarView';
import CalisanlarView from './components/CalisanlarView';
import KasaView from './components/KasaView';
import RaporlarView from './components/RaporlarView';
import { GlobalStyles } from "./components/GlobalStyles";
import YetkisizErisimView from './components/YetkisizErisimView';
import AyarlarView from './components/AyarlarView';
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MobileMenuView } from "./components/MobileMenuView";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { AppModals } from "./components/AppModals";
import { compressImage } from './utils/imageCompressor';

import { StormLogo, APP_VERSION, CHANGELOG, PREDEFINED_USERS, COLOR_PRESETS, TAB_DEFS, SIDEBAR_PATTERNS, PIN_ACCOUNTS, changelogData, DEFAULT_SHORTCUTS } from "./constants";
export default function App() {
  const [isBackupWizardOpen, setIsBackupWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return window.innerWidth < 768 ? 'menu' : 'dashboard';
  });
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
      try {
        await enableNetwork(db);
        console.log("Firestore network enabled.");
      } catch (err) {
        console.error("Failed to enable network", err);
      }
    };
    const handleOffline = async () => {
      setIsOnline(false);
      try {
        await disableNetwork(db);
        console.log("Firestore network disabled explicitly.");
      } catch (err) {
        console.error("Failed to disable network", err);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [pendingIslemModal, setPendingIslemModal] = useState<'sale' | 'purchase' | 'collection' | 'payment' | null>(null);
  const [pendingCariId, setPendingCariId] = useState<string | null>(null);
  const [selectedCariIdForDetails, setSelectedCariIdForDetails] = useState<string | null>(null);
  const [pendingAddCari, setPendingAddCari] = useState<boolean>(false);
  const [pendingAddStock, setPendingAddStock] = useState<boolean>(false);
  const [isIslemlerSubMenuOpen, setIsIslemlerSubMenuOpen] = useState(false);

  

  // 1. Auth State
  const {
    user, setUser,
    authLoading, setAuthLoading,
    authError, setAuthError,
    enteredPin, setEnteredPin,
    handlePinLogin, handleSignOut
  } = useAppAuth(showToast, setUserRole, setActiveTab);
  
  // 2. Data State (Depends on user)
  const {
    cariler, setCariler,
    stoklar, setStoklar,
    islemler, setIslemler,
    expenses, setExpenses,
    employees, setEmployees,
    employeeTransactions, setEmployeeTransactions,
    bankAccounts, setBankAccounts,
    accountTransactions, setAccountTransactions,
    recurringTransactions, setRecurringTransactions,
    appSettings, setAppSettings,
    securitySettings, setSecuritySettings,
    printSettings, setPrintSettings,
    shortcutSettings, setShortcutSettings,
    backupSettings, setBackupSettings,
    loading, setLoading
  } = useAppData(user);
  
  // 3. Settings State
  const {
    activeTheme, setActiveTheme,
    designStyle, setDesignStyle,
    activeLogoTheme, setActiveLogoTheme,
    appFontSize, setAppFontSize,
    sidebarBg, setSidebarBg,
    sidebarPattern, setSidebarPattern,
    sidebarPatternOpacity, setSidebarPatternOpacity,
    sidebarPatternColor, setSidebarPatternColor,
    hiddenTabs, setHiddenTabs, toggleTabVisibility,
    tabOrder, setTabOrder, moveTab,
            autoBackupEnabled, setAutoBackupEnabled
  } = useAppSettings(appSettings);
  

  

  const {
    isBackupLoading,
    backupMessage,
    setBackupMessage,
    handleManualBackup,
    handleRestoreBackup,
    toggleAutoBackup,
    handleOpenBackupFolder
  } = useBackupActions(showToast, autoBackupEnabled, setAutoBackupEnabled);

  const {
    handleDownloadLogoSvg,
    handleDownloadLogoPng
  } = useLogoActions(
    activeLogoTheme,
    activeTheme,
    sidebarPattern,
    sidebarPatternOpacity,
    designStyle,
    sidebarBg
  );

  
  // Auth state variables
  

  
  // Admin Dashboard State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'feature'>('error');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);
  const [feedbackImageLoading, setFeedbackImageLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Init users from localStorage or predefined
  const [usersList, setUsersList] = useState<any[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_users');
    let initialList = PREDEFINED_USERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialList = PREDEFINED_USERS.map(defaultUser => {
          let matchId = defaultUser.id;
          if (defaultUser.id === 'firma_1') matchId = 'company_3';
          if (defaultUser.id === 'firma_2') matchId = 'company_4';
          if (defaultUser.id === 'firma_3') matchId = 'company_5';
          
          const savedUser = parsed.find((u: any) => u.id === defaultUser.id || u.id === matchId);
          if (savedUser) {
            const legacyNames = ['XSTORM', 'Yönetici', 'Muhasebe Departmanı', 'Kullanıcı 1', 'Kullanıcı 2', 'Kullanıcı 3', 'Kullanıcı 4', 'Kullanıcı 5', 'OSES KARTALTEPE'];
            const isNameCustomized = savedUser.name && !legacyNames.includes(savedUser.name) && savedUser.name !== defaultUser.name;
            const isPinCustomized = savedUser.pin && savedUser.pin !== '270212' && savedUser.pin !== defaultUser.pin;
            
            return {
              ...defaultUser,
              name: isNameCustomized ? savedUser.name : defaultUser.name,
              pin: isPinCustomized ? savedUser.pin : defaultUser.pin,
              photoURL: savedUser.photoURL || ''
            };
          }
          return defaultUser;
        });
      } catch (e) {}
    }
    try {
      localStorage.setItem('storm_muhasebe_users', JSON.stringify(initialList));
    } catch (e) {}
    return initialList;
  });

  const [selectedPinAccount, setSelectedPinAccount] = useState<typeof PREDEFINED_USERS[0] | null>(null);

  // Settings password variables
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState<string | null>(null);
  const [settingsPasswordError, setSettingsPasswordError] = useState<string | null>(null);

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  // Dynamic permissions and admin PIN states
  const [sensitiveTabs, setSensitiveTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_sensitive_tabs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return ['dashboard', 'kasa', 'ceksenet', 'masraflar', 'calisanlar', 'krediler', 'raporlar', 'ayarlar'];
  });

  const [escalationPin, setEscalationPin] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_admin_pin') || '1923';
  });

  const [isSecurityActive, setIsSecurityActive] = useState<boolean>(() => {
    return localStorage.getItem('storm_muhasebe_security_active') === 'true';
  });

  // Dynamic action-level permissions for employees (true means ALLOWED, false means RESTRICTED)
  const [actionPermissions, setActionPermissions] = useState<{
    delete_sale: boolean;
    delete_payment: boolean;
    delete_stock: boolean;
    decrease_stock: boolean;
    edit_sale: boolean;
    edit_payment: boolean;
    edit_stock: boolean;
  }>(() => {
    const saved = localStorage.getItem('storm_muhasebe_action_permissions');
    const defaultPerms = {
      delete_sale: false,
      delete_payment: false,
      delete_stock: false,
      decrease_stock: false,
      edit_sale: false,
      edit_payment: false,
      edit_stock: false,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultPerms, ...parsed };
      } catch (e) {
        // ignore
      }
    }
    return defaultPerms;
  });

const isSecurityLoaded = React.useRef(false);
  React.useEffect(() => {
    if (securitySettings && !isSecurityLoaded.current) {
      isSecurityLoaded.current = true;
      if (securitySettings.usersList) setUsersList(securitySettings.usersList);
      if (securitySettings.sensitiveTabs) setSensitiveTabs(securitySettings.sensitiveTabs);
      if (securitySettings.adminPin) setAdminPin(securitySettings.adminPin);
      if (securitySettings.isSecurityActive !== undefined) setIsSecurityActive(securitySettings.isSecurityActive);
      if (securitySettings.actionPermissions) setActionPermissions(securitySettings.actionPermissions);
    }
  }, [securitySettings]);

  const syncSecurityToCloud = async (updates: any) => {
    if (isSecurityLoaded.current) {
      try {
        await saveSettings('securitySettings', updates);
      } catch (e) {}
    }
  };

  React.useEffect(() => {
    if (isSecurityLoaded.current) {
      localStorage.setItem('storm_muhasebe_users', JSON.stringify(usersList));
      localStorage.setItem('storm_muhasebe_sensitive_tabs', JSON.stringify(sensitiveTabs));
      localStorage.setItem('storm_muhasebe_admin_pin', adminPin);
      localStorage.setItem('storm_muhasebe_security_active', isSecurityActive.toString());
      localStorage.setItem('storm_muhasebe_action_permissions', JSON.stringify(actionPermissions));
      
      syncSecurityToCloud({
        usersList,
        sensitiveTabs,
        adminPin,
        isSecurityActive,
        actionPermissions
      });
    }
  }, [usersList, sensitiveTabs, adminPin, isSecurityActive, actionPermissions]);
  
  

  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfilePhoto((user as any).photoURL || '');
    }
  }, [user]);


  // Global hardware barcode scanner listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Ignore standard modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }

      // If it's a single printable character (length is 1), record it
      if (e.key && e.key.length === 1) {
        // If the typing speed is slow (> 50ms), reset the buffer to only keep the current character.
        // Humans cannot type with < 50ms consistently. Hardware scanners type at < 15ms.
        if (timeDiff > 50) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      } else if (e.key === 'Enter') {
        // When Enter is pressed, if we have built up a rapid barcode sequence, trigger the event
        if (buffer.length >= 4 && timeDiff < 50) {
          e.preventDefault();
          const scannedCode = buffer.trim();
          buffer = '';
          
          const event = new CustomEvent('global-hardware-barcode-scan', {
            detail: { code: scannedCode }
          });
          window.dispatchEvent(event);
        } else {
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // useCapture to intercept early before active inputs
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);


  const handleNavigate = useCallback((tabId: string) => {
    if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId)) {
      setAdminPinError(null);
      setAdminPinInput('');
      setIsAdminPinModalOpen(true);
      return;
    }
    setActiveTab(tabId as any);
  }, [isSecurityActive, userRole, sensitiveTabs]);
  
  const [companyName, setCompanyName] = useState<string>('Storm Yazılım');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyAddress, setCompanyAddress] = useState<string>('');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState<string>('');
  const [printSettingsSuccess, setPrintSettingsSuccess] = useState<boolean>(false);
  const handleSavePrintSettings = async () => {};

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded'>('idle');
  const [updatePercent, setUpdatePercent] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [availableUpdateVersion, setAvailableUpdateVersion] = useState<string>('');
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const handleCloseChangelog = () => setShowChangelog(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  
  const { shortcuts, setShortcuts } = useAppShortcuts(handleNavigate, setPendingIslemModal, setPendingAddCari, setPendingAddStock, shortcutSettings);

  // Updates Effect
  useEffect(() => {
    let cleanupProgress: any = null;
    let cleanupDownloaded: any = null;
    let cleanupError: any = null;
    if (window.electronAPI) {
      if ((window.electronAPI as any).onUpdateProgress) {
        cleanupProgress = (window.electronAPI as any).onUpdateProgress((progressObj: any) => {
          setUpdateStatus('downloading');
          if (progressObj && progressObj.percent !== undefined) {
             console.log("Update progress:", progressObj.percent);
          }
        });
      }
      if (window.electronAPI.onUpdateDownloaded) {
        cleanupDownloaded = window.electronAPI.onUpdateDownloaded(() => {
          setUpdateStatus('downloaded');
        });
      }
      if ((window.electronAPI as any).onUpdateError) {
        cleanupError = (window.electronAPI as any).onUpdateError((error: string) => {
          setUpdateError(error);
          setUpdateStatus('idle'); // Hata durumunda idle'a dön
          
          let friendlyError = error;
          if (friendlyError && typeof friendlyError === 'string') {
            if (friendlyError.includes('No published versions on GitHub')) {
              friendlyError = 'GitHub üzerinde henüz yayınlanmış (Publish edilmiş) bir uygulama sürümü bulunamadı. Lütfen GitHub deposunun "Releases" kısmında en az bir sürüm oluşturup yayınladığınızdan emin olun.';
            } else if (friendlyError.includes('HttpError: 404')) {
              friendlyError = 'GitHub deponuz bulunamadı (404 Hatası). Lütfen package.json dosyasındaki "owner" ve "repo" bilgilerinin doğruluğunu ve deponun herkese açık (public) olduğunu kontrol edin.';
            }
          }
          
          alert(`Güncelleme indirilirken hata oluştu:
${friendlyError}`);
        });
      }
    }
    
    return () => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupDownloaded) cleanupDownloaded();
      if (cleanupError) cleanupError();
    };
  }, []);

  





  useEffect(() => {
    if (!user) return;
    // 1. Update in the user list so that it shows on the login screen
    const updatedUsers = usersList.map(u => {
      if (u.id === user?.uid) {
        return {
          ...u,
          name: profileName || user.displayName || u.name,
          photoURL: profilePhoto || (user as any).photoURL || u.photoURL
        };
      }
      return u;
    });
    localStorage.setItem('storm_muhasebe_users', JSON.stringify(updatedUsers));
    // 2. Update the active logged in user in localStorage
    const updatedUser = {
      ...user,
      displayName: profileName || user.displayName,
      photoURL: profilePhoto || (user as any).photoURL
    };
    localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(updatedUser));
  }, [user, profileName, profilePhoto, usersList]);







  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetExcludeStocks, setResetExcludeStocks] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
  const themeCssRules = React.useMemo(() => {
    let rules = Object.entries(currentThemeData.colors)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
      
    const accent500 = (currentThemeData.colors as any)['--accent-500'];
    if (accent500 && accent500.startsWith('#')) {
      const hex = accent500.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      rules += `\n--accent-rgb: ${r}, ${g}, ${b};`;
    }
    
    return rules;
  }, [currentThemeData]);
  const activePatternObj = useMemo(() => {
    return SIDEBAR_PATTERNS.find(p => p.id === sidebarPattern) || SIDEBAR_PATTERNS[0];
  }, [sidebarPattern]);

  const bodyPatternSvg = useMemo(() => {
    return (activePatternObj.svg && designStyle !== 'clean-light' && designStyle !== 'pro-solid')
      ? activePatternObj.svg
          .replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
          .replace(/OPACITY/g, (sidebarPatternOpacity * 0.5).toString())
      : '';
  }, [activePatternObj, designStyle, sidebarPatternColor, sidebarPatternOpacity]);

  const isLightSidebar = sidebarBg === '#ffffff';

  const sidebarPatternStyle = useMemo(() => {
    if (sidebarPattern !== 'none' && sidebarPatternOpacity > 0 && designStyle !== 'clean-light' && designStyle !== 'pro-solid') {
      return {
        backgroundImage: activePatternObj.svg
          ?.replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
          ?.replace(/OPACITY/g, sidebarPatternOpacity.toString()),
        backgroundSize: activePatternObj.size || 'auto'
      };
    }
    return {};
  }, [sidebarPattern, sidebarPatternOpacity, designStyle, activePatternObj, sidebarPatternColor]);

  const renderWorkspaceView = useCallback((id: string, content: any) => (
    <div className={`w-full max-w-[1600px] mx-auto ${isLightSidebar ? 'text-gray-800' : 'text-gray-100'} transition-colors duration-300`}>
      {content}
    </div>
  ), [isLightSidebar]);

  const renderSettingsView = () => (
    <AyarlarView
      activeTheme={activeTheme}
      setActiveTheme={setActiveTheme}
      designStyle={designStyle}
      setDesignStyle={setDesignStyle}
      activeLogoTheme={activeLogoTheme}
      setActiveLogoTheme={setActiveLogoTheme}
      appFontSize={appFontSize}
      setAppFontSize={setAppFontSize}
      sidebarBg={sidebarBg}
      setSidebarBg={setSidebarBg}
      sidebarPattern={sidebarPattern}
      setSidebarPattern={setSidebarPattern}
      sidebarPatternOpacity={sidebarPatternOpacity}
      setSidebarPatternOpacity={setSidebarPatternOpacity}
      sidebarPatternColor={sidebarPatternColor}
      setSidebarPatternColor={setSidebarPatternColor}
      tabOrder={tabOrder}
      setTabOrder={setTabOrder}
      hiddenTabs={hiddenTabs}
      setHiddenTabs={setHiddenTabs}
      toggleTabVisibility={toggleTabVisibility}
      moveTab={moveTab}
      handleDownloadLogoPng={handleDownloadLogoPng}
      handleDownloadLogoSvg={handleDownloadLogoSvg}
      companyName={companyName}
      setCompanyName={setCompanyName}
      companyPhone={companyPhone}
      setCompanyPhone={setCompanyPhone}
      companyAddress={companyAddress}
      setCompanyAddress={setCompanyAddress}
      logoType={logoType}
      setLogoType={setLogoType}
      logoImageUrl={logoImageUrl}
      setLogoImageUrl={setLogoImageUrl}
      handleSavePrintSettings={handleSavePrintSettings}
      printSettingsSuccess={printSettingsSuccess}
      profileName={profileName}
      setProfileName={setProfileName}
      profilePhoto={profilePhoto}
      setProfilePhoto={setProfilePhoto}
      profilePassword={profilePassword}
      setProfilePassword={setProfilePassword}
      settingsPasswordSuccess={settingsPasswordSuccess}
      settingsPasswordError={settingsPasswordError}
      handleProfileUpdate={handleProfileUpdate}
      handleManualBackup={handleManualBackup}
      isBackupLoading={isBackupLoading}
      handleRestoreBackup={handleRestoreBackup}
      toggleAutoBackup={toggleAutoBackup}
      autoBackupEnabled={autoBackupEnabled}
      handleOpenBackupFolder={handleOpenBackupFolder}
      backupMessage={backupMessage}
      setResetModalOpen={setResetModalOpen}
      setResetExcludeStocks={setResetExcludeStocks}
      onOpenBackupWizard={() => setIsBackupWizardOpen(true)}
                              isSecurityActive={isSecurityActive}
      setIsSecurityActive={setIsSecurityActive}
      userRole={userRole}
      setUserRole={setUserRole}
      escalationPin={escalationPin}
      setEscalationPin={setEscalationPin}
      showToast={showToast}
      actionPermissions={actionPermissions}
      setActionPermissions={setActionPermissions}
      sensitiveTabs={sensitiveTabs}
      setSensitiveTabs={setSensitiveTabs}
      shortcuts={shortcuts}
      setShortcuts={setShortcuts}
    />
  );

  const handleResetAllData = async () => {
    try {
      setIsResetting(true);
      await clearAllDatabaseData({ excludeStocks: resetExcludeStocks });

      // Clear local storage online market order and payout keys across all workspaces
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('storm_online_market_orders') ||
            key.startsWith('storm_online_market_payouts') ||
            key.startsWith('storm_pos_parked_sales') ||
            key.startsWith('storm_pos_restaurant_tables')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        window.dispatchEvent(new Event('storm_online_orders_updated'));
      }

      setResetModalOpen(false);
      showToast(
        resetExcludeStocks
          ? "Stoklar hariç tüm veriler başarıyla sıfırlandı."
          : "Tüm veriler başarıyla sıfırlandı.",
        "success"
      );
    } catch (e: any) {
      setResetError(e.message || "Sıfırlama sırasında bir hata oluştu.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      if (profileName) {
        await updateProfile(user, { displayName: profileName });
      }
      showToast("Profil bilgileri başarıyla güncellendi.", "success");
    } catch (err: any) {
      showToast(`Profil güncellenirken hata oluştu: ${err.message}`, "error");
    }
  };

  if (!user) {
    return (
      <AuthScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        selectedPinAccount={selectedPinAccount}
        setSelectedPinAccount={setSelectedPinAccount}
        usersList={usersList}
        enteredPin={enteredPin}
        setEnteredPin={setEnteredPin}
        authError={authError}
        setAuthError={setAuthError}
        setUserRole={setUserRole}
        setActiveTab={setActiveTab}
        setActiveUser={setActiveUser}
        setUser={setUser}
        showAdminLogin={showAdminLogin}
        setShowAdminLogin={setShowAdminLogin}
        adminPin={adminPin}
        setAdminPin={setAdminPin}
        adminAuthError={adminAuthError}
        setAdminAuthError={setAdminAuthError}
        showAdminDashboard={showAdminDashboard}
        setShowAdminDashboard={setShowAdminDashboard}
        errorLogs={errorLogs}
        setErrorLogs={setErrorLogs}
        feedbackList={feedbackList}
        setFeedbackList={setFeedbackList}
        updateStatus={updateStatus}
        setUpdateStatus={setUpdateStatus}
        updatePercent={updatePercent}
        changelogData={changelogData}
        setZoomImage={setZoomImage}
      />
    );
  }

  if (loading) {
    return (
      <LoadingScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
      />
    );
  }

  // POS Hızlı Satış Tamamlama Entegrasyonu
  const handleCompletePosSale = async (saleData: {
    receiptNo: string;
    cariId?: string;
    cariName: string;
    items: PosCartItem[];
    paymentSplit: PosPaymentSplit;
    grandTotal: number;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    date: string;
  }) => {
    try {
      const items = saleData.items.map((item) => ({
        stockId: item.stockId,
        stockName: item.stockName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.unitPrice,
        total: item.totalLine,
      }));

      // Platform satışı kontrolü ve cari belirleme
      const isPlatformSale = !!saleData.paymentSplit?.platformName;
      let finalCariId = saleData.cariId;
      let finalCariName = saleData.cariName;

      if (isPlatformSale) {
        const pName = saleData.paymentSplit.platformName!;
        const platKey = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const platCariId = `plat_cari_${platKey}`;
        const platCariName = pName;

        // Platform satışlarında varsayılan perakende cari veya genel platform cari kullanılıyorsa, doğrudan bu platformun kendi cari kartına aktar
        if (!finalCariId || finalCariId === 'perakende_musteri' || finalCariId.startsWith('plat_cari_')) {
          finalCariId = platCariId;
          finalCariName = platCariName;
        }
      } else {
        if (!finalCariId) {
          finalCariId = 'perakende_musteri';
          finalCariName = 'Perakende Müşteri';
        }
      }

      // 1. Ana Satış Faturası / İşlemi (Her platform için kendi cari kartı adıyla)
      const netAmountForTransaction = isPlatformSale && saleData.paymentSplit?.platformNetAmount
        ? saleData.paymentSplit.platformNetAmount
        : saleData.grandTotal;

      const mainTransaction: Omit<Transaction, 'id'> = {
        invoiceNo: saleData.receiptNo,
        type: 'sale',
        cariId: finalCariId,
        cariName: finalCariName,
        date: saleData.date,
        amount: netAmountForTransaction,
        account: isPlatformSale ? '' : (saleData.paymentSplit.cashAmount > 0
          ? 'cash'
          : saleData.paymentSplit.posAmount > 0
          ? 'pos'
          : ''),
        bankAccountId: isPlatformSale ? undefined : saleData.paymentSplit.posAccountId,
        description: `POS Hızlı Satış Fişi No: ${saleData.receiptNo}${isPlatformSale ? ` (${saleData.paymentSplit.platformName})` : ''}`,
        items,
        createdAt: new Date().toISOString(),
        currency: 'TRY',
      };

      await createTransaction(mainTransaction);

      // 2. Sol paneldeki Online Marketler sekmesine Otomatik Sipariş Kaydı Aktarma
      if (isPlatformSale && saleData.paymentSplit?.platformName) {
        try {
          const pName = saleData.paymentSplit.platformName;
          const lowerName = pName.toLowerCase();
          let platId = 'yemeksepeti';
          if (lowerName.includes('yemeksepeti')) platId = 'yemeksepeti';
          else if (lowerName.includes('getir')) platId = 'getir';
          else if (lowerName.includes('migros')) platId = 'migros';
          else if (lowerName.includes('uber')) platId = 'uber';
          else platId = lowerName.replace(/[^a-z0-9]/g, '');

          const commRate = saleData.paymentSplit.platformCommissionRate || 0;
          const commAmount = saleData.paymentSplit.platformCommissionAmount || 0;
          const netAmount = saleData.paymentSplit.platformNetAmount || (saleData.grandTotal - commAmount) || 0;

          const now = new Date();
          const dateStr = saleData.date || getBusinessDateStr();
          const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

          const newOnlineOrder = {
            id: `ord_pos_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            orderNo: saleData.receiptNo,
            platformId: platId,
            platformName: pName,
            date: dateStr,
            time: timeStr,
            customerName: `${pName} Müşterisi`,
            grossAmount: saleData.grandTotal || 0,
            commissionRate: commRate || 0,
            commissionAmount: commAmount || 0,
            netAmount: netAmount || 0,
            items: items.map((i) => ({
              stockId: i.stockId || '',
              stockName: i.stockName || '',
              quantity: i.quantity || 0,
              unitPrice: i.price || 0,
              totalLine: i.total || 0,
            })),
            note: `Hızlı Satış Fişi No: ${saleData.receiptNo}`,
            status: 'completed' as const,
            createdAt: now.toISOString(),
          };

          const ws = getActiveWorkspace();
          const targetKey = `storm_online_market_orders_${ws}`;
          const existingOrdersStr = localStorage.getItem(targetKey) || (ws === 'storm_muhasebe' ? localStorage.getItem('storm_online_market_orders') : null);
          let existingOrders = [];
          try {
            existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
            if (!Array.isArray(existingOrders)) existingOrders = [];
          } catch (e) {
            console.error('Failed to parse existing orders:', e);
          }
          if (!existingOrders.some((o: any) => o.orderNo === saleData.receiptNo)) {
            const updatedOrders = [newOnlineOrder, ...existingOrders];
            localStorage.setItem(targetKey, JSON.stringify(updatedOrders));
            if (ws === 'storm_muhasebe') {
              localStorage.setItem('storm_online_market_orders', JSON.stringify(updatedOrders));
            }
            window.dispatchEvent(new Event('storm_online_orders_updated'));
          }

          // Save online order directly to Firestore database (after local storage)
          try {
            await saveOnlineOrder(newOnlineOrder);
          } catch (fbErr) {
            console.error('Firebase saveOnlineOrder error:', fbErr);
          }
        } catch (err: any) {
          reportErrorToTelegram(err, 'App:handleCompletePosSale:onlineMarketSync');
        }
      }

      showToast('Hızlı perakende satış başarıyla tamamlandı ve stoklar düşüldü.', 'success');
      return true;
    } catch (err: any) {
      reportErrorToTelegram(err, 'App:handleCompletePosSale');
      showToast('Satış kaydı oluşturulurken hata: ' + (err.message || err), 'error');
      return false;
    }
  };

  // Online Market Sipariş Entegrasyonu
  const handleCompleteOnlineSale = async (saleData: {
    receiptNo: string;
    platformId: string;
    platformName: string;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    grossTotal: number;
    date: string;
    customerName: string;
    items?: any[];
    syncToMainAccounting?: boolean;
  }) => {
    try {
      const items = (saleData.items || []).map((item) => ({
        stockId: item.stockId || `plat_srv_${saleData.platformId}`,
        stockName: item.stockName || `${saleData.platformName} Sipariş Hizmeti`,
        quantity: item.quantity || 1,
        unit: 'Adet',
        price: item.unitPrice || saleData.grossTotal,
        total: item.totalLine || saleData.grossTotal,
      }));

      const platKey = (saleData.platformId || saleData.platformName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const platformCariId = `plat_cari_${platKey}`;
      const platformCariName = saleData.platformName;

      // 1. Ana Online Satış Faturası / İşlemi
      const onlineTransaction: Omit<Transaction, 'id'> = {
        invoiceNo: saleData.receiptNo,
        type: 'sale',
        cariId: platformCariId,
        cariName: platformCariName,
        date: saleData.date,
        amount: saleData.netAmount,
        account: '', // Henüz kasaya nakit girmedi, pazaryerinde hakediş alacağında bekliyor
        description: `Online Sipariş (${saleData.platformName}${saleData.customerName ? ` - Müşteri: ${saleData.customerName}` : ''}) - Net Alacak: ₺${saleData.netAmount.toFixed(2)} (Komisyon: %${saleData.commissionRate})`,
        items: items.length > 0 ? items : [{
          stockId: `plat_srv_${saleData.platformId}`,
          stockName: `${saleData.platformName} Online Sipariş`,
          quantity: 1,
          unit: 'Adet',
          price: saleData.netAmount,
          total: saleData.netAmount,
        }],
        createdAt: new Date().toISOString(),
        currency: 'TRY',
      };

      await createTransaction(onlineTransaction);
      return true;
    } catch (err: any) {
      reportErrorToTelegram(err, 'App:handleCompleteOnlineSale');
      showToast('Online satış kaydedilirken hata: ' + (err.message || err), 'error');
      return false;
    }
  };

  // Online Platform Hakediş Tahsilat Entegrasyonu (Banka/Kasa Aktarımı)
  const handleRecordOnlinePayout = async (payoutData: {
    platformId: string;
    platformName: string;
    amount: number;
    destinationType: 'bank' | 'cash';
    bankAccountId?: string;
    bankAccountName: string;
    date: string;
    note: string;
    syncToMainAccounting?: boolean;
  }) => {
    try {
      const platKey = (payoutData.platformId || payoutData.platformName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const platformCariId = `plat_cari_${platKey}`;
      const platformCariName = payoutData.platformName;

      const payoutTransaction: Omit<Transaction, 'id'> = {
        invoiceNo: `HAK-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'collection',
        cariId: platformCariId,
        cariName: platformCariName,
        date: payoutData.date,
        amount: payoutData.amount,
        account: payoutData.destinationType === 'bank' ? 'bank' : 'cash',
        bankAccountId: payoutData.bankAccountId,
        description: payoutData.note || `${payoutData.platformName} Hakediş Tahsilatı (${payoutData.bankAccountName})`,
        createdAt: new Date().toISOString(),
        currency: 'TRY',
      };

      await createTransaction(payoutTransaction);
      return true;
    } catch (err: any) {
      reportErrorToTelegram(err, 'App:handleRecordOnlinePayout');
      showToast('Hakediş tahsilatı kaydedilirken hata: ' + (err.message || err), 'error');
      return false;
    }
  };

  return (
    <div data-design-style={designStyle} className={`min-h-screen relative ${(currentThemeData as any).bgClass || 'bg-[#050505]'} text-[#e0e0e0] flex flex-col md:flex-row font-sans overflow-x-hidden`}>
      <GlobalStyles themeCssRules={themeCssRules} bodyPatternSvg={bodyPatternSvg} activePattern={activePatternObj} appFontSize={appFontSize} />

      {designStyle === 'fluid-mesh' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
          {/* Base deep purple/black background */}
          <div className="absolute inset-0 bg-[#06040e]" />
          {/* Floating fluid blobs with blur */}
          <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-[0.35] blur-[120px] animate-mesh-float-1" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[75vw] h-[75vw] rounded-full bg-gradient-to-br from-pink-500 to-rose-600 opacity-[0.35] blur-[120px] animate-mesh-float-2" />
          <div className="absolute top-1/4 right-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 opacity-[0.25] blur-[100px] animate-mesh-float-3" />
          <div className="absolute bottom-1/4 left-1/4 w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-[0.25] blur-[100px] animate-mesh-float-4" />
        </div>
      )}


      
            <DesktopSidebar
        isLightSidebar={isLightSidebar}
        sidebarBg={sidebarBg}
        sidebarPatternStyle={sidebarPatternStyle}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        tabOrder={tabOrder}
        hiddenTabs={hiddenTabs}
        activeTab={activeTab}
        handleNavigate={handleNavigate}
        isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
        setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
        showToast={showToast as any}
        setPendingIslemModal={setPendingIslemModal}
        setActiveTab={setActiveTab}
        isSecurityActive={isSecurityActive}
        isOnline={isOnline}
        user={user}
        handleSignOut={handleSignOut}
        setShowFeedbackModal={setShowFeedbackModal}
        setAdminPinError={setAdminPinError}
        setAdminPinInput={setAdminPinInput}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        setUserRole={setUserRole}
      />
      <MobileHeader
        sidebarBg={sidebarBg}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        isOnline={isOnline}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isLightSidebar={isLightSidebar}
        sidebarPatternStyle={sidebarPatternStyle}
        tabOrder={tabOrder}
        hiddenTabs={hiddenTabs}
        activeTab={activeTab}
        handleNavigate={handleNavigate}
        isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
        setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
        handleSignOut={handleSignOut}
        setShowFeedbackModal={setShowFeedbackModal}
        setAdminPinError={setAdminPinError}
        setAdminPinInput={setAdminPinInput}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        setUserRole={setUserRole}
        user={user}
        setPendingIslemModal={setPendingIslemModal}
        showToast={showToast as any}
        setActiveTab={setActiveTab}
        isSecurityActive={isSecurityActive}
      />
{/* 3. MAIN WORKSPACE CONTENT */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1600px] mx-auto w-full pb-20 md:pb-6">
        <div className={activeTab === 'menu' ? 'block animate-fade-in md:hidden' : 'hidden'}>
          <MobileMenuView
            tabOrder={tabOrder}
            hiddenTabs={hiddenTabs}
            activeTab={activeTab}
            handleNavigate={handleNavigate}
            isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
            setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
            userRole={userRole}
            sensitiveTabs={sensitiveTabs}
            handleSignOut={handleSignOut}
            setAdminPinError={setAdminPinError}
            setAdminPinInput={setAdminPinInput}
            setIsAdminPinModalOpen={setIsAdminPinModalOpen}
            setUserRole={setUserRole}
            user={user}
            setPendingIslemModal={setPendingIslemModal}
            showToast={showToast as any}
            setActiveTab={setActiveTab}
            isSecurityActive={isSecurityActive}
          />
        </div>
        <div className={activeTab === 'dashboard' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('dashboard', <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} expenses={expenses} employeeTransactions={employeeTransactions} recurringTransactions={recurringTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} onNavigate={handleNavigate} isOnline={isOnline} lastSyncTime={lastSyncTime} />)}
        </div>
        <div className={activeTab === 'pos' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('pos', <PosView
            stocks={stoklar}
            cariler={cariler}
            bankAccounts={bankAccounts}
            onCompletePosSale={handleCompletePosSale}
          />)}
        </div>
        <div className={activeTab === 'online_marketler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('online_marketler', <OnlineMarketlerView
            stocks={stoklar}
            cariler={cariler}
            bankAccounts={bankAccounts}
            islemler={islemler}
            showToast={showToast as any}
            onCompleteOnlineSale={handleCompleteOnlineSale}
            onRecordPayout={handleRecordOnlinePayout}
          />)}
        </div>
        <div className={activeTab === 'gunluk_satis_raporu' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('gunluk_satis_raporu', <GunlukSatisRaporuView
            islemler={islemler}
            stoklar={stoklar}
            cariler={cariler}
            bankAccounts={bankAccounts}
            showToast={showToast as any}
          />)}
        </div>
        <div className={activeTab === 'cariler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('cariler', <CarilerView 
            cariler={cariler}
            showToast={showToast as any} 
            islemler={islemler} 
            stoklar={stoklar}
            bankAccounts={bankAccounts}
            onQuickTransaction={(type, cariId) => {
              setPendingIslemModal(type);
              setPendingCariId(cariId);
              setActiveTab('islemler');
            }}
                                    pendingAddCari={pendingAddCari}
            onCariAdded={() => setPendingAddCari(false)}
            selectedCariIdForDetails={selectedCariIdForDetails}
            onSelectCariForDetails={setSelectedCariIdForDetails}
          />)}
        </div>
        <div className={activeTab === 'stoklar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('stoklar', <StoklarView 
            stoklar={stoklar} 
            islemler={islemler}
            cariler={cariler}
                                    userRole={userRole}
            actionPermissions={actionPermissions}
            escalationPin={escalationPin}
            isSecurityActive={isSecurityActive}
            pendingAddStock={pendingAddStock}
            onStockAdded={() => setPendingAddStock(false)}
          />)}
        </div>
        <div className={activeTab === 'islemler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('islemler', <IslemlerView 
            islemler={islemler} 
            cariler={cariler} 
            stoklar={stoklar} 
            bankAccounts={bankAccounts}
            pendingIslemModal={pendingIslemModal}
            pendingCariId={pendingCariId}
            onClearPendingIslemModal={() => {
              setPendingIslemModal(null);
              setPendingCariId(null);
            }}
                                    userRole={userRole}
            actionPermissions={actionPermissions}
            escalationPin={escalationPin}
            isSecurityActive={isSecurityActive}
            onViewCariDetails={(cariId) => {
              setSelectedCariIdForDetails(cariId);
              setActiveTab('cariler');
            }}
          />)}
        </div>
        <div className={activeTab === 'masraflar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('masraflar', <MasraflarView expenses={expenses} recurringTransactions={recurringTransactions} bankAccounts={bankAccounts} cariler={cariler}   />)}
        </div>
        <div className={activeTab === 'calisanlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('calisanlar', <CalisanlarView employees={employees} transactions={employeeTransactions}   />)}
        </div>
        <div className={activeTab === 'kasa' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('kasa', <KasaView islemler={islemler} expenses={expenses} employeeTransactions={employeeTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} />)}
        </div>
        <div className={activeTab === 'raporlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('raporlar', <RaporlarView 
            cariler={cariler} 
            stoklar={stoklar} 
            islemler={islemler} 
            expenses={expenses} 
            employeeTransactions={employeeTransactions} 
          />)}
        </div>
        <div className={activeTab === 'ayarlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('ayarlar', renderSettingsView())}
        </div>
      </main>

            <MobileBottomNav
        handleNavigate={handleNavigate}
        activeTab={activeTab}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
      />
      <AppModals
        resetModalOpen={resetModalOpen}
        setResetModalOpen={setResetModalOpen}
        resetExcludeStocks={resetExcludeStocks}
        setResetExcludeStocks={setResetExcludeStocks}
        resetConfirmationText={resetConfirmationText}
        setResetConfirmationText={setResetConfirmationText}
        resetError={resetError}
        setResetError={setResetError}
        isResetting={isResetting}
        handleResetAllData={handleResetAllData}
        updateStatus={updateStatus}
        updatePercent={updatePercent}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        showChangelog={showChangelog}
        handleCloseChangelog={handleCloseChangelog}
        isAdminPinModalOpen={isAdminPinModalOpen}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        adminPinInput={adminPinInput}
        setAdminPinInput={setAdminPinInput}
        adminPinError={adminPinError}
        setAdminPinError={setAdminPinError}
        escalationPin={escalationPin}
        setUserRole={setUserRole}
        showToast={showToast as any}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        showUpdateModal={showUpdateModal}
        setShowUpdateModal={setShowUpdateModal}
        availableUpdateVersion={availableUpdateVersion}
        setUpdateStatus={setUpdateStatus}
        CHANGELOG={CHANGELOG}
        showFeedbackModal={showFeedbackModal}
        setShowFeedbackModal={setShowFeedbackModal}
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackImage={feedbackImage}
        setFeedbackImage={setFeedbackImage}
        feedbackImageLoading={feedbackImageLoading}
        setFeedbackImageLoading={setFeedbackImageLoading}
        compressImage={compressImage}
        user={user}
        zoomImage={zoomImage}
        setZoomImage={setZoomImage}
                        setActiveTab={setActiveTab}
        setFeedbackList={setFeedbackList}
        financialData={{ cariler, stoklar, islemler, expenses, bankAccounts }}
        userRole={userRole}
        isSecurityActive={isSecurityActive}
        sensitiveTabs={sensitiveTabs}
        actionPermissions={actionPermissions}
        handleNavigate={handleNavigate}
      />
      <BackupWizardModal
        isOpen={isBackupWizardOpen}
        onClose={() => setIsBackupWizardOpen(false)}
        cariler={cariler}
        stoklar={stoklar}
        islemler={islemler}
        expenses={expenses}
        employees={employees}
        employeeTransactions={employeeTransactions}
        bankAccounts={bankAccounts}
        accountTransactions={accountTransactions}
        recurringTransactions={recurringTransactions}
        onImportData={importAllDatabaseData}
        showToast={showToast}
      />
    </div>
  );
}
