import { getBusinessDateStr } from '../../utils/DateUtils';
import { useMemo } from 'react';
import { Transaction as Islem, Expense, EmployeeTransaction, Cari, Stock } from '../../types';

export const useRaporlarStats = (deps: any) => {
  const {
    islemler = [],
    expenses = [],
    employeeTransactions = [],
    cariler = [],
    stoklar = [],
    resolvedDates = { start: '1970-01-01', end: '2099-12-31' },
    selectedCariId,
    selectedCurrency = 'TRY',
    stockValuationType = 'purchase',
    stockSearch = '',
    cariSearch = '',
    cariTypeFilter = 'all'
  } = deps || {};

  const safeIslemler = Array.isArray(islemler) ? islemler : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeEmployeeTransactions = Array.isArray(employeeTransactions) ? employeeTransactions : [];
  const safeCariler = Array.isArray(cariler) ? cariler : [];
  const safeStoklar = Array.isArray(stoklar) ? stoklar : [];

  const convertAmount = (amount: number, fromCurrency: string = 'TRY', recordRate?: number) => {
      if (fromCurrency === selectedCurrency) return amount;
      
      // Fallback static conversion rates if exchangeRate is missing
      const rates: Record<string, number> = {
        TRY: 1,
        USD: 33.5,
        EUR: 36.0
      };
  
      const targetRate = rates[selectedCurrency] || 1;
      const sourceRate = recordRate || rates[fromCurrency] || 1;
  
      // Convert to TRY first, then to target currency
      const amountInTry = amount * sourceRate;
      return amountInTry / targetRate;
    };
  
    // Format currency output with selected locale format
    const formatMoney = (val: number, currency: string = selectedCurrency) => {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(val);
    };
  
    // 1. FILTERED DATASETS
    const filteredIslemler = useMemo(() => {
      const start = resolvedDates?.start || '1970-01-01';
      const end = resolvedDates?.end || '2099-12-31';
      return safeIslemler.filter(item => {
        const isWithinDate = item.date >= start && item.date <= end;
        return isWithinDate;
      });
    }, [safeIslemler, resolvedDates]);
  
    const filteredExpenses = useMemo(() => {
      const start = resolvedDates?.start || '1970-01-01';
      const end = resolvedDates?.end || '2099-12-31';
      return safeExpenses.filter(item => {
        const isWithinDate = item.date >= start && item.date <= end;
        return isWithinDate;
      });
    }, [safeExpenses, resolvedDates]);
  
    const filteredEmployeeTransactions = useMemo(() => {
      const start = resolvedDates?.start || '1970-01-01';
      const end = resolvedDates?.end || '2099-12-31';
      return safeEmployeeTransactions.filter(item => {
        const isWithinDate = item.date >= start && item.date <= end;
        return isWithinDate;
      });
    }, [safeEmployeeTransactions, resolvedDates]);
  
    // Selected Cari info
    const selectedCari = useMemo(() => {
      return safeCariler.find(c => c.id === selectedCariId);
    }, [safeCariler, selectedCariId]);
  
    // KDV Calculations
        // Cari Ekstre Calculations
    const cariEkstreStats = useMemo(() => {
      if (!selectedCariId || !selectedCari) {
        return { priorBalance: 0, periodTransactions: [], finalBalance: 0, allTransactions: [] };
      }
  
      // 1. Get all transactions of this Cari
      const allCariTransactions = islemler
        .filter(t => t.cariId === selectedCariId)
        .sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          if (dateComp !== 0) return dateComp;
          return a.createdAt.localeCompare(b.createdAt);
        });
  
      // 2. Calculate sum of all transaction effects
      let sumOfAllTxEffects = 0;
      allCariTransactions.forEach(t => {
        const effectAmount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? t.convertedAmount : (t.amount || 0);
        if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') {
          sumOfAllTxEffects += effectAmount;
        } else if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') {
          sumOfAllTxEffects -= effectAmount;
        }
      });
  
      // Starting balance of the Cari card before any transactions
      const initialCardBalance = (selectedCari.balance || 0) - sumOfAllTxEffects;
  
      // 3. Compute running balance for all transactions chronologically
      let currentRunning = initialCardBalance;
      const computedTxList = allCariTransactions.map(t => {
        const effectAmount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? t.convertedAmount : (t.amount || 0);
        let borc = 0; // Debit
        let alacak = 0; // Credit
        
        if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') {
          borc = effectAmount;
          currentRunning += effectAmount;
        } else if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') {
          alacak = effectAmount;
          currentRunning -= effectAmount;
        }
  
        return {
          ...t,
          borc,
          alacak,
          runningBalance: currentRunning
        };
      });
  
      // 4. Split into prior (Devreden) and period transactions based on resolvedDates
      let priorBalance = initialCardBalance;
      const periodTransactions: any[] = [];
  
      computedTxList.forEach(t => {
        if (t.date < resolvedDates.start) {
          priorBalance = t.runningBalance;
        } else if (t.date >= resolvedDates.start && t.date <= resolvedDates.end) {
          periodTransactions.push(t);
        }
      });
  
      const finalBalance = periodTransactions.length > 0 
        ? periodTransactions[periodTransactions.length - 1].runningBalance 
        : priorBalance;
  
      return {
        priorBalance,
        periodTransactions,
        finalBalance,
        allTransactions: computedTxList
      };
    }, [selectedCariId, selectedCari, islemler, resolvedDates]);
  
    // 2. COMPUTATIONS - SUMMARY & P&L
    const summaryStats = useMemo(() => {
      let sales = 0;
      let costOfSales = 0;
      let purchases = 0;
      let collections = 0;
      let payments = 0;
      let totalExpenses = 0;
      let employeeSalaries = 0;

      const stockMap = new Map<string, Stock>();
      safeStoklar.forEach(s => stockMap.set(s.id, s));

      filteredIslemler.forEach(islem => {
        const amt = convertAmount(islem.amount, islem.currency, islem.exchangeRate);
        
        if (islem.type === 'sale') {
          sales += amt;
          if (islem.items && islem.items.length > 0) {
            islem.items.forEach(item => {
              const st = stockMap.get(item.stockId);
              if (st) {
                 costOfSales += convertAmount(st.purchasePrice * (item.quantity || 1), 'TRY', 1);
              } else {
                 costOfSales += convertAmount(item.price * 0.7 * (item.quantity || 1), islem.currency, islem.exchangeRate);
              }
            });
          } else {
            costOfSales += amt * 0.7; 
          }
        } else if (islem.type === 'sale_return') {
          sales -= amt;
          if (islem.items && islem.items.length > 0) {
            islem.items.forEach(item => {
              const st = stockMap.get(item.stockId);
              if (st) {
                 costOfSales -= convertAmount(st.purchasePrice * (item.quantity || 1), 'TRY', 1);
              } else {
                 costOfSales -= convertAmount(item.price * 0.7 * (item.quantity || 1), islem.currency, islem.exchangeRate);
              }
            });
          } else {
            costOfSales -= amt * 0.7; 
          }
        } else if (islem.type === 'purchase') {
          purchases += amt;
        } else if (islem.type === 'purchase_return') {
          purchases -= amt;
        } else if (islem.type === 'collection') {
          collections += amt;
        } else if (islem.type === 'payment') {
          payments += amt;
        }
      });

      filteredExpenses.forEach(exp => {
        totalExpenses += convertAmount(exp.amount, exp.currency);
      });

      filteredEmployeeTransactions.forEach(et => {
        if (et.type === 'accrual') {
          employeeSalaries += convertAmount(et.amount, et.currency);
        }
      });

      const grossProfit = sales - costOfSales;
      const netProfit = grossProfit - totalExpenses - employeeSalaries;

      return {
        sales,
        costOfSales,
        grossProfit,
        purchases,
        collections,
        payments,
        totalExpenses,
        employeeSalaries,
        netProfit
      };
    }, [filteredIslemler, safeStoklar, filteredExpenses, filteredEmployeeTransactions, selectedCurrency]);
  
    // 3. COMPUTATIONS - STOK ANALYSIS
    const stockStats = useMemo(() => {
      let totalItems = safeStoklar.length;
      let totalStockCount = 0;
      let totalValuation = 0;
      let criticalStockCount = 0;
      const itemsList: any[] = [];
  
      safeStoklar.forEach(s => {
        totalStockCount += s.quantity;
        const unitVal = stockValuationType === 'purchase' ? s.purchasePrice : s.salesPrice;
        const value = s.quantity * unitVal;
        totalValuation += value;
        
        if (s.quantity <= s.minQuantity) {
          criticalStockCount++;
        }
  
        itemsList.push({
          ...s,
          valuation: value
        });
      });
  
      // Sort by valuation descending
      itemsList.sort((a, b) => b.valuation - a.valuation);
  
      return {
        totalItems,
        totalStockCount,
        totalValuation,
        criticalStockCount,
        itemsList: itemsList.filter(s => 
          (s.name || '').toLowerCase().includes((stockSearch || '').toLowerCase()) || 
          (s.code || '').toLowerCase().includes((stockSearch || '').toLowerCase())
        )
      };
    }, [safeStoklar, stockValuationType, stockSearch]);
  
    // 4. COMPUTATIONS - CARI ANALYSIS
    const cariStats = useMemo(() => {
      let totalCari = safeCariler.length;
      let totalReceivables = 0; // Alacaklar (Positive balances)
      let totalPayables = 0; // Borclar (Negative balances)
      const itemsList: any[] = [];
  
      safeCariler.forEach(c => {
        const balance = convertAmount(c.balance || 0, c.currency || 'TRY');
        if (balance > 0) {
          totalReceivables += balance;
        } else if (balance < 0) {
          totalPayables += Math.abs(balance);
        }
  
        itemsList.push({
          ...c,
          convertedBalance: balance
        });
      });
  
      // Filter list
      const filteredList = itemsList.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(cariSearch.toLowerCase()) || 
                              c.code.toLowerCase().includes(cariSearch.toLowerCase());
        const matchesType = cariTypeFilter === 'all' || 
                            c.type === cariTypeFilter || 
                            (cariTypeFilter === 'customer' && c.type === 'both') || 
                            (cariTypeFilter === 'supplier' && c.type === 'both');
        return matchesSearch && matchesType;
      });
  
      return {
        totalCari,
        totalReceivables,
        totalPayables,
        itemsList: filteredList.sort((a, b) => Math.abs(b.convertedBalance) - Math.abs(a.convertedBalance))
      };
    }, [safeCariler, cariSearch, cariTypeFilter, selectedCurrency]);
  
    // 5. COMPUTATIONS - INCOME-EXPENSE & GRAPH DATA
    const incomeExpenseStats = useMemo(() => {
      const expensesByCategory: Record<string, number> = {};
      let totalExp = 0;
  
      filteredExpenses.forEach(exp => {
        const amt = convertAmount(exp.amount, exp.currency);
        const cat = exp.category || 'Diğer';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
        totalExp += amt;
      });
  
      // Convert to Recharts friendly format
      const categoryData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: Number(expensesByCategory[key].toFixed(2))
      })).sort((a, b) => b.value - a.value);
  
      // Group sales and expenses by date for trend lines
      const dateTrendMap: Record<string, { date: string; sales: number; expenses: number; collections: number }> = {};
      
      // Fill with empty days in the date range so we don't have gaps
      const startObj = new Date(resolvedDates.start);
      const endObj = new Date(resolvedDates.end);
      for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // Format to DD.MM for chart X-Axis
        const axisLabel = dateStr.split('-').reverse().slice(0, 2).join('/');
        dateTrendMap[dateStr] = { date: axisLabel, sales: 0, expenses: 0, collections: 0 };
      }
  
      filteredIslemler.forEach(islem => {
        if (dateTrendMap[islem.date]) {
          const amt = convertAmount(islem.amount, islem.currency, islem.exchangeRate);
          if (islem.type === 'sale') {
            dateTrendMap[islem.date].sales += amt;
          } else if (islem.type === 'sale_return') {
            dateTrendMap[islem.date].sales -= amt;
          } else if (islem.type === 'collection') {
            dateTrendMap[islem.date].collections += amt;
          }
        }
      });
  
      filteredExpenses.forEach(exp => {
        if (dateTrendMap[exp.date]) {
          dateTrendMap[exp.date].expenses += convertAmount(exp.amount, exp.currency);
        }
      });
  
      const trendData = Object.keys(dateTrendMap)
        .sort()
        .map(key => dateTrendMap[key]);
  
      return {
        categoryData,
        trendData,
        totalExp
      };
    }, [filteredExpenses, filteredIslemler, resolvedDates, selectedCurrency]);
  
  return { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats };
}
