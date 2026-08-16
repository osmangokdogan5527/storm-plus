import React, { useState } from 'react';
import { 
  Printer, 
  Building2, 
  UserCheck, 
  ShoppingBag, 
  Receipt, 
  QrCode, 
  Plus, 
  Trash2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { SwitchRow } from '../templates/SwitchRow';
import { PrintTemplateConfig } from '../TemplateDesignerView';

interface TemplateSettingsPanelProps {
  activeTemplateId: string;
  setActiveTemplateId: (id: string) => void;
  templates: PrintTemplateConfig[];
  handleCreateNew: () => void;
  activeTemplate: PrintTemplateConfig;
  handleUpdateActiveTemplate: (updates: Partial<PrintTemplateConfig>) => void;
  handleDeleteTemplate: () => void;
  sampleDataType: 'market' | 'restaurant' | 'online' | 'tahsilat';
  setSampleDataType: (type: 'market' | 'restaurant' | 'online' | 'tahsilat') => void;
}

export function TemplateSettingsPanel({
  activeTemplateId,
  setActiveTemplateId,
  templates,
  handleCreateNew,
  activeTemplate,
  handleUpdateActiveTemplate,
  handleDeleteTemplate,
  sampleDataType,
  setSampleDataType,
}: TemplateSettingsPanelProps) {
  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    printer: true,
    header: true,
    metadata: false,
    items: false,
    totals: false,
    footer: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Quick Presets
  const applyPreset = (presetType: 'market' | 'restaurant' | 'minimal') => {
    if (presetType === 'market') {
      handleUpdateActiveTemplate({
        rollWidth: '80mm',
        paperSize: 'termal_80',
        density: 'bold_dark',
        itemFormat: 'double_line',
        documentTitle: 'POS SATIŞ FİŞİ',
        showLogo: false,
        showCompanyName: true,
        companyNameSize: 'large',
        showCompanyAddress: true,
        showBranchCashier: true,
        showReceiptNo: true,
        showDateTime: true,
        showPersonnelName: true,
        showCustomerName: true,
        showDiscountRate: true,
        showVatRate: true,
        showSubtotal: true,
        showTotalDiscount: true,
        showTotalVat: true,
        showPaymentMethodBreakdown: true,
        showCashPaidAndChange: true,
        showFooter: true,
        customTextContent: 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.',
        showBarcode: true,
        showQrCode: false,
      });
      setSampleDataType('market');
    } else if (presetType === 'restaurant') {
      handleUpdateActiveTemplate({
        rollWidth: '80mm',
        paperSize: 'termal_80',
        density: 'bold_dark',
        itemFormat: 'double_line',
        documentTitle: 'ADİSYON / HESAP FİŞİ',
        showLogo: false,
        showCompanyName: true,
        companyNameSize: 'large',
        showCompanyAddress: false,
        showBranchCashier: true,
        showTableOrderType: true,
        showPersonnelName: true,
        showCustomerName: false,
        showSubtotal: true,
        showTotalDiscount: false,
        showTotalVat: false,
        showPaymentMethodBreakdown: true,
        showCashPaidAndChange: false,
        showFooter: true,
        customTextContent: 'AFİYET OLSUN • BİLGİ VE ADİSYON FİŞİDİR',
        showBarcode: false,
        showQrCode: false,
      });
      setSampleDataType('restaurant');
    } else if (presetType === 'minimal') {
      handleUpdateActiveTemplate({
        rollWidth: '58mm',
        paperSize: 'termal_58',
        density: 'bold_dark',
        itemFormat: 'single_line',
        documentTitle: 'BİLGİ FİŞİ',
        showLogo: false,
        showCompanyName: true,
        companyNameSize: 'normal',
        showCompanyAddress: false,
        showBranchCashier: false,
        showReceiptNo: true,
        showDateTime: true,
        showPersonnelName: true,
        showCustomerName: false,
        showSubtotal: false,
        showTotalDiscount: false,
        showTotalVat: false,
        showPaymentMethodBreakdown: true,
        showCashPaidAndChange: false,
        showFooter: true,
        customTextContent: 'BİLGİ FİŞİDİR',
        showBarcode: false,
        showQrCode: false,
      });
      setSampleDataType('market');
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-2xl border border-white/10 shadow-xl overflow-hidden h-full">
      {/* HEADER BAR: TEMPLATE SELECTOR & ACTIONS */}
      <div className="p-3 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="w-full max-w-[210px] px-3 py-1.5 bg-slate-900 border border-white/15 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.rollWidth || (t.paperSize === 'termal_58' ? '58mm' : '80mm')})
              </option>
            ))}
          </select>

          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleDeleteTemplate(); }}
            disabled={templates.length <= 1}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Şablonu Sil"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); handleCreateNew(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} /> Yeni Şablon
        </button>
      </div>

      {/* QUICK STYLES PRESETS STRIP */}
      <div className="p-2.5 bg-slate-950/80 border-b border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Zap size={13} className="text-amber-400" />
            Hızlı Şablon Presetleri:
          </span>
          <span className="text-[10px] text-slate-400">Tek tıkla düzenle</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); applyPreset('market'); }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-teal-500/20 border border-slate-700 hover:border-teal-500/50 rounded-lg text-white font-bold text-[11px] text-center transition-all cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span> Market Fişi</span>
            <span className="text-[9px] font-normal text-slate-400">80mm Barkodlu</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); applyPreset('restaurant'); }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-teal-500/20 border border-slate-700 hover:border-teal-500/50 rounded-lg text-white font-bold text-[11px] text-center transition-all cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span> Restoran / Adisyon</span>
            <span className="text-[9px] font-normal text-slate-400">80mm Masalı</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); applyPreset('minimal'); }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-teal-500/20 border border-slate-700 hover:border-teal-500/50 rounded-lg text-white font-bold text-[11px] text-center transition-all cursor-pointer flex flex-col items-center gap-0.5"
          >
            <span> Sade & Dar</span>
            <span className="text-[9px] font-normal text-slate-400">58mm Mobil</span>
          </button>
        </div>
      </div>

      {/* SAMPLE DATA SELECTOR STRIP */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
          <Sparkles size={12} className="text-teal-400" />
          Önizleme Verisi:
        </span>
        <div className="flex gap-1">
          {[
            { id: 'market', label: 'Market' },
            { id: 'restaurant', label: 'Restoran' },
            { id: 'online', label: 'Online' },
            { id: 'tahsilat', label: 'Tahsilat' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={(e) => { e.preventDefault(); setSampleDataType(type.id as any); }}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                sampleDataType === type.id
                  ? 'bg-teal-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN FORM ACCORDION CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-xs">

        {/* 1. RULO & YAZICI YAPILANDIRMASI */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('printer'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Printer size={15} /> 1. Kağıt & Yazıcı Ayarları
            </span>
            {openSections.printer ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.printer && (
            <div className="p-3 space-y-2.5 border-t border-slate-800/80 bg-slate-900/60">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 uppercase mb-1">Şablon İsmi</label>
                <input 
                  type="text" 
                  value={activeTemplate.name}
                  onChange={(e) => handleUpdateActiveTemplate({ name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-300 uppercase mb-1">Rulo Genişliği</label>
                  <select 
                    value={activeTemplate.rollWidth || (activeTemplate.paperSize === 'termal_58' ? '58mm' : '80mm')}
                    onChange={(e) => {
                      const width = e.target.value as '80mm' | '58mm';
                      handleUpdateActiveTemplate({ 
                        rollWidth: width,
                        paperSize: width === '58mm' ? 'termal_58' : 'termal_80'
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="80mm">80mm (Standart)</option>
                    <option value="58mm">58mm (Mobil/Dar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-300 uppercase mb-1">Koyu Yazı Modu</label>
                  <select 
                    value={activeTemplate.density || 'bold_dark'}
                    onChange={(e) => handleUpdateActiveTemplate({ density: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="bold_dark">Koyu / Ekstra Net</option>
                    <option value="normal">Standart</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. BAŞLIK & İŞLETME BİLGİLERİ */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('header'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Building2 size={15} /> 2. Başlık & Firma Bilgileri
            </span>
            {openSections.header ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.header && (
            <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-900/60">
              <SwitchRow 
                label="Firma İsmi Basılsın" 
                checked={activeTemplate.showCompanyName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCompanyName: v })} 
              />

              <SwitchRow 
                label="Adres & Telefon Bilgisi" 
                checked={activeTemplate.showCompanyAddress} 
                onChange={(v) => handleUpdateActiveTemplate({ showCompanyAddress: v })} 
              />

              <SwitchRow 
                label="Şube & Kasiyer Başlığı" 
                checked={activeTemplate.showBranchCashier !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showBranchCashier: v })} 
              />

              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 uppercase mb-1">Belge Başlığı</label>
                <input 
                  type="text" 
                  value={activeTemplate.documentTitle || 'POS SATIŞ FİŞİ'}
                  onChange={(e) => handleUpdateActiveTemplate({ documentTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Örn: POS SATIŞ FİŞİ"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. FİŞ, MÜŞTERİ & KASİYER BİLGİLERİ */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('metadata'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <UserCheck size={15} /> 3. Fiş, Tarih & Müşteri
            </span>
            {openSections.metadata ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.metadata && (
            <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-900/60">
              <SwitchRow 
                label="Fiş Numarası" 
                checked={activeTemplate.showReceiptNo !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showReceiptNo: v })} 
              />
              <SwitchRow 
                label="Tarih & Saat" 
                checked={activeTemplate.showDateTime !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showDateTime: v })} 
              />
              <SwitchRow 
                label="Kasiyer İsmi" 
                checked={activeTemplate.showPersonnelName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showPersonnelName: v })} 
              />
              <SwitchRow 
                label="Müşteri Adı" 
                checked={activeTemplate.showCustomerName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCustomerName: v })} 
              />
            </div>
          )}
        </div>

        {/* 4. ÜRÜN KALEMLERİ & TABLO DÜZENİ */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('items'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <ShoppingBag size={15} /> 4. Ürün Listesi Formatı
            </span>
            {openSections.items ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.items && (
            <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-900/60">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-300 uppercase mb-1">Satır Düzeni</label>
                <select 
                  value={activeTemplate.itemFormat || 'double_line'}
                  onChange={(e) => handleUpdateActiveTemplate({ itemFormat: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="double_line">İki Satırlı Termal Standart (1. Adı, 2. Mik x Fiyat)</option>
                  <option value="single_line">Tek Satırlı Sıkıştırılmış Tablo</option>
                </select>
              </div>

              <SwitchRow 
                label="İskonto Detayı" 
                checked={activeTemplate.showDiscountRate !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showDiscountRate: v })} 
              />
              <SwitchRow 
                label="KDV Oranı" 
                checked={activeTemplate.showVatRate !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showVatRate: v })} 
              />
            </div>
          )}
        </div>

        {/* 5. DİP TOPLAMLAR & ÖDEME */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('totals'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Receipt size={15} /> 5. Dip Toplamlar & Ödeme
            </span>
            {openSections.totals ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.totals && (
            <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-900/60">
              <SwitchRow 
                label="Ara Toplam" 
                checked={activeTemplate.showSubtotal !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showSubtotal: v })} 
              />
              <SwitchRow 
                label="Toplam İskonto" 
                checked={activeTemplate.showTotalDiscount !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTotalDiscount: v })} 
              />
              <SwitchRow 
                label="Toplam KDV" 
                checked={activeTemplate.showTotalVat !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTotalVat: v })} 
              />
              <SwitchRow 
                label="Ödeme Dağılımı (Nakit/Kart)" 
                checked={activeTemplate.showPaymentMethodBreakdown !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showPaymentMethodBreakdown: v })} 
              />
            </div>
          )}
        </div>

        {/* 6. ALT BİLGİ & BARKOD */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('footer'); }}
            className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <QrCode size={15} /> 6. Alt Bilgi & Barkod
            </span>
            {openSections.footer ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.footer && (
            <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-900/60">
              <SwitchRow 
                label="Fiş Altı Notu" 
                checked={activeTemplate.showFooter !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showFooter: v })} 
              />

              {activeTemplate.showFooter !== false && (
                <div>
                  <input 
                    type="text" 
                    value={activeTemplate.customTextContent || 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.'}
                    onChange={(e) => handleUpdateActiveTemplate({ customTextContent: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                    placeholder="Fiş Altı Yazısı..."
                  />
                </div>
              )}

              <SwitchRow 
                label="Fiş Barkodu (İadeler İçin)" 
                checked={activeTemplate.showBarcode !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showBarcode: v })} 
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
