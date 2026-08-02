import React, { useRef, useState, useEffect } from 'react';
import { PosSaleSummary } from '../../types/pos';
import { Printer, X, Check, ShieldCheck, FileText, ChevronDown } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';
import { printThermalReceipt } from '../../utils/thermalPrintStyles';
import Barcode from 'react-barcode';
import { QrCodeImage } from '../templatedesigner/QrCodeImage';
import { PrintTemplateConfig } from '../TemplateDesignerView';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleSummary: PosSaleSummary | null;
  companyName?: string;
}

const DEFAULT_THERMAL_TEMPLATE: PrintTemplateConfig = {
  id: 'termal-80mm-market',
  name: '80mm POS Fişi',
  type: 'satis',
  documentTitle: 'POS SATIŞ FİŞİ',
  paperSize: 'termal_80',
  rollWidth: '80mm',
  isDefault: true,
  density: 'normal',
  lineStyle: 'dashed',
  feedLines: 3,
  showLogo: false,
  logoAlignment: 'center',
  showCompanyName: true,
  companyNameSize: 'normal',
  showCompanyAddress: true,
  showBranchCashier: true,
  showTaxInfo: true,
  welcomeNote: 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz',
  showReceiptNo: true,
  showDateTime: true,
  showPersonnelName: true,
  showCustomerName: true,
  itemFormat: 'double_line',
  showItemCode: false,
  showItemVat: true,
  showItemDiscount: true,
  showDiscountRate: true,
  showExVatAmount: false,
  showVatRate: true,
  showUnitPrice: true,
  showSubtotal: true,
  showTotalDiscount: true,
  showTotalVat: true,
  showGrandTotal: true,
  showPaymentMethodBreakdown: true,
  showCashPaidAndChange: true,
  showCustomerBalance: false,
  showFooter: true,
  customTextContent: 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.',
  refundPolicyNote: '7 gün içinde fişiniz ile değişim yapılabilir.',
  showBarcode: true,
  showQrCode: false,
};

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  isOpen,
  onClose,
  saleSummary,
  companyName: propCompanyName,
}) => {
  const [templates, setTemplates] = useState<PrintTemplateConfig[]>([DEFAULT_THERMAL_TEMPLATE]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('termal-80mm-market');
  
  // Store details from Fiş Tasarımı / LocalStorage
  const [storeInfo, setStoreInfo] = useState({
    companyName: propCompanyName || 'PERAKENDE SATIŞ FİŞİ',
    companyAddress: 'Atatürk Cad. No:142 Çankaya / ANKARA',
    companyPhone: '0850 300 00 00',
    logoType: 'text' as 'text' | 'image',
    logoImageUrl: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load templates
    const savedTemplates = localStorage.getItem('storm_print_templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          const defaultT = parsed.find((t: any) => t.isDefault) || parsed[0];
          setSelectedTemplateId(defaultT.id);
        }
      } catch (e) {}
    }

    // Load store settings
    const savedSettings = localStorage.getItem('storm_muhasebe_print_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setStoreInfo(prev => ({
          ...prev,
          companyName: parsedSettings.companyName || propCompanyName || prev.companyName,
          companyAddress: parsedSettings.companyAddress || prev.companyAddress,
          companyPhone: parsedSettings.companyPhone || prev.companyPhone,
          logoType: parsedSettings.logoType || prev.logoType,
          logoImageUrl: parsedSettings.logoImageUrl || prev.logoImageUrl,
        }));
      } catch (e) {}
    }
  }, [isOpen, propCompanyName]);

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_THERMAL_TEMPLATE;
  const is58mm = activeTemplate.paperSize === 'termal_58' || activeTemplate.rollWidth === '58mm';
  const paperWidthPx = is58mm ? 230 : 300;

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !saleSummary) return null;

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

  const handlePrint = () => {
    try {
      const content = printRef.current;
      if (!content) return;

      printThermalReceipt({
        title: `Fiş - ${saleSummary.receiptNo}`,
        htmlContent: content.innerHTML,
        paperWidthMm: is58mm ? '58mm' : '80mm',
        fontFamily: activeTemplate.fontFamily,
        fontSize: activeTemplate.fontSize,
      });
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosReceiptModal:handlePrint');
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER WITH TEMPLATE SELECTOR */}
        <div className="px-4 py-3 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <Printer size={16} className="text-teal-400" />
            <span className="text-sm font-bold">Satış Fişi Önizleme</span>
          </div>

          <div className="flex items-center gap-2">
            {templates.length > 1 && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rollWidth || '80mm'}) {t.isDefault ? '★' : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* RECEIPT PAPER CONTAINER */}
        <div className="p-4 bg-slate-950/70 overflow-y-auto flex-1 custom-scrollbar flex flex-col items-center justify-start">
          <div
            ref={printRef}
            className={`bg-white text-black shadow-2xl font-mono text-xs space-y-2 leading-tight border-2 border-black p-3.5 rounded-sm transition-all ${
              activeTemplate.density === 'bold_dark' ? 'font-bold' : 'font-semibold'
            }`}
            style={{ width: `${paperWidthPx}px`, color: '#000000' }}
          >
            {/* 1. FİRMA LOGO VEYA BAŞLIĞI */}
            <div className={`text-${activeTemplate.logoAlignment || 'center'} space-y-1 pb-1`}>
              {activeTemplate.showLogo && storeInfo.logoImageUrl && storeInfo.logoType === 'image' ? (
                <div className={`flex justify-${activeTemplate.logoAlignment === 'left' ? 'start' : activeTemplate.logoAlignment === 'right' ? 'end' : 'center'} mb-2`}>
                  <img src={storeInfo.logoImageUrl} alt="Logo" className="max-h-12 object-contain" />
                </div>
              ) : null}

              {activeTemplate.showCompanyName && (
                <h3 className={`company-title font-black text-black tracking-tight uppercase leading-tight ${
                  activeTemplate.companyNameSize === 'xlarge' ? 'text-lg sm:text-xl' : activeTemplate.companyNameSize === 'large' ? 'text-base sm:text-lg' : 'text-sm font-black'
                }`} style={{ color: '#000000' }}>
                  {storeInfo.companyName}
                </h3>
              )}

              {activeTemplate.showCompanyAddress && (
                <p className="text-[10px] font-bold text-black leading-tight">
                  {storeInfo.companyAddress}
                  {storeInfo.companyPhone ? ` • Tel: ${storeInfo.companyPhone}` : ''}
                </p>
              )}

              {activeTemplate.showBranchCashier && (
                <p className="text-[10px] font-bold text-black">
                  Şube: MERKEZ | POS-01
                </p>
              )}

              {activeTemplate.documentTitle && (
                <div className="document-title font-black text-xs sm:text-sm text-black uppercase tracking-wider py-1 my-1 border-y-2 border-black text-center" style={{ color: '#000000' }}>
                  *** {activeTemplate.documentTitle} ***
                </div>
              )}

              {activeTemplate.welcomeNote && (
                <p className="text-[10px] font-bold text-black italic text-center">
                  {activeTemplate.welcomeNote}
                </p>
              )}
            </div>

            <div className="text-[10px] font-black text-black text-center overflow-hidden">{divider}</div>

            {/* 2. METADATA (TARIH, FIS NO, MUSTERI, KASIYER) */}
            <div className="text-[11px] font-bold text-black space-y-0.5">
              {activeTemplate.showReceiptNo !== false && (
                <div className="flex justify-between">
                  <span>FİŞ NO:</span>
                  <span className="font-black text-black">{saleSummary.receiptNo}</span>
                </div>
              )}
              {activeTemplate.showDateTime !== false && (
                <div className="flex justify-between text-black">
                  <span>TARİH & SAAT:</span>
                  <span className="font-bold">{saleSummary.date} {saleSummary.time}</span>
                </div>
              )}
              {activeTemplate.showPersonnelName !== false && (
                <div className="flex justify-between text-black">
                  <span>KASİYER:</span>
                  <span className="font-bold">AHMET YILMAZ</span>
                </div>
              )}
              {activeTemplate.showCustomerName !== false && saleSummary.cariName && (
                <div className="flex justify-between pt-0.5 border-t border-black">
                  <span>MÜŞTERİ:</span>
                  <span className="font-black text-black truncate max-w-[150px]">{saleSummary.cariName}</span>
                </div>
              )}
            </div>

            <div className="text-[10px] font-black text-black text-center overflow-hidden">{divider}</div>

            {/* 3. URÜN KALEMLERİ TABLOSU */}
            <div className="space-y-1">
              {activeTemplate.itemFormat === 'single_line' ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-black text-[10px] uppercase font-black text-black">
                      <th className="py-1">AÇIKLAMA</th>
                      <th className="text-center py-1">AD</th>
                      <th className="text-right py-1">TUTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleSummary.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-black text-[11px] font-bold text-black">
                        <td className="py-1 pr-1 truncate max-w-[110px] font-bold text-black">
                          {idx + 1}. {item.stockName}
                        </td>
                        <td className="text-center font-bold text-black">{item.quantity}</td>
                        <td className="text-right font-bold text-black">₺{item.totalLine.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* DOUBLE LINE FORMAT (STANDART TERMAL) */
                <div className="space-y-1.5 text-[11px] font-bold text-black">
                  <div className="flex justify-between font-black text-[10px] border-b-2 border-black pb-0.5 text-black uppercase">
                    <span>AÇIKLAMA / ÜRÜN</span>
                    <span>TUTAR (TL)</span>
                  </div>
                  {saleSummary.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5 border-b border-black pb-1">
                      <div className="font-bold text-black flex justify-between">
                        <span className="truncate pr-1">{idx + 1}. {item.stockName}</span>
                        <span className="font-black text-black">₺{item.totalLine.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-black pl-2 flex justify-between">
                        <span>
                          {item.quantity} ADET x ₺{item.unitPrice.toFixed(2)}
                          {activeTemplate.showItemVat !== false ? ` (%${item.taxRate} KDV)` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] font-black text-black text-center overflow-hidden">{divider}</div>

            {/* 4. DİP TOPLAMLAR */}
            <div className="space-y-1 text-[11px] font-bold text-black">
              {activeTemplate.showSubtotal !== false && (
                <div className="flex justify-between text-black">
                  <span>ARA TOPLAM:</span>
                  <span className="font-bold">₺{saleSummary.subtotal.toFixed(2)}</span>
                </div>
              )}

              {activeTemplate.showTotalDiscount !== false && saleSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-black">
                  <span>TOPLAM İSKONTO:</span>
                  <span className="font-bold">-₺{saleSummary.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              {activeTemplate.showTotalVat !== false && (
                <div className="flex justify-between text-black">
                  <span>KDV TOPLAMI (%10):</span>
                  <span className="font-bold">₺{saleSummary.totalTax.toFixed(2)}</span>
                </div>
              )}

              {activeTemplate.showGrandTotal !== false && (
                <div className="grand-total flex justify-between items-center font-black text-base sm:text-lg pt-1 pb-1 px-2 my-1 border-2 border-black text-black bg-white" style={{ color: '#000000' }}>
                  <span>GENEL TOPLAM</span>
                  <span className="font-mono text-black font-black text-base sm:text-lg">
                    ₺{saleSummary.grandTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] font-black text-black text-center overflow-hidden">{divider}</div>

            {/* 5. ÖDEME YÖNTEMLERİ */}
            {activeTemplate.showPaymentMethodBreakdown !== false && (
              <div className="text-[10px] font-bold text-black space-y-0.5">
                <div className="font-black text-[10px] text-black uppercase">ÖDEME ŞEKLİ:</div>
                {saleSummary.paymentSplit.cashAmount > 0 && (
                  <div className="flex justify-between">
                    <span>NAKİT:</span>
                    <span className="font-black">₺{saleSummary.paymentSplit.cashAmount.toFixed(2)}</span>
                  </div>
                )}
                {saleSummary.paymentSplit.changeGiven > 0 && activeTemplate.showCashPaidAndChange !== false && (
                  <div className="flex justify-between text-black">
                    <span>VERİLEN NAKİT / PARA ÜSTÜ:</span>
                    <span className="font-bold">₺{saleSummary.paymentSplit.changeGiven.toFixed(2)}</span>
                  </div>
                )}
                {saleSummary.paymentSplit.posAmount > 0 && (
                  <div className="flex justify-between">
                    <span>KREDİ KARTI / POS:</span>
                    <span className="font-black">₺{saleSummary.paymentSplit.posAmount.toFixed(2)}</span>
                  </div>
                )}
                {saleSummary.paymentSplit.platformName && (
                  <div className="flex justify-between text-black">
                    <span>{saleSummary.paymentSplit.platformName.toUpperCase()}:</span>
                    <span className="font-black">₺{saleSummary.grandTotal.toFixed(2)}</span>
                  </div>
                )}
                {saleSummary.paymentSplit.openAccountAmount > 0 && (
                  <div className="flex justify-between text-black">
                    <span>AÇIK HESAP (VERESİYE):</span>
                    <span className="font-black">₺{saleSummary.paymentSplit.openAccountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 6. ALT BİLGİ, BARKOD & QR KOD */}
            {(activeTemplate.showFooter || activeTemplate.showBarcode || activeTemplate.showQrCode) && (
              <div className="text-center pt-2 space-y-1.5 text-black">
                {activeTemplate.showFooter && activeTemplate.customTextContent && (
                  <p className="text-[10px] font-black uppercase text-black">
                    {activeTemplate.customTextContent}
                  </p>
                )}

                {activeTemplate.refundPolicyNote && (
                  <p className="text-[9.5px] font-bold text-black italic">
                    {activeTemplate.refundPolicyNote}
                  </p>
                )}

                {/* BARKOD */}
                {activeTemplate.showBarcode && (
                  <div className="flex flex-col items-center justify-center pt-1">
                    <Barcode 
                      value={saleSummary.receiptNo || 'POS123456789'} 
                      width={is58mm ? 1.0 : 1.2} 
                      height={28} 
                      fontSize={8} 
                      margin={0} 
                    />
                  </div>
                )}

                {/* QR KOD */}
                {activeTemplate.showQrCode && (
                  <div className="flex flex-col items-center justify-center pt-1">
                    <QrCodeImage 
                      value={activeTemplate.qrCodeUrl || ''} 
                      size={60} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* FEED LINES / PAPER CUTTING SPACING */}
            {activeTemplate.feedLines && activeTemplate.feedLines > 0 && (
              <div className="pt-2 text-[9px] font-bold text-black text-center tracking-widest">
                - - - | KAĞIT KESİM ÇİZGİSİ | - - -
              </div>
            )}
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="px-4 py-3 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Printer size={16} />
            Yazdır ({activeTemplate.rollWidth || '80mm'})
          </button>
        </div>
      </div>
    </div>
  );
};

