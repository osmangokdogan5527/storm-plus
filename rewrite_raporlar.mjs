import fs from 'fs';

let content = fs.readFileSync('src/components/raporlar/useRaporlarStats.ts', 'utf8');

// Remove kdvStats
content = content.replace(/const kdvStats = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredIslemler, selectedCurrency\]\);\s*\n/g, "");
content = content.replace(/, kdvStats/g, "");

// Rewrite summaryStats
const summaryStatsRegex = /const summaryStats = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredIslemler, stoklar, filteredExpenses, filteredEmployeeTransactions, selectedCurrency\]\);/g;

const newSummaryStats = `const summaryStats = useMemo(() => {
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
    }, [filteredIslemler, safeStoklar, filteredExpenses, filteredEmployeeTransactions, selectedCurrency]);`;

content = content.replace(summaryStatsRegex, newSummaryStats);

// Update trend map to handle sale_return
content = content.replace(/if \(islem\.type === 'sale'\) \{\n\s*dateTrendMap\[islem\.date\]\.sales \+\= amt;\n\s*\} else if \(islem\.type === 'collection'\) \{\n\s*dateTrendMap\[islem\.date\]\.collections \+\= amt;\n\s*\}/, 
`if (islem.type === 'sale') {
            dateTrendMap[islem.date].sales += amt;
          } else if (islem.type === 'sale_return') {
            dateTrendMap[islem.date].sales -= amt;
          } else if (islem.type === 'collection') {
            dateTrendMap[islem.date].collections += amt;
          }`);

fs.writeFileSync('src/components/raporlar/useRaporlarStats.ts', content);

