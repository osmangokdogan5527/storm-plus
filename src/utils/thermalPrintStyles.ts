/**
 * Termal Fiş ve Adisyon Yazıcıları için Mükemmel Siyah, Yüksek Kontrastlı Baskı Stilleri
 * Termal yazıcılarda gri/silik yazıları engellemek için tüm renkler %100 SİYAH (#000000) yapılmıştır.
 * Başlıklar ve Toplamlar büyük ve extra kalın (font-black / 900) olarak ayarlanmıştır.
 */

export function getThermalPrintCSS(
  paperWidthMm: string = '80mm',
  fontFamily: string = 'sans',
  fontSize: string = 'base'
): string {
  const is58 = paperWidthMm.includes('58');
  const baseFontSize = fontSize === 'xs' ? '10px' : fontSize === 'base' ? '13px' : '11px';
  const fontFamilyCss = fontFamily === 'sans' 
    ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' 
    : "'Courier New', Courier, monospace";

  return `
    @page {
      size: ${paperWidthMm} auto;
      margin: 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color: #000000 !important;
      background-color: transparent !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    html, body {
      margin: 0 !important;
      padding: ${is58 ? '2mm 1mm' : '3mm 2mm'} !important;
      width: ${paperWidthMm} !important;
      font-family: ${fontFamilyCss} !important;
      font-size: ${baseFontSize} !important;
      font-weight: 700 !important; /* Termal baskıda tüm gövde metinleri belirgin ve net kalır */
      line-height: 1.25 !important;
      color: #000000 !important;
      background: #ffffff !important;
    }
    
    /* BAŞLIKLAR & BÖLÜMLERİ BÜYÜK VE EKSTRA KALIN YAPMA */
    h1, h2, h3, h4, h5, h6,
    .company-title,
    .document-title,
    .grand-total,
    .font-black {
      font-weight: 900 !important;
      color: #000000 !important;
      letter-spacing: -0.01em !important;
    }

    .company-title {
      font-size: ${is58 ? '15px' : '18px'} !important;
      text-transform: uppercase !important;
      text-align: center !important;
      line-height: 1.15 !important;
      margin-bottom: 2px !important;
    }

    .document-title {
      font-size: ${is58 ? '13px' : '15px'} !important;
      text-transform: uppercase !important;
      text-align: center !important;
      padding: 4px 0 !important;
      margin: 4px 0 !important;
      border-top: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
    }

    /* TAILWIND ESNEK VE TABLO DÜZENİ DESTEĞİ */
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-start { justify-content: flex-start !important; }
    .justify-end { justify-content: flex-end !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .flex-1 { flex: 1 1 0% !important; }

    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    
    .font-normal { font-weight: 600 !important; }
    .font-semibold { font-weight: 700 !important; }
    .font-bold { font-weight: 800 !important; }
    .font-black, .font-extrabold { font-weight: 900 !important; }

    .uppercase { text-transform: uppercase !important; }
    .italic { font-style: italic !important; }
    .font-mono { font-family: 'Courier New', Courier, monospace !important; }

    /* YAZI BOYUTLARI - NET VE BELİRGİN */
    .text-\[7.5px\], .text-\[8px\], .text-\[8.5px\] { font-size: 9px !important; }
    .text-\[9px\] { font-size: 10px !important; }
    .text-\[9.5px\], .text-\[10px\] { font-size: 11px !important; }
    .text-\[11px\], .text-xs { font-size: 12px !important; }
    .text-sm { font-size: 14px !important; }
    .text-base { font-size: 16px !important; }
    .text-lg { font-size: 18px !important; }
    .text-xl { font-size: 20px !important; }
    .text-2xl { font-size: 24px !important; }

    /* KENARLIKLAR & BÖLÜCÜ ÇİZGİLER (KOYU SİYAH) */
    .border, .border-t, .border-b, .border-l, .border-r,
    .border-2, .border-y-2, .border-t-2, .border-b-2 {
      border-color: #000000 !important;
    }
    .border { border-style: solid !important; border-width: 1px !important; }
    .border-b { border-bottom: 1px solid #000000 !important; }
    .border-t { border-top: 1px solid #000000 !important; }
    .border-2 { border: 2px solid #000000 !important; }
    .border-t-2 { border-top: 2px solid #000000 !important; }
    .border-b-2 { border-bottom: 2px solid #000000 !important; }
    .border-y-2 { border-top: 2px solid #000000 !important; border-bottom: 2px solid #000000 !important; }
    .border-dashed { border-style: dashed !important; }
    .border-dotted { border-style: dotted !important; }

    /* İÇ VE DIŞ BOŞLUKLAR */
    .w-full { width: 100% !important; }
    .space-y-0\.5 > * + * { margin-top: 2px !important; }
    .space-y-1 > * + * { margin-top: 4px !important; }
    .space-y-1\.5 > * + * { margin-top: 6px !important; }
    .space-y-2 > * + * { margin-top: 8px !important; }
    
    .py-0\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
    .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
    .py-1\.5 { padding-top: 6px !important; padding-bottom: 6px !important; }
    .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
    .px-1 { padding-left: 4px !important; padding-right: 4px !important; }
    .px-1\.5 { padding-left: 6px !important; padding-right: 6px !important; }
    .px-2 { padding-left: 8px !important; padding-right: 8px !important; }

    .pt-0\.5 { padding-top: 2px !important; }
    .pt-1 { padding-top: 4px !important; }
    .pt-2 { padding-top: 8px !important; }
    .pb-0\.5 { padding-bottom: 2px !important; }
    .pb-1 { padding-bottom: 4px !important; }
    .pb-2 { padding-bottom: 8px !important; }
    .my-1 { margin-top: 4px !important; margin-bottom: 4px !important; }
    .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }

    .truncate {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .max-w-\[110px\] { max-width: 110px !important; }
    .max-w-\[150px\] { max-width: 150px !important; }
    .max-w-\[180px\] { max-width: 180px !important; }

    /* TABLOLAR */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 4px 0 !important;
    }
    th, td {
      text-align: left !important;
      padding: 3px 0 !important;
      font-size: inherit !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }
    
    /* GÖRSELLER VE QR KOD / BARKOD */
    img, svg, canvas {
      max-width: 100% !important;
      filter: contrast(200%) grayscale(100%) !important;
    }
  `;
}

export function printThermalReceipt(options: {
  title: string;
  htmlContent: string;
  paperWidthMm?: string;
  fontFamily?: string;
  fontSize?: string;
}): void {
  const { title, htmlContent, paperWidthMm = '80mm', fontFamily = 'sans', fontSize = 'base' } = options;
  const css = getThermalPrintCSS(paperWidthMm, fontFamily, fontSize);

  const printWindow = window.open('', '_blank', 'width=450,height=700');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 100);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
