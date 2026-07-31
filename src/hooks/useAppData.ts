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
  saveBankAccount,
  User as FirebaseUser
} from '../firebase';
import { Cari, Stock, Transaction, Expense, Employee, EmployeeTransaction, BankAccount, AccountTransaction, RecurringTransaction } from '../types';

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
        recurringLoaded
      ) {
        setLoading(false);
      }
    };

    const unsubscribeCari = subscribeCariler((data) => {
      setCariler(data);
      carilerLoaded = true;
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
    loading, setLoading
  };
}
