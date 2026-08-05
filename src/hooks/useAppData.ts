import { useState, useEffect } from 'react';
import {
  subscribeCariler,
  subscribeStoklar,
  subscribeIslemler,
  subscribeExpenses,
  subscribeEmployees,
  subscribeEmployeeTransactions,
  subscribeBankAccounts,
  subscribeAccountTransactions,
  subscribeRecurringTransactions,
  subscribeOnlineOrders,
  subscribeOnlinePayouts,
  subscribePosPlatforms,
  subscribeSettings,
  saveBankAccount,
  User as FirebaseUser
} from '../firebase';
import { Cari, Stock, Transaction, Expense, Employee, EmployeeTransaction, BankAccount, AccountTransaction, RecurringTransaction } from '../types';
import { OnlineMarketOrder, OnlineMarketPayout } from '../types/onlineMarket';
import { PosPlatformConfig } from '../types/pos';

export function useAppData(user: FirebaseUser | null) {
  // App data state
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [stoklar, setStoklar] = useState<Stock[]>([]);
  const [islemler, setIslemler] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<OnlineMarketOrder[]>([]);
  const [onlinePayouts, setOnlinePayouts] = useState<OnlineMarketPayout[]>([]);
  const [posPlatforms, setPosPlatforms] = useState<PosPlatformConfig[]>([]);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [printSettings, setPrintSettings] = useState<any>(null);
  const [shortcutSettings, setShortcutSettings] = useState<any>(null);
  const [backupSettings, setBackupSettings] = useState<any>(null);
  
  // Loading & connection state
  const [loading, setLoading] = useState(true);

  // Real-time synchronization when user is signed in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let carilerLoaded = false;
    let stoklarLoaded = false;
    let islemlerLoaded = false;
    let expensesLoaded = false;
    let employeesLoaded = false;
    let employeeTransactionsLoaded = false;
    let bankAccountsLoaded = false;
    let accountTransactionsLoaded = false;
    let recurringLoaded = false;
    let onlineOrdersLoaded = false;
    let onlinePayoutsLoaded = false;
    let posPlatformsLoaded = false;
    let appSettingsLoaded = false;
    let securitySettingsLoaded = false;
    let printSettingsLoaded = false;
    let shortcutSettingsLoaded = false;
    let backupSettingsLoaded = false;

    const checkLoadingFinished = () => {
      if (
        carilerLoaded && 
        stoklarLoaded && 
        islemlerLoaded && 
        expensesLoaded &&
        employeesLoaded &&
        employeeTransactionsLoaded &&
        bankAccountsLoaded &&
        accountTransactionsLoaded &&
        recurringLoaded &&
        onlineOrdersLoaded &&
        onlinePayoutsLoaded &&
        posPlatformsLoaded &&
        appSettingsLoaded &&
        securitySettingsLoaded &&
        printSettingsLoaded &&
        shortcutSettingsLoaded &&
        backupSettingsLoaded
      ) {
        setLoading(false);
      }
    };

    const unsubscribeCari = subscribeCariler((data) => {
      setCariler(data);
      carilerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeAppSettings = subscribeSettings('appSettings', (data) => {
      setAppSettings(data);
      appSettingsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeSecuritySettings = subscribeSettings('securitySettings', (data) => {
      setSecuritySettings(data);
      securitySettingsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribePrintSettings = subscribeSettings('printSettings', (data) => {
      setPrintSettings(data);
      printSettingsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeShortcutSettings = subscribeSettings('shortcutSettings', (data) => {
      setShortcutSettings(data);
      shortcutSettingsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeBackupSettings = subscribeSettings('backupSettings', (data) => {
      setBackupSettings(data);
      backupSettingsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeStok = subscribeStoklar((data) => {
      setStoklar(data);
      stoklarLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeIslem = subscribeIslemler((data) => {
      setIslemler(data);
      islemlerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeExpenses = subscribeExpenses((data) => {
      setExpenses(data);
      expensesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployees = subscribeEmployees((data) => {
      setEmployees(data);
      employeesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployeeTxs = subscribeEmployeeTransactions((data) => {
      setEmployeeTransactions(data);
      employeeTransactionsLoaded = true;
      checkLoadingFinished();
    });

    let isSeeding = false;
    const unsubscribeBankAccounts = subscribeBankAccounts(async (data) => {
      const missingDefaults = [];
      const hasKasa = data.some(acc => acc.id === 'merkez_kasa');
      const hasBanka = data.some(acc => acc.id === 'merkez_banka');
      const hasPos = data.some(acc => acc.id === 'merkez_pos');
      
      if (!hasKasa) missingDefaults.push({ id: 'merkez_kasa', name: 'MERKEZ KASA', type: 'kasa', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });
      if (!hasBanka) missingDefaults.push({ id: 'merkez_banka', name: 'MERKEZ BANKA', type: 'banka', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });
      if (!hasPos) missingDefaults.push({ id: 'merkez_pos', name: 'MERKEZ POS', type: 'pos', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });

      if (missingDefaults.length > 0 && !isSeeding) {
        isSeeding = true;
        try {
          for (const acc of missingDefaults) {
            await saveBankAccount(acc, acc.id);
          }
        } catch (e) {
          // ignore
        } finally {
          isSeeding = false;
        }
      }
      setBankAccounts(data);
      bankAccountsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeAccountTxs = subscribeAccountTransactions((data) => {
      setAccountTransactions(data);
      accountTransactionsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeRecurring = subscribeRecurringTransactions((data) => {
      setRecurringTransactions(data);
      recurringLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeOnlineOrders = subscribeOnlineOrders((data) => {
      setOnlineOrders(data);
      onlineOrdersLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeOnlinePayouts = subscribeOnlinePayouts((data) => {
      setOnlinePayouts(data);
      onlinePayoutsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribePosPlatforms = subscribePosPlatforms((data) => {
      setPosPlatforms(data);
      posPlatformsLoaded = true;
      checkLoadingFinished();
    });

    return () => {
      unsubscribeCari();
      unsubscribeStok();
      unsubscribeIslem();
      unsubscribeExpenses();
      unsubscribeEmployees();
      unsubscribeEmployeeTxs();
      unsubscribeBankAccounts();
      unsubscribeAccountTxs();
      unsubscribeRecurring();
      unsubscribeOnlineOrders();
      unsubscribeOnlinePayouts();
      unsubscribePosPlatforms();
      unsubscribeAppSettings();
      unsubscribeSecuritySettings();
      unsubscribePrintSettings();
      unsubscribeShortcutSettings();
      unsubscribeBackupSettings();
    };
  }, [user]);

  return {
    cariler, setCariler,
    stoklar, setStoklar,
    islemler, setIslemler,
    expenses, setExpenses,
    employees, setEmployees,
    employeeTransactions, setEmployeeTransactions,
    bankAccounts, setBankAccounts,
    accountTransactions, setAccountTransactions,
    recurringTransactions, setRecurringTransactions,
    onlineOrders, setOnlineOrders,
    onlinePayouts, setOnlinePayouts,
    posPlatforms, setPosPlatforms,
    appSettings, setAppSettings,
    securitySettings, setSecuritySettings,
    printSettings, setPrintSettings,
    shortcutSettings, setShortcutSettings,
    backupSettings, setBackupSettings,
    loading, setLoading
  };
}
