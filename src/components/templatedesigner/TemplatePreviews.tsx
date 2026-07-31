import React from 'react';
import Barcode from 'react-barcode';
import { QrCodeImage } from './QrCodeImage';
import { PrintTemplateConfig } from '../TemplateDesignerView';

interface TemplatePreviewsProps {
  activeTemplate: PrintTemplateConfig;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  logoType: 'text' | 'image';
  logoImageUrl: string;
  sampleDataType?: 'market' | 'restaurant' | 'online' | 'tahsilat';
}

export function TemplatePreviews({
  activeTemplate,
  companyName = 'STORM MUHASEBE & RETAIL',
  companyAddress = 'Atatürk Cad. No:142 Çankaya / ANKARA',
  companyPhone = '0850 300 00 00',
  logoType = 'text',
  logoImageUrl = '',
  sampleDataType = 'market',
}: TemplatePreviewsProps) {
  // Determine paper width
  const is58mm = activeTemplate.paperSize === 'termal_58' || activeTemplate.rollWidth === '58mm';
  const paperWidthPx = is58mm ? 230 : 310; // Realistic pixel scale for 58mm vs 80mm

  // Divider lines based on lineStyle setting
  const getDivider = (style?: string) => {
    switch (style) {
      case 'double':
        return '==========================================';
      case 'solid':
        return '------------------------------------------';
      case 'dotted':
        return '..........................................';
      case 'dashed':
      default:
        return '- - - - - - - - - - - - - - - - - - - - -';
    }
  };

  const divider = getDivider(activeTemplate.lineStyle);

  // Sample data choices
  const sampleItemsMap = {
    market: [
      { name: 'ÇAYKUR TİRYAKİ ÇAY 1000 GR', qty: 2, price: 145.00, discount: 10, vat: 10, code: '869012345601' },
      { name: 'SÜTAŞ YARIM YAĞLI SÜT 1 LT', qty: 4, price: 32.50, discount: 0, vat: 10, code: '869012345602' },
      { name: 'UNO BÜYÜK TOST EKMEĞİ 500G', qty: 1, price: 48.00, discount: 0, vat: 10, code: '869012345603' },
      { name: 'SIRMA DOĞAL MADEN SUYU 6x200ML', qty: 1, price: 42.00, discount: 5, vat: 10, code: '869012345604' },
    ],
    restaurant: [
      { name: 'KARARIŞIK IZGARA KEBAP MENÜ', qty: 2, price: 340.00, discount: 0, vat: 10, code: 'RST-101' },
      { name: 'GAVURDAĞI SALATASI (ÖZEL)', qty: 1, price: 110.00, discount: 0, vat: 10, code: 'RST-102' },
      { name: 'KÜNEFE (KAYMAKLI)', qty: 2, price: 130.00, discount: 0, vat: 10, code: 'RST-103' },
      { name: 'EV YAPIMI KÖPÜKLÜ AYRAN', qty: 3, price: 30.00, discount: 0, vat: 10, code: 'RST-104' },
    ],
    online: [
      { name: 'DÖNER DÜRÜM MENÜ + İÇECEK', qty: 1, price: 210.00, discount: 15, vat: 10, code: 'ONL-55' },
      { name: 'PATATES KIZARTMASI (BÜYÜK)', qty: 1, price: 65.00, discount: 0, vat: 10, code: 'ONL-56' },
      { name: 'SUTLAÇ EV YAPIMI', qty: 1, price: 85.00, discount: 0, vat: 10, code: 'ONL-57' },
    ],
    tahsilat: [
      { name: 'CARI HESAP TAHSİLAT KAPANMA FİŞİ', qty: 1, price: 4500.00, discount: 0, vat: 0, code: 'THS-01' },
    ]
  };

  const sampleItems = sampleItemsMap[sampleDataType] || sampleItemsMap.market;

  // Calculate totals
  let grossSubtotal = 0;
  let totalDiscount = 0;
  let totalVat = 0;

  sampleItems.forEach(item => {
    const rawTotal = item.qty * item.price;
    const discAmount = rawTotal * (item.discount / 100);
    const netTotal = rawTotal - discAmount;
    const vatAmount = netTotal * (item.vat / 100);

    grossSubtotal += rawTotal;
    totalDiscount += discAmount;
    totalVat += vatAmount;
  });

  const grandTotal = grossSubtotal - totalDiscount;

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      {/* THERMAL ROLL PRINTER TOP SPOOL DECORATION */}
      <div 
        className="h-3 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-t-md shadow-inner mb-[-2px] border border-slate-400 z-10"
        style={{ width: `${paperWidthPx + 16}px` }}
      />

      {/* THERMAL PAPER STRIP */}
      <div
        className={`bg-white text-black font-mono shadow-2xl relative transition-all duration-300 border-x border-slate-300 ${
          activeTemplate.density === 'bold_dark' ? 'contrast-125 font-bold' : ''
        }`}
        style={{
          width: `${paperWidthPx}px`,
          paddingLeft: is58mm ? '10px' : '16px',
          paddingRight: is58mm ? '10px' : '16px',
          paddingTop: '16px',
          paddingBottom: '20px',
          fontSize: activeTemplate.fontSize === 'xs' ? '10px' : activeTemplate.fontSize === 'base' ? '13px' : '11px',
          lineHeight: '1.35',
          fontFamily: activeTemplate.fontFamily === 'courier' 
            ? "'Courier New', Courier, monospace"
            : activeTemplate.fontFamily === 'consolas'
            ? "'Consolas', 'Lucida Console', monospace"
            : "'Courier New', monospace"
        }}
      >
        {/* TOP SERRATED PAPER TEAR EDGE */}
        <div className="absolute -top-2 left-0 right-0 h-2 bg-slate-900/10 pointer-events-none overflow-hidden flex">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 bg-slate-950/80 rotate-45 transform origin-top-left -mt-1" />
          ))}
        </div>

        {/* --- HEADER SECTION --- */}
        <div className={`text-center space-y-1 ${
          activeTemplate.logoAlignment === 'left' ? 'text-left' : activeTemplate.logoAlignment === 'right' ? 'text-right' : 'text-center'
        }`}>
          {/* Logo */}
          {activeTemplate.showLogo && (
            <div className="mb-2 flex justify-center">
              {logoType === 'image' && logoImageUrl ? (
                <img 
                  src={logoImageUrl} 
                  alt="Logo" 
                  className="max-h-12 max-w-[180px] object-contain filter grayscale contrast-200" 
                />
              ) : (
                <div className="border-2 border-black font-black tracking-tighter px-2 py-0.5 text-sm uppercase inline-block">
                  {companyName || 'STORM POS'}
                </div>
              )}
            </div>
          )}

          {/* Company Name */}
          {activeTemplate.showCompanyName && (
            <div className={`font-extrabold uppercase leading-tight ${
              activeTemplate.companyNameSize === 'xlarge' ? 'text-base' : activeTemplate.companyNameSize === 'large' ? 'text-sm' : 'text-xs'
            }`}>
              {companyName || 'STORM MUHASEBE & POS'}
            </div>
          )}

          {/* Branch / Cashier info */}
          {activeTemplate.showBranchCashier && (
            <div className="text-[10px] text-zinc-800">
              Şube: Merkez Şube | Kasa: POS-01
            </div>
          )}

          {/* Address & Phone */}
          {activeTemplate.showCompanyAddress && (
            <div className="text-[9.5px] leading-tight text-zinc-800 whitespace-pre-line">
              {companyAddress}
              {companyPhone && <div className="font-semibold mt-0.5">Tel: {companyPhone}</div>}
            </div>
          )}

          {/* Tax Info */}
          {activeTemplate.showTaxInfo && (
            <div className="text-[9px] text-zinc-700">
              Marmara V.D. - VKN: 1029384756
            </div>
          )}

          {/* Welcome Note */}
          {activeTemplate.welcomeNote && (
            <div className="text-[10px] italic font-semibold pt-1">
              *** {activeTemplate.welcomeNote} ***
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="overflow-hidden whitespace-nowrap text-zinc-400 my-1.5 text-[9px]">
          {divider}
        </div>

        {/* DOCUMENT TITLE */}
        <div className="text-center font-extrabold text-sm tracking-wider uppercase my-1">
          *** {activeTemplate.documentTitle || 'POS SATIŞ FİŞİ'} ***
        </div>

        {/* DIVIDER */}
        <div className="overflow-hidden whitespace-nowrap text-zinc-400 my-1.5 text-[9px]">
          {divider}
        </div>

        {/* --- METADATA SECTION --- */}
        <div className="text-[10px] space-y-0.5">
          {activeTemplate.showReceiptNo !== false && (
            <div className="flex justify-between">
              <span className="text-zinc-600">FİŞ NO:</span>
              <span className="font-bold">POS-20260731-9947</span>
            </div>
          )}

          {activeTemplate.showDateTime !== false && (
            <div className="flex justify-between">
              <span className="text-zinc-600">TARİH & SAAT:</span>
              <span>31.07.2026 23:30</span>
            </div>
          )}

          {activeTemplate.showPersonnelName !== false && (
            <div className="flex justify-between">
              <span className="text-zinc-600">KASİYER:</span>
              <span className="font-semibold">AHMET YILMAZ</span>
            </div>
          )}

          {activeTemplate.showCustomerName !== false && (
            <div className="flex justify-between border-t border-dotted border-zinc-300 pt-0.5 mt-0.5">
              <span className="text-zinc-600">MÜŞTERİ:</span>
              <span className="font-bold text-black uppercase">PERAKENDE MÜŞTERİ</span>
            </div>
          )}

          {activeTemplate.showCustomerTaxAddress && (
            <div className="text-[9px] text-zinc-700 leading-tight border-t border-dotted border-zinc-200 pt-0.5">
              <div>VKN/TC: 12345678901</div>
              <div>ADRES: Çankaya Mah. 12. Cadde No: 4 Ankara</div>
            </div>
          )}

          {activeTemplate.showTableOrderType && (
            <div className="flex justify-between font-bold text-black bg-zinc-100 px-1.5 py-0.5 rounded my-1 text-[10.5px]">
              <span>SİPARİŞ TİPİ:</span>
              <span>MASA M-08 (GEL-AL)</span>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="overflow-hidden whitespace-nowrap text-zinc-400 my-1.5 text-[9px]">
          {divider}
        </div>

        {/* --- PRODUCT ITEMS TABLE --- */}
        <div className="my-2">
          {/* Table Header for single_line or column titles */}
          {activeTemplate.itemFormat === 'single_line' ? (
            <div className="flex justify-between text-[9px] font-bold border-b border-black pb-0.5 mb-1 uppercase">
              <span className="flex-1">ÜRÜN ADI</span>
              <span className="w-10 text-center">MİK</span>
              <span className="w-14 text-right">TUTAR</span>
            </div>
          ) : (
            <div className="flex justify-between text-[9px] font-bold border-b border-black pb-0.5 mb-1 uppercase">
              <span>AÇIKLAMA / ÜRÜN</span>
              <span>TUTAR (TL)</span>
            </div>
          )}

          {/* Product Items List */}
          <div className="space-y-2">
            {sampleItems.map((item, idx) => {
              const rawTotal = item.qty * item.price;
              const discAmount = rawTotal * (item.discount / 100);
              const netTotal = rawTotal - discAmount;

              if (activeTemplate.itemFormat === 'single_line') {
                return (
                  <div key={idx} className="flex justify-between text-[10px] items-start leading-tight">
                    <span className="flex-1 truncate pr-1 font-semibold">
                      {activeTemplate.showRowNumbers && `${idx + 1}. `}
                      {item.name}
                    </span>
                    <span className="w-8 text-center">{item.qty}x</span>
                    <span className="w-16 text-right font-bold">₺{netTotal.toFixed(2)}</span>
                  </div>
                );
              }

              // Default: DOUBLE LINE (Most readable for thermal printers)
              return (
                <div key={idx} className="text-[10.5px] leading-snug border-b border-dotted border-zinc-200 pb-1.5 last:border-0">
                  {/* Line 1: Item Name */}
                  <div className="font-bold text-black uppercase flex justify-between gap-1">
                    <span>
                      {activeTemplate.showRowNumbers && `${idx + 1}. `}
                      {item.name}
                    </span>
                    {activeTemplate.showItemVat && (
                      <span className="text-[8.5px] font-normal text-zinc-600">%10 KDV</span>
                    )}
                  </div>

                  {/* Line 2: Quantity x Price = Net Total */}
                  <div className="flex justify-between text-[9.5px] text-zinc-800 pl-2">
                    <span>
                      {item.qty} ADET x ₺{item.price.toFixed(2)}
                      {activeTemplate.showItemDiscount && item.discount > 0 && (
                        <span className="text-zinc-600 ml-1">( -%{item.discount} İsk )</span>
                      )}
                    </span>
                    <span className="font-bold text-black">₺{netTotal.toFixed(2)}</span>
                  </div>

                  {/* Item Code if enabled */}
                  {activeTemplate.showItemCode && item.code && (
                    <div className="text-[8px] font-mono text-zinc-500 pl-2">
                      Kod: {item.code}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="overflow-hidden whitespace-nowrap text-zinc-400 my-1.5 text-[9px]">
          {divider}
        </div>

        {/* --- TOTALS & PAYMENTS --- */}
        <div className="space-y-0.5 text-[10.5px]">
          {activeTemplate.showSubtotal !== false && (
            <div className="flex justify-between text-zinc-700">
              <span>ARA TOPLAM:</span>
              <span>₺{grossSubtotal.toFixed(2)}</span>
            </div>
          )}

          {activeTemplate.showTotalDiscount !== false && totalDiscount > 0 && (
            <div className="flex justify-between text-zinc-700">
              <span>TOPLAM İSKONTO:</span>
              <span className="font-semibold">-₺{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          {activeTemplate.showTotalVat !== false && (
            <div className="flex justify-between text-zinc-600 text-[9.5px]">
              <span>KDV TOPLAMI (%10):</span>
              <span>₺{totalVat.toFixed(2)}</span>
            </div>
          )}

          {/* GRAND TOTAL - HIGH VISIBILITY BOLD */}
          <div className="my-1.5 pt-1.5 border-t-2 border-black flex justify-between items-center text-sm font-black">
            <span className="uppercase tracking-wider">GENEL TOPLAM</span>
            <span className="text-base font-extrabold bg-black text-white px-1.5 py-0.5 rounded-xs">
              ₺{grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Method Breakdown */}
          {activeTemplate.showPaymentMethodBreakdown !== false && (
            <div className="bg-zinc-100 p-1.5 rounded text-[9.5px] space-y-0.5 my-1">
              <div className="font-bold border-b border-zinc-300 pb-0.5 mb-0.5 flex justify-between">
                <span>ÖDEME ŞEKLİ</span>
                <span>TUTAR</span>
              </div>
              <div className="flex justify-between">
                <span>NAKİT:</span>
                <span className="font-semibold">₺{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Cash Paid & Change */}
          {activeTemplate.showCashPaidAndChange !== false && (
            <div className="text-[9.5px] space-y-0.5 text-zinc-700">
              <div className="flex justify-between">
                <span>VERİLEN NAKİT:</span>
                <span>₺{(grandTotal + 20).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-black">
                <span>PARA ÜSTÜ:</span>
                <span>₺20.00</span>
              </div>
            </div>
          )}

          {/* Customer Balance */}
          {activeTemplate.showCustomerBalance && (
            <div className="flex justify-between text-[9px] font-bold text-zinc-800 border-t border-dashed border-zinc-300 pt-1 mt-1">
              <span>MÜŞTERİ BAKİYESİ:</span>
              <span>₺0,00 (KAPALI)</span>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="overflow-hidden whitespace-nowrap text-zinc-400 my-1.5 text-[9px]">
          {divider}
        </div>

        {/* --- FOOTER & BARCODE / QR SECTION --- */}
        <div className="text-center space-y-2 mt-2">
          {/* Custom Footer Message */}
          {activeTemplate.showFooter !== false && (
            <div className="text-[9.5px] font-bold text-black leading-tight uppercase">
              {activeTemplate.customTextContent || 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.'}
            </div>
          )}

          {/* Refund Policy Note */}
          {activeTemplate.refundPolicyNote && (
            <div className="text-[8.5px] text-zinc-700 italic">
              {activeTemplate.refundPolicyNote}
            </div>
          )}

          {/* Barcode CODE128 */}
          {activeTemplate.showBarcode !== false && (
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="bg-white p-1 rounded inline-block">
                <Barcode 
                  value="POS202607319947" 
                  format="CODE128"
                  width={is58mm ? 1.1 : 1.35}
                  height={32}
                  fontSize={8}
                  margin={0}
                  displayValue={true}
                />
              </div>
            </div>
          )}

          {/* QR Code */}
          {activeTemplate.showQrCode && (
            <div className="flex flex-col items-center justify-center pt-1">
              <QrCodeImage value={activeTemplate.qrCodeUrl || 'https://storm.app/fis/POS-20260731-9947'} size={64} />
              <div className="text-[7.5px] text-zinc-500 font-mono mt-0.5">E-Fiş Doğrulama Kodu</div>
            </div>
          )}

          {/* Wifi & Social Info */}
          {activeTemplate.showWifiSocial && (
            <div className="text-[8.5px] font-semibold text-zinc-800 border-t border-dotted border-zinc-300 pt-1">
              Wi-Fi: STORM_GUEST | Sifre: storm2026
            </div>
          )}

          {/* FEED LINES SIMULATION (AUTO-CUT) */}
          <div className="pt-2 text-center text-[8px] text-zinc-400 font-mono tracking-widest uppercase">
            {Array.from({ length: Math.min(activeTemplate.feedLines || 3, 5) }).map((_, i) => (
              <div key={i}>.</div>
            ))}
            --- [ KAĞIT KESİM ÇİZGİSİ ] ---
          </div>
        </div>

        {/* BOTTOM SERRATED PAPER TEAR EDGE */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 bg-slate-900/10 pointer-events-none overflow-hidden flex transform rotate-180">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 bg-slate-950/80 rotate-45 transform origin-top-left -mt-1" />
          ))}
        </div>
      </div>

      {/* PAPER ROLL BOTTOM SHADOW/ROLL BASE */}
      <div 
        className="h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-b-md shadow-lg mt-[-2px] border border-slate-400 opacity-60"
        style={{ width: `${paperWidthPx}px` }}
      />
    </div>
  );
}
