import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export const getExportFunctions = (deps: any) => {
  const { activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler, incomeExpenseStats, stoklar, islemler, expenses } = deps;

    const downloadExcel = () => {
      const workbook = XLSX.utils.book_new();
  
      if (activeTab === 'ozet') {
        // 1. P&L Sheet
        const plData = [
          { 'Finansal Rapor Başlığı': 'Satış Gelirleri', 'Tutar': summaryStats.sales, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Satılan Malın Maliyeti (SMM)', 'Tutar': summaryStats.costOfSales, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Brüt Kar', 'Tutar': summaryStats.grossProfit, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Faaliyet Giderleri (Masraflar)', 'Tutar': summaryStats.totalExpenses, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Personel Maaş Hak Edişleri', 'Tutar': summaryStats.employeeSalaries, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Net Kar / Zarar', 'Tutar': summaryStats.netProfit, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Yapılan Alışlar', 'Tutar': summaryStats.purchases, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Yapılan Tahsilatlar', 'Tutar': summaryStats.collections, 'Döviz': 'TRY' },
          { 'Finansal Rapor Başlığı': 'Yapılan Ödemeler', 'Tutar': summaryStats.payments, 'Döviz': 'TRY' }
        ];
        const ws = XLSX.utils.json_to_sheet(plData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Kar-Zarar Tablosu');
      } 
      else if (activeTab === 'stok') {
        // 2. Stock Sheet
        const stockData = stockStats.itemsList.map(item => ({
          'Stok Kodu': item.code,
          'Stok Adı': item.name,
          'Miktar': item.quantity,
          'Birim': item.unit,
          'Alış Fiyatı': item.purchasePrice,
          'Satış Fiyatı': item.salesPrice,
          'Stok Değeri': item.valuation,
          'Kritik Seviye': item.minQuantity
        }));
        const ws = XLSX.utils.json_to_sheet(stockData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Stok Durum Raporu');
      } 
      else if (activeTab === 'cari') {
        // 3. Cari Sheet
        const cariData = cariStats.itemsList.map(item => ({
          'Cari Kodu': item.code,
          'Cari Adı': item.name,
          'Cari Tipi': item.type === 'customer' ? 'Müşteri' : item.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi',
          'Telefon': item.phone || '-',
          'E-posta': item.email || '-',
          'Bakiye (Orijinal)': item.balance,
          'Orijinal Döviz': item.currency || 'TRY',
          'Bakiye Rapor Para Birimi': item.convertedBalance
        }));
        const ws = XLSX.utils.json_to_sheet(cariData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Cari Bakiye Analizi');
      } 
      else if (activeTab === 'gelirgider') {
        // 4. Expense Sheet
        const expenseData = filteredExpenses.map(item => ({
          'Tarih': item.date,
          'Başlık': item.title,
          'Kategori': item.category,
          'Ödeme Hesabı': item.account === 'cash' ? 'Kasa' : item.account === 'pos' ? 'POS' : 'Banka',
          'Tutar': item.amount,
          'Döviz': item.currency,
          'Açıklama': item.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Gider-Masraf Listesi');
      }
      else if (activeTab === 'karzarar') {
        const kdvData = [
        ];
        const ws = XLSX.utils.json_to_sheet(kdvData);
        XLSX.utils.book_append_sheet(workbook, ws, 'KDV Ozeti');
      }
      else if (activeTab === 'cariekstre') {
        if (!selectedCari) {
          alert('Lütfen önce bir cari hesap seçiniz.');
          return;
        }
        const ekstreData = [
          { 'Tarih': resolvedDates.start, 'İşlem Türü': 'DEVİR', 'Borç (+)': 0, 'Alacak (-)': 0, 'Bakiye': cariEkstreStats.priorBalance },
          ...cariEkstreStats.periodTransactions.map(t => ({
            'Tarih': t.date,
            'İşlem Türü': t.type === 'sale' ? 'Satış' : t.type === 'purchase' ? 'Alış' : t.type === 'collection' ? 'Tahsilat' : t.type === 'payment' ? 'Ödeme' : t.type === 'sale_return' ? 'Satış İade' : 'Alış İade',
            'Fatura / İşlem No': t.invoiceNo || '-',
            'Borç (+)': t.borc,
            'Alacak (-)': t.alacak,
            'Bakiye': t.runningBalance
          }))
        ];
        const ws = XLSX.utils.json_to_sheet(ekstreData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Cari Hesap Ekstresi');
      }
  
      // Save File
      XLSX.writeFile(workbook, `Storm_Muhasebe_Raporu_${activeTab}_${resolvedDates.start}_to_${resolvedDates.end}.xlsx`);
    };
  
    // PDF DOWNLOAD IMPLEMENTATION (CLEAN & PURE CLIENT-SIDE WITHOUT LIBS ERRORS)
    const downloadPDF = () => {
      if (activeTab === 'karzarar') {
        downloadKarZararPdf();
        return;
      }
      if (activeTab === 'cariekstre') {
        downloadCariEkstrePDF();
        return;
      }
  
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      // Color Theme configuration for PDF drawing
      const primaryColor = [225, 29, 72]; // Rose-600 #e11d48
      const darkGray = [30, 41, 59]; // Slate-800
      const lightGray = [241, 245, 249]; // Slate-100
  
      // Header drawing helper
      const drawHeader = (title: string) => {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(turkishToPdf('STORM ON MUHASEBE - FINANSAL BI RAPORU'), 15, 15.5);
  
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(14);
        doc.text(turkishToPdf(title.toUpperCase()), 10, 26);
  
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(turkishToPdf(`Rapor Araligi: ${resolvedDates.start} / ${resolvedDates.end}`), 10, 31);
        doc.text(turkishToPdf(`Rapor Doviz Cinsi: ${selectedCurrency}`), 10, 35);
        doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 150, 31);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(10, 38, 200, 38);
      };
  
      // Draw Footer helper
      const drawFooter = (page: number) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(10, 280, 200, 280);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(turkishToPdf('Bu rapor Storm On Muhasebe programi tarafindan otomatik olarak uretilmistir.'), 10, 284);
        doc.text(turkishToPdf(`Sayfa ${page}`), 190, 284);
      };
  
      if (activeTab === 'ozet') {
        drawHeader('KAR-ZARAR VE GENEL FINANSAL OZET RAPORU');
        
        // Let's draw table manually for total P&L
        const rows = [
          ['Satış Gelirleri', formatMoney(summaryStats.sales)],
          ['Satılan Malın Maliyeti (SMM)', formatMoney(summaryStats.costOfSales)],
          ['Brüt Kar', formatMoney(summaryStats.grossProfit)],
          ['Faaliyet Giderleri (Masraflar)', formatMoney(summaryStats.totalExpenses)],
          ['Personel Maaşları Gideri', formatMoney(summaryStats.employeeSalaries)],
          ['Net Dönem Karı / Zararı', formatMoney(summaryStats.netProfit)],
          ['Diğer Finansal Hareket Özetleri', ''],
          ['Gerçekleşen Alışlar', formatMoney(summaryStats.purchases)],
          ['Gerçekleşen Cari Tahsilatlar', formatMoney(summaryStats.collections)],
          ['Gerçekleşen Cari Ödemeler', formatMoney(summaryStats.payments)]
        ];
  
        let y = 46;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        
        // Table Header
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(10, y, 190, 8, 'F');
        doc.text(turkishToPdf('Kalem / Finansal Hareket Tipi'), 15, y + 5.5);
        doc.text(turkishToPdf('Tutar (' + selectedCurrency + ')'), 150, y + 5.5);
        
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
  
        rows.forEach((row, idx) => {
          // Zebra striping
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, 190, 7.5, 'F');
          }
  
          const isSubHeader = row[1] === '';
          const isHighlight = row[0] === 'Net Dönem Karı / Zararı';
  
          if (isSubHeader) {
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(241, 245, 249);
            doc.rect(10, y, 190, 7.5, 'F');
            doc.text(turkishToPdf(row[0]), 15, y + 5);
          } else {
            if (isHighlight) {
              doc.setFont('helvetica', 'bold');
              if (summaryStats.netProfit >= 0) {
                doc.setTextColor(16, 185, 129); // Green
              } else {
                doc.setTextColor(225, 29, 72); // Rose/Red
              }
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            }
            doc.text(turkishToPdf(row[0]), 15, y + 5);
            doc.text(turkishToPdf(row[1]), 150, y + 5);
          }
  
          y += 7.5;
        });
  
        drawFooter(1);
      } 
      else if (activeTab === 'stok') {
        drawHeader('STOK DURUM VE ENVANTER RAPORU');
  
        let y = 46;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        // Table Header
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(10, y, 190, 8, 'F');
        doc.text(turkishToPdf('Kod'), 12, y + 5.5);
        doc.text(turkishToPdf('Stok Adi'), 35, y + 5.5);
        doc.text(turkishToPdf('Miktar'), 95, y + 5.5);
        doc.text(turkishToPdf('Alis F.'), 120, y + 5.5);
        doc.text(turkishToPdf('Satis F.'), 145, y + 5.5);
        doc.text(turkishToPdf('Stok Degeri'), 170, y + 5.5);
  
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
  
        let totalVal = 0;
        let totalQty = 0;
  
        stockStats.itemsList.slice(0, 25).forEach((item, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, 190, 7, 'F');
          }
  
          doc.text(turkishToPdf(item.code || ''), 12, y + 4.5);
          doc.text(turkishToPdf(item.name.substring(0, 30)), 35, y + 4.5);
          doc.text(turkishToPdf(`${item.quantity} ${item.unit}`), 95, y + 4.5);
          doc.text(turkishToPdf(formatMoney(item.purchasePrice)), 120, y + 4.5);
          doc.text(turkishToPdf(formatMoney(item.salesPrice)), 145, y + 4.5);
          doc.text(turkishToPdf(formatMoney(item.valuation)), 170, y + 4.5);
  
          totalVal += item.valuation;
          totalQty += item.quantity;
          y += 7;
        });
  
        // Totals
        doc.line(10, y + 1, 200, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(turkishToPdf('Toplam Envanter Miktari ve Degeri:'), 35, y + 6);
        doc.text(turkishToPdf(`${totalQty} adet`), 95, y + 6);
        doc.text(turkishToPdf(formatMoney(totalVal)), 170, y + 6);
  
        drawFooter(1);
      } 
      else if (activeTab === 'cari') {
        drawHeader('CARI HESAP HAREKET VE BAKIYE ANALIZI');
  
        let y = 46;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        // Table Header
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(10, y, 190, 8, 'F');
        doc.text(turkishToPdf('Cari Kod'), 12, y + 5.5);
        doc.text(turkishToPdf('Cari Unvan / Ad'), 40, y + 5.5);
        doc.text(turkishToPdf('Telefon'), 115, y + 5.5);
        doc.text(turkishToPdf('Bakiye'), 155, y + 5.5);
        doc.text(turkishToPdf('Doviz'), 185, y + 5.5);
  
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
  
        cariStats.itemsList.slice(0, 25).forEach((item, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, 190, 7, 'F');
          }
  
          doc.text(turkishToPdf(item.code || ''), 12, y + 4.5);
          doc.text(turkishToPdf(item.name.substring(0, 32)), 40, y + 4.5);
          doc.text(turkishToPdf(item.phone || '-'), 115, y + 4.5);
          
          const bal = item.convertedBalance;
          if (bal > 0) {
            doc.setTextColor(16, 185, 129); // Receives (customer owes)
          } else if (bal < 0) {
            doc.setTextColor(225, 29, 72); // Payables
          } else {
            doc.setTextColor(100, 116, 139);
          }
          
          doc.text(turkishToPdf(formatMoney(bal)), 155, y + 4.5);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text(turkishToPdf(item.currency || 'TRY'), 185, y + 4.5);
  
          y += 7;
        });
  
        // Summary lines
        doc.line(10, y + 1, 200, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(turkishToPdf('Toplam Cari Alacaklarimiz:'), 40, y + 6);
        doc.setTextColor(16, 185, 129);
        doc.text(turkishToPdf(formatMoney(cariStats.totalReceivables)), 155, y + 6);
  
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(turkishToPdf('Toplam Borclarimiz:'), 40, y + 11);
        doc.setTextColor(225, 29, 72);
        doc.text(turkishToPdf(formatMoney(cariStats.totalPayables)), 155, y + 11);
  
        drawFooter(1);
      } 
      else if (activeTab === 'gelirgider') {
        drawHeader('GIDER VE MASRAF RAPORU');
  
        let y = 46;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        // Table Header
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(10, y, 190, 8, 'F');
        doc.text(turkishToPdf('Tarih'), 12, y + 5.5);
        doc.text(turkishToPdf('Gider / Masraf Basligi'), 35, y + 5.5);
        doc.text(turkishToPdf('Kategori'), 100, y + 5.5);
        doc.text(turkishToPdf('Odeme Tipi'), 145, y + 5.5);
        doc.text(turkishToPdf('Tutar'), 175, y + 5.5);
  
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
  
        filteredExpenses.slice(0, 25).forEach((item, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, 190, 7, 'F');
          }
  
          doc.text(turkishToPdf(item.date), 12, y + 4.5);
          doc.text(turkishToPdf(item.title.substring(0, 30)), 35, y + 4.5);
          doc.text(turkishToPdf(item.category || 'Diger'), 100, y + 4.5);
          doc.text(turkishToPdf(item.account === 'cash' ? 'Kasa' : item.account === 'pos' ? 'POS' : 'Banka'), 145, y + 4.5);
          doc.text(turkishToPdf(formatMoney(item.amount, item.currency)), 175, y + 4.5);
  
          y += 7;
        });
  
        doc.line(10, y + 1, 200, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(turkishToPdf('Toplam Gider ve Masraf Tutari:'), 100, y + 6);
        doc.text(turkishToPdf(formatMoney(incomeExpenseStats.totalExp)), 175, y + 6);
  
        drawFooter(1);
      }
  
      doc.save(`Storm_Muhasebe_Raporu_${activeTab}_${resolvedDates.start}_to_${resolvedDates.end}.pdf`);
    };
  
    const exportAllToExcel = () => {
      const workbook = XLSX.utils.book_new();
  
      // 1. Cariler Sheet
      const carilerData = cariler.map(c => ({
        'Cari Kod': c.code || '',
        'Cari Unvan / Ad': c.name || '',
        'Cari Tipi': c.type === 'customer' ? 'Müşteri' : c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi',
        'Telefon': c.phone || '-',
        'E-posta': c.email || '-',
        'Bakiye': c.balance || 0,
        'Para Birimi': c.currency || 'TRY',
        'Durum': c.isActive !== false ? 'Aktif' : 'Pasif'
      }));
      const wsCariler = XLSX.utils.json_to_sheet(carilerData);
      XLSX.utils.book_append_sheet(workbook, wsCariler, 'Cari Hesaplar');
  
      // 2. Stoklar Sheet
      const stoklarData = stoklar.map(s => ({
        'Stok Kodu': s.code || '',
        'Ürün / Hizmet Adı': s.name || '',
        'Kategori': s.category || '',
        'Marka / Üretici': s.brand || '',
        'Miktar': s.quantity || 0,
        'Birim': s.unit || 'Adet',
        'Alış Fiyatı ': s.purchasePrice || 0,
        'Satış Fiyatı ': s.salesPrice || 0,
        'Kritik Seviye': s.minQuantity || 0
      }));
      const wsStoklar = XLSX.utils.json_to_sheet(stoklarData);
      XLSX.utils.book_append_sheet(workbook, wsStoklar, 'Stok Envanteri');
  
      // 3. Islemler (Faturalar) Sheet
      const islemlerData = islemler.map(i => {
        const itemsDetail = i.items?.map(it => `${it.quantity} ${it.unit} x ${it.price} `).join(' | ') || '';
        return {
          'Fatura / İşlem No': i.invoiceNo || '-',
          'Tarih': i.date || '',
          'Cari Adı': i.cariName || '',
          'İşlem Tipi': i.type === 'sale' ? 'Satış' : i.type === 'purchase' ? 'Alış' : i.type === 'collection' ? 'Tahsilat' : i.type === 'payment' ? 'Ödeme' : i.type === 'sale_return' ? 'Satış İade' : 'Alış İade',
          'Tutar': i.amount || 0,
          'Döviz': i.currency || 'TRY',
          'Hesap': i.account === 'cash' ? 'Kasa' : i.account === 'bank' ? 'Banka' : i.account === 'pos' ? 'POS' : 'Açık Hesap',
          'Açıklama': i.description || '',
          'Ürün Detayları': itemsDetail
        };
      });
      const wsIslemler = XLSX.utils.json_to_sheet(islemlerData);
      XLSX.utils.book_append_sheet(workbook, wsIslemler, 'Faturalar ve İşlemler');
  
      // 4. Masraflar Sheet
      const masraflarData = expenses.map(e => ({
        'Tarih': e.date || '',
        'Açıklama / Başlık': e.title || '',
        'Kategori': e.category || 'Diğer',
        'Tutar': e.amount || 0,
        'Para Birimi': e.currency || 'TRY',
        'Ödeme Hesabı': e.account === 'cash' ? 'Kasa' : e.account === 'pos' ? 'POS' : 'Banka',
        'Detay': e.description || ''
      }));
      const wsMasraflar = XLSX.utils.json_to_sheet(masraflarData);
      XLSX.utils.book_append_sheet(workbook, wsMasraflar, 'Masraflar ve Giderler');
  
      XLSX.writeFile(workbook, `Storm_On_Muhasebe_Yedek_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
  
    const downloadCariEkstrePDF = () => {
      if (!selectedCari) return;
  
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      const primaryColor = [20, 184, 166]; // Teal-500
      const darkGray = [30, 41, 59]; // Slate-800
      const lightGray = [241, 245, 249]; // Slate-100
  
      // Header drawing
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, 10, 190, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(turkishToPdf('STORM ON MUHASEBE - CARI HESAP EKSTRESI'), 15, 15.5);
  
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(14);
      doc.text(turkishToPdf('CARI HESAP EKSTRESI (HESAP DOKUMU)'), 10, 26);
  
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(turkishToPdf(`Cari Unvan: ${selectedCari.name}`), 10, 32);
      doc.text(turkishToPdf(`Cari Kod: ${selectedCari.code || '-'}`), 10, 36);
      doc.text(turkishToPdf(`Telefon: ${selectedCari.phone || '-'}`), 10, 40);
      doc.text(turkishToPdf(`E-posta: ${selectedCari.email || '-'}`), 10, 44);
  
      doc.text(turkishToPdf(`Rapor Donemi: ${resolvedDates.start} / ${resolvedDates.end}`), 120, 32);
      doc.text(turkishToPdf(`Cari Para Birimi: ${selectedCari.currency || 'TRY'}`), 120, 36);
      doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 120, 40);
  
      doc.line(10, 48, 200, 48);
  
      // Summary Boxes
      let y = 54;
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y, 190, 15, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(10, y, 190, 15, 'S');
  
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(turkishToPdf('ONCEKI DEVIR'), 15, y + 5);
      doc.text(turkishToPdf('TOPLAM BORC (+)'), 65, y + 5);
      doc.text(turkishToPdf('TOPLAM ALACAK (-)'), 115, y + 5);
      doc.text(turkishToPdf('GUNCEL BAKIYE'), 165, y + 5);
  
      let periodBorc = 0;
      let periodAlacak = 0;
      cariEkstreStats.periodTransactions.forEach(t => {
        periodBorc += t.borc;
        periodAlacak += t.alacak;
      });
  
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const currSym = selectedCari.currency || 'TRY';
      doc.text(turkishToPdf(formatMoney(cariEkstreStats.priorBalance, currSym)), 15, y + 10);
      doc.text(turkishToPdf(formatMoney(periodBorc, currSym)), 65, y + 10);
      doc.text(turkishToPdf(formatMoney(periodAlacak, currSym)), 115, y + 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text(turkishToPdf(formatMoney(cariEkstreStats.finalBalance, currSym)), 165, y + 10);
  
      y += 22;
  
      // Table Header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 8, 'F');
      doc.text(turkishToPdf('Tarih'), 12, y + 5.5);
      doc.text(turkishToPdf('Islem Turu / No'), 32, y + 5.5);
      doc.text(turkishToPdf('Aciklama'), 82, y + 5.5);
      doc.text(turkishToPdf('Borc (+)'), 132, y + 5.5);
      doc.text(turkishToPdf('Alacak (-)'), 157, y + 5.5);
      doc.text(turkishToPdf('Bakiye'), 182, y + 5.5);
  
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
  
      // Initial Row: Devir
      doc.setFillColor(252, 252, 252);
      doc.rect(10, y, 190, 7, 'F');
      doc.text(turkishToPdf(resolvedDates.start), 12, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishToPdf('DONEM BASI DEVIR BAKILESI'), 32, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('-', 132, y + 4.5);
      doc.text('-', 157, y + 4.5);
      doc.text(turkishToPdf(formatMoney(cariEkstreStats.priorBalance, currSym)), 182, y + 4.5);
      y += 7;
  
      // Transactions loop
      cariEkstreStats.periodTransactions.forEach((t, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
  
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 7, 'F');
        }
  
        const typeLabel = t.type === 'sale' ? 'Satis' : t.type === 'purchase' ? 'Alis' : t.type === 'collection' ? 'Tahsilat' : t.type === 'payment' ? 'Odeme' : t.type === 'sale_return' ? 'Satis Iade' : 'Alis Iade';
        const docNo = t.invoiceNo ? ` (${t.invoiceNo})` : '';
  
        doc.text(turkishToPdf(t.date), 12, y + 4.5);
        doc.text(turkishToPdf(typeLabel + docNo), 32, y + 4.5);
        doc.text(turkishToPdf((t.description || '').substring(0, 30)), 82, y + 4.5);
        
        doc.text(t.borc > 0 ? turkishToPdf(formatMoney(t.borc, currSym)) : '-', 132, y + 4.5);
        doc.text(t.alacak > 0 ? turkishToPdf(formatMoney(t.alacak, currSym)) : '-', 157, y + 4.5);
        doc.text(turkishToPdf(formatMoney(t.runningBalance, currSym)), 182, y + 4.5);
  
        y += 7;
      });
  
      // Footer lines
      doc.line(10, 280, 200, 280);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(turkishToPdf('Isbu hesap dokumu mutabakat amacli olup Storm tarafindan uretilmistir. 7 gun icinde itiraz edilmeyen ekstreler kabul edilmis sayilir.'), 10, 284);
      
      doc.save(`Ekstre_${selectedCari.name.replace(/\s+/g, '_')}_${resolvedDates.start}_${resolvedDates.end}.pdf`);
    };
  
    const downloadKarZararPdf = () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      const primaryColor = [79, 70, 229]; // Indigo-600
      const darkGray = [30, 41, 59]; // Slate-800
      const lightGray = [241, 245, 249]; // Slate-100
  
      // Header drawing
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, 10, 190, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(turkishToPdf('STORM ON MUHASEBE - KAR-ZARAR RAPORU'), 15, 15.5);
  
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(14);
      doc.text(turkishToPdf('DETAYLI KAR-ZARAR RAPORU'), 10, 26);
  
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(turkishToPdf(`Rapor Araligi: ${resolvedDates.start} / ${resolvedDates.end}`), 10, 32);
      doc.text(turkishToPdf(`Rapor Doviz Cinsi: ${selectedCurrency}`), 10, 36);
      doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 140, 32);
      
      doc.line(10, 40, 200, 40);
  
      let y = 46;
  
      // SECTION 1: KDV RAPORU
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      y += 5;
  
      const salesExVat = summaryStats.sales;
      const costExVat = summaryStats.costOfSales;
      const grossProfitExVat = salesExVat - costExVat;
      const netProfitExVat = grossProfitExVat - summaryStats.totalExpenses - summaryStats.employeeSalaries;
  
      const plRows = [
        ['Brüt Satış Gelirleri ', formatMoney(salesExVat)],
        ['Satılan Malın Maliyeti (SMM) ', formatMoney(costExVat)],
        ['BRUT FAALIYET KARI / ZARARI', formatMoney(grossProfitExVat)],
        ['Genel Yönetim ve Faaliyet Giderleri (-)', formatMoney(summaryStats.totalExpenses)],
        ['Personel ve İşçilik Giderleri (-)', formatMoney(summaryStats.employeeSalaries)],
        ['NET FAALIYET KARI / ZARARI (VERGI ONCESI)', formatMoney(netProfitExVat)],
      ];
  
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 7, 'F');
      doc.text(turkishToPdf('Gelir / Gider Kalemi'), 15, y + 4.5);
      doc.text(turkishToPdf('Tutar (' + selectedCurrency + ')'), 150, y + 4.5);
      y += 7;
  
      plRows.forEach((row, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 6.5, 'F');
        }
  
        const isHighlight = row[0].includes('KARI') || row[0].includes('ZARARI');
        if (isHighlight) {
          doc.setFont('helvetica', 'bold');
          if (row[0].includes('NET')) {
            doc.setFillColor(241, 245, 249);
            doc.rect(10, y, 190, 6.5, 'F');
            if (netProfitExVat >= 0) {
              doc.setTextColor(5, 150, 105);
            } else {
              doc.setTextColor(220, 38, 38);
            }
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        }
  
        doc.text(turkishToPdf(row[0]), 15, y + 4.5);
        doc.text(turkishToPdf(row[1]), 150, y + 4.5);
        y += 6.5;
      });
  
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      y += 12;
  
      doc.line(10, 280, 200, 280);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(turkishToPdf('Bu finansal rapor Storm On Muhasebe sistemi tarafindan uretilmistir. Resmi beyanname niteligi tasimaz.'), 10, 284);
      
      doc.save(`KDV_ve_KarZarar_Raporu_${resolvedDates.start}_to_${resolvedDates.end}.pdf`);
    };
  
  
  return { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKarZararPdf };
}
