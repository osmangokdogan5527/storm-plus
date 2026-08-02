import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Save, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2,
  Copy,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { TemplateSettingsPanel } from './templatedesigner/TemplateSettingsPanel';
import { TemplatePreviews } from './templatedesigner/TemplatePreviews';
import { printThermalReceipt } from '../utils/thermalPrintStyles';

export interface PrintTemplateConfig {
  id: string;
  name: string;
  type: 'satis' | 'alis' | 'iade' | 'teklif' | 'barkod';
  documentTitle: string;
  paperSize: 'a4' | 'a4_yatay' | 'a5' | 'a5_yatay' | 'termal_80' | 'termal_58' | 'etiket_40x30' | 'etiket_60x40' | 'etiket_80x50' | 'etiket_40x20' | 'etiket_40x60' | 'etiket_ozel';
  isDefault?: boolean;

  // Thermal Roll Specifics
  rollWidth: '80mm' | '58mm';
  fontFamily?: 'monospace' | 'courier' | 'consolas' | 'sans';
  fontSize?: 'xs' | 'sm' | 'base';
  density?: 'normal' | 'bold_dark';
  lineStyle?: 'dashed' | 'double' | 'solid' | 'dotted';
  feedLines?: number;

  // Header & Store Details
  showLogo: boolean;
  logoAlignment?: 'left' | 'center' | 'right';
  showCompanyName: boolean;
  companyNameSize?: 'normal' | 'large' | 'xlarge';
  showCompanyAddress: boolean;
  showBranchCashier?: boolean;
  showTaxInfo?: boolean;
  welcomeNote?: string;

  // Metadata & Customer
  showReceiptNo?: boolean;
  showDateTime?: boolean;
  showPersonnelName?: boolean;
  showCustomerName?: boolean;
  showCustomerTaxAddress?: boolean;
  showTableOrderType?: boolean;

  // Product Items & Table Format
  itemFormat?: 'double_line' | 'single_line';
  showItemCode?: boolean;
  showItemVat?: boolean;
  showItemDiscount?: boolean;
  showDiscountRate: boolean;
  showExVatAmount?: boolean;
  showVatRate: boolean;
  showUnitPrice: boolean;
  showRowNumbers?: boolean;

  // Totals & Payment
  showSubtotal?: boolean;
  showTotalDiscount?: boolean;
  showTotalVat?: boolean;
  showGrandTotal?: boolean;
  showPaymentMethodBreakdown?: boolean;
  showCashPaidAndChange?: boolean;
  showCustomerBalance: boolean;

  // Footer, Barcode & QR
  showFooter: boolean;
  customTextContent?: string;
  refundPolicyNote?: string;
  barcodeFormat?: 'CODE128' | 'EAN13' | 'QR';
  showBarcode?: boolean;
  showQrCode?: boolean;
  qrCodeUrl?: string;
  showWifiSocial?: boolean;

  // Compatibility fields for legacy readers
  showValidityDate?: boolean;
  showProductImage?: boolean;
  showBarcodePrice?: boolean;
  showBarcodeName?: boolean;
  showBarcodeCode?: boolean;
  showCustomText?: boolean;
  showSignatureArea?: boolean;
  deliveryDelivererLabel?: string;
  deliveryReceiverLabel?: string;
  showBankDetails?: boolean;
  bankDetailsTitle?: string;
  bankDetailsContent?: string;
  designStyle?: 'minimal' | 'corporate' | 'modern' | 'elegant' | 'classic';
}

const DEFAULT_THERMAL_TEMPLATES: PrintTemplateConfig[] = [
  {
    id: 'termal-80mm-market',
    name: '80mm Market & POS Fişi',
    type: 'satis',
    documentTitle: 'POS SATIŞ FİŞİ',
    paperSize: 'termal_80',
    rollWidth: '80mm',
    fontFamily: 'courier',
    fontSize: 'sm',
    density: 'normal',
    lineStyle: 'dashed',
    feedLines: 3,
    isDefault: true,

    showLogo: true,
    logoAlignment: 'center',
    showCompanyName: true,
    companyNameSize: 'large',
    showCompanyAddress: true,
    showBranchCashier: true,
    showTaxInfo: true,
    welcomeNote: 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz',

    showReceiptNo: true,
    showDateTime: true,
    showPersonnelName: true,
    showCustomerName: true,
    showCustomerTaxAddress: false,
    showTableOrderType: false,

    itemFormat: 'double_line',
    showItemCode: false,
    showDiscountRate: true,
    showVatRate: true,
    showUnitPrice: true,
    showRowNumbers: true,

    showSubtotal: true,
    showTotalDiscount: true,
    showTotalVat: true,
    showGrandTotal: true,
    showPaymentMethodBreakdown: true,
    showCashPaidAndChange: true,
    showCustomerBalance: false,

    showFooter: true,
    customTextContent: 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.',
    refundPolicyNote: '7 gün içinde fiş ile değişim yapılır.',
    showBarcode: true,
    barcodeFormat: 'CODE128',
    showQrCode: false,
    showWifiSocial: false
  },
  {
    id: 'termal-58mm-mobil',
    name: '58mm Dar Mobil POS FİŞİ',
    type: 'satis',
    documentTitle: 'HIZLI POS FİŞİ',
    paperSize: 'termal_58',
    rollWidth: '58mm',
    fontFamily: 'consolas',
    fontSize: 'xs',
    density: 'bold_dark',
    lineStyle: 'solid',
    feedLines: 2,

    showLogo: false,
    logoAlignment: 'center',
    showCompanyName: true,
    companyNameSize: 'normal',
    showCompanyAddress: false,
    showBranchCashier: true,
    showTaxInfo: false,
    welcomeNote: '',

    showReceiptNo: true,
    showDateTime: true,
    showPersonnelName: true,
    showCustomerName: false,
    showCustomerTaxAddress: false,
    showTableOrderType: false,

    itemFormat: 'single_line',
    showItemCode: false,
    showDiscountRate: false,
    showVatRate: false,
    showUnitPrice: true,
    showRowNumbers: false,

    showSubtotal: false,
    showTotalDiscount: true,
    showTotalVat: false,
    showGrandTotal: true,
    showPaymentMethodBreakdown: true,
    showCashPaidAndChange: true,
    showCustomerBalance: false,

    showFooter: true,
    customTextContent: 'BİLGİ FİŞİDİR.',
    refundPolicyNote: '',
    showBarcode: true,
    barcodeFormat: 'CODE128',
    showQrCode: false,
    showWifiSocial: false
  },
  {
    id: 'termal-80mm-restoran',
    name: '80mm Restoran / Adisyon Fişi',
    type: 'satis',
    documentTitle: 'SİPARİŞ BİLGİ FİŞİ',
    paperSize: 'termal_80',
    rollWidth: '80mm',
    fontFamily: 'courier',
    fontSize: 'sm',
    density: 'bold_dark',
    lineStyle: 'double',
    feedLines: 4,

    showLogo: true,
    logoAlignment: 'center',
    showCompanyName: true,
    companyNameSize: 'large',
    showCompanyAddress: true,
    showBranchCashier: true,
    showTaxInfo: false,
    welcomeNote: 'Afiyet Olsun!',

    showReceiptNo: true,
    showDateTime: true,
    showPersonnelName: true,
    showCustomerName: true,
    showCustomerTaxAddress: false,
    showTableOrderType: true,

    itemFormat: 'double_line',
    showItemCode: false,
    showDiscountRate: true,
    showVatRate: true,
    showUnitPrice: true,
    showRowNumbers: true,

    showSubtotal: true,
    showTotalDiscount: true,
    showTotalVat: true,
    showGrandTotal: true,
    showPaymentMethodBreakdown: true,
    showCashPaidAndChange: false,
    showCustomerBalance: false,

    showFooter: true,
    customTextContent: 'ADİSYON VE SİPARİŞ FİŞİDİR.',
    refundPolicyNote: '',
    showBarcode: false,
    showQrCode: true,
    qrCodeUrl: '',
    showWifiSocial: true
  }
];

export default function TemplateDesignerView() {
  const [templates, setTemplates] = useState<PrintTemplateConfig[]>(DEFAULT_THERMAL_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('termal-80mm-market');
  const [sampleDataType, setSampleDataType] = useState<'market' | 'restaurant' | 'online' | 'tahsilat'>('market');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Store Settings state
  const [companyName, setCompanyName] = useState('PERAKENDE SATIŞ BİLGİ FİŞİ');
  const [companyAddress, setCompanyAddress] = useState('Atatürk Cad. No:142 Çankaya / ANKARA');
  const [companyPhone, setCompanyPhone] = useState('0850 300 00 00');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load saved templates and company settings from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          const defaultT = parsed.find((t: any) => t.isDefault) || parsed[0];
          setActiveTemplateId(defaultT.id);
        } else {
          // Initialize default thermal templates
          saveTemplates(DEFAULT_THERMAL_TEMPLATES);
        }
      } catch (e) {
        saveTemplates(DEFAULT_THERMAL_TEMPLATES);
      }
    } else {
      saveTemplates(DEFAULT_THERMAL_TEMPLATES);
    }

    // Load store details
    const savedSettings = localStorage.getItem('storm_muhasebe_print_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.companyName) setCompanyName(parsedSettings.companyName);
        if (parsedSettings.companyAddress) setCompanyAddress(parsedSettings.companyAddress);
        if (parsedSettings.companyPhone) setCompanyPhone(parsedSettings.companyPhone);
        if (parsedSettings.logoType) setLogoType(parsedSettings.logoType);
        if (parsedSettings.logoImageUrl) setLogoImageUrl(parsedSettings.logoImageUrl);
      } catch (e) {}
    }
  }, []);

  const saveTemplates = (newTemplates: PrintTemplateConfig[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('storm_print_templates', JSON.stringify(newTemplates));
  };

  const handleUpdateActiveTemplate = (updates: Partial<PrintTemplateConfig>) => {
    const updated = templates.map(t => t.id === activeTemplateId ? { ...t, ...updates } : t);
    saveTemplates(updated);
  };

  const handleCreateNew = () => {
    const newId = `termal-${Date.now()}`;
    const newTemplate: PrintTemplateConfig = {
      id: newId,
      name: `Özel Termal Fiş ${templates.length + 1}`,
      type: 'satis',
      documentTitle: 'SATIŞ FİŞİ',
      paperSize: 'termal_80',
      rollWidth: '80mm',
      fontFamily: 'courier',
      fontSize: 'sm',
      density: 'normal',
      lineStyle: 'dashed',
      feedLines: 3,

      showLogo: true,
      logoAlignment: 'center',
      showCompanyName: true,
      companyNameSize: 'large',
      showCompanyAddress: true,
      showBranchCashier: true,
      showTaxInfo: true,
      welcomeNote: 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz',

      showReceiptNo: true,
      showDateTime: true,
      showPersonnelName: true,
      showCustomerName: true,
      showCustomerTaxAddress: false,
      showTableOrderType: false,

      itemFormat: 'double_line',
      showItemCode: false,
      showDiscountRate: true,
      showVatRate: true,
      showUnitPrice: true,
      showRowNumbers: true,

      showSubtotal: true,
      showTotalDiscount: true,
      showTotalVat: true,
      showGrandTotal: true,
      showPaymentMethodBreakdown: true,
      showCashPaidAndChange: true,
      showCustomerBalance: false,

      showFooter: true,
      customTextContent: 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.',
      refundPolicyNote: '7 gün içinde fiş ile değişim yapılır.',
      showBarcode: true,
      barcodeFormat: 'CODE128',
      showQrCode: false,
      showWifiSocial: false
    };

    saveTemplates([...templates, newTemplate]);
    setActiveTemplateId(newId);
  };

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) return;
    const filtered = templates.filter(t => t.id !== activeTemplateId);
    saveTemplates(filtered);
    setActiveTemplateId(filtered[0].id);
  };

  const handleSetDefault = () => {
    const updated = templates.map(t => ({
      ...t,
      isDefault: t.id === activeTemplateId
    }));
    saveTemplates(updated);
    showToast();
  };

  const handleLoadPreset = (presetKey: string) => {
    const found = DEFAULT_THERMAL_TEMPLATES.find(p => p.id === presetKey);
    if (!found) return;

    handleUpdateActiveTemplate({
      ...found,
      id: activeTemplateId,
      name: activeTemplate?.name || found.name
    });
    showToast();
  };

  const handleResetToDefaults = () => {
    saveTemplates(DEFAULT_THERMAL_TEMPLATES);
    setActiveTemplateId(DEFAULT_THERMAL_TEMPLATES[0].id);
    showToast();
  };

  const showToast = () => {
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  // Direct Test Receipt Printing via Browser Print Window formatted for Thermal Printer
  const handleTestPrint = () => {
    if (!previewContainerRef.current) return;

    const is58 = activeTemplate.paperSize === 'termal_58' || activeTemplate.rollWidth === '58mm';

    printThermalReceipt({
      title: `Termal Fiş Test Çıktısı - ${activeTemplate.name}`,
      htmlContent: previewContainerRef.current.innerHTML,
      paperWidthMm: is58 ? '58mm' : '80mm',
      fontFamily: activeTemplate.fontFamily,
      fontSize: activeTemplate.fontSize,
    });
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  return (
    <div className="flex flex-col gap-4 min-h-[680px]">
      {/* SUCCESS TOAST */}
      {saveSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={18} />
          <span>Şablon başarıyla kaydedildi ve varsayılan olarak ayarlandı!</span>
        </div>
      )}

      {/* TOP HEADER TOOLBAR */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
                Termal Rulo Fiş Tasarımcısı
                {activeTemplate?.isDefault && (
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold px-2 py-0.5 rounded-full">
                    Varsayılan Fiş
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                80mm & 58mm Termal POS Fiş Yazıcıları Uyumlu (Epson, Bixolon, Xprinter vb.)
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleTestPrint(); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer"
          >
            <Printer size={15} className="text-teal-400" />
            <span>Test Fişi Yazdır</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleSetDefault(); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Save size={15} />
            <span>Varsayılan Yap & Kaydet</span>
          </button>
        </div>
      </div>

      {/* PRESETS SELECTOR BAR */}
      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-bold text-[11px] whitespace-nowrap flex items-center gap-1.5 shrink-0 px-1">
          <Sparkles size={14} className="text-amber-400" /> Hızlı Şablon Yükle:
        </span>
        <div className="flex flex-wrap gap-2 overflow-x-auto custom-scrollbar pb-0.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleLoadPreset('termal-80mm-market'); }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white/90 rounded-lg border border-white/10 font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            🛒 Market & POS (80mm)
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleLoadPreset('termal-58mm-mobil'); }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white/90 rounded-lg border border-white/10 font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            ⚡ Mobil POS (58mm)
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleLoadPreset('termal-80mm-restoran'); }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white/90 rounded-lg border border-white/10 font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            🍽️ Restoran Adisyon (80mm)
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleResetToDefaults(); }}
            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 font-bold text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
            title="Sıfırla"
          >
            <RotateCcw size={12} /> Fabrika Ayarları
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT SETTINGS (50%), RIGHT REALISTIC THERMAL PREVIEW (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">
        {/* LEFT COLUMN: SETTINGS PANEL */}
        <div className="lg:col-span-6 h-[680px] flex flex-col">
          <TemplateSettingsPanel
            activeTemplateId={activeTemplateId}
            setActiveTemplateId={setActiveTemplateId}
            templates={templates}
            handleCreateNew={handleCreateNew}
            activeTemplate={activeTemplate}
            handleUpdateActiveTemplate={handleUpdateActiveTemplate}
            handleDeleteTemplate={handleDeleteTemplate}
            sampleDataType={sampleDataType}
            setSampleDataType={setSampleDataType}
          />
        </div>

        {/* RIGHT COLUMN: REALISTIC THERMAL PAPER ROLL PREVIEW */}
        <div className="lg:col-span-6 bg-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-2xl h-[680px]">
          {/* WATERMARK BACKGROUND DECORATION */}
          <div className="absolute top-3.5 left-4 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-700/60 shadow">
            <Receipt size={15} className="text-teal-400" />
            <span>Canlı Termal Fiş Önizlemesi ({activeTemplate?.rollWidth || '80mm'})</span>
          </div>

          {/* THERMAL ROLL CONTAINER */}
          <div className="flex-1 w-full flex items-center justify-center overflow-y-auto mt-10 mb-4 custom-scrollbar p-2" ref={previewContainerRef}>
            {activeTemplate && (
              <TemplatePreviews
                activeTemplate={activeTemplate}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                logoType={logoType}
                logoImageUrl={logoImageUrl}
                sampleDataType={sampleDataType}
              />
            )}
          </div>

          {/* FOOTER INFO STRIP */}
          <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Sanal Termal Rulo Simülatörü</span>
            <span className="font-mono text-teal-400 font-black bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              {activeTemplate?.paperSize === 'termal_58' ? '58mm Dar Rulo' : '80mm Standart Rulo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
