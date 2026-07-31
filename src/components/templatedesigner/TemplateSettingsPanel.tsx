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
  ChevronUp
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
    metadata: true,
    items: true,
    totals: true,
    footer: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-2xl border border-white/10 shadow-xl overflow-hidden h-full">
      {/* HEADER BAR: TEMPLATE SELECTOR & ACTIONS */}
      <div className="p-3.5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="w-full max-w-[220px] px-3 py-1.5 bg-slate-900 border border-white/15 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <Plus size={14} /> Yeni Termal Fiş
        </button>
      </div>

      {/* SAMPLE DATA SELECTOR STRIP */}
      <div className="px-3.5 py-2 bg-slate-950/60 border-b border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-300 font-bold flex items-center gap-1.5 text-[11px]">
          <Sparkles size={13} className="text-amber-400" />
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                sampleDataType === type.id
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN FORM ACCORDION CONTENT */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-xs">

        {/* 1. RULO & YAZICI YAPILANDIRMASI */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('printer'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Printer size={15} /> 1. Rulo & Termal Yazıcı Ayarları
            </span>
            {openSections.printer ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.printer && (
            <div className="p-3.5 space-y-3 border-t border-slate-800 bg-slate-900/80">
              {/* Template Name */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Şablon İsmi</label>
                <input 
                  type="text" 
                  value={activeTemplate.name}
                  onChange={(e) => handleUpdateActiveTemplate({ name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Roll Width Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Termal Rulo Genişliği</label>
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
                    <option value="80mm">80mm (Standart POS)</option>
                    <option value="58mm">58mm (Mobil / Dar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Yazı Yoğunluğu</label>
                  <select 
                    value={activeTemplate.density || 'normal'}
                    onChange={(e) => handleUpdateActiveTemplate({ density: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="normal">Normal Termal</option>
                    <option value="bold_dark">Koyu Termal (Yüksek Kontrast)</option>
                  </select>
                </div>
              </div>

              {/* Line Style & Feed Lines */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Ayraç Çizgisi Stili</label>
                  <select 
                    value={activeTemplate.lineStyle || 'dashed'}
                    onChange={(e) => handleUpdateActiveTemplate({ lineStyle: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="dashed">- - - (Kesikli Çizgi)</option>
                    <option value="double">=== (Çift Çizgi)</option>
                    <option value="solid">--- (Düz Çizgi)</option>
                    <option value="dotted">... (Noktalı Çizgi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Kesim Boşluğu</label>
                  <select 
                    value={activeTemplate.feedLines || 3}
                    onChange={(e) => handleUpdateActiveTemplate({ feedLines: parseInt(e.target.value) || 3 })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value={1}>1 Satır</option>
                    <option value={2}>2 Satır</option>
                    <option value={3}>3 Satır (Varsayılan)</option>
                    <option value={5}>5 Satır</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. BAŞLIK & İŞLETME BİLGİLERİ */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('header'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Building2 size={15} /> 2. Başlık & İşletme Bilgileri
            </span>
            {openSections.header ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.header && (
            <div className="p-3.5 space-y-2.5 border-t border-slate-800 bg-slate-900/80">
              <SwitchRow 
                label="Firma Logosu Basılsın" 
                checked={activeTemplate.showLogo} 
                onChange={(v) => handleUpdateActiveTemplate({ showLogo: v })} 
              />

              {activeTemplate.showLogo && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Logo Hizalama</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleUpdateActiveTemplate({ logoAlignment: align as any }); }}
                        className={`py-1.5 text-[11px] font-extrabold uppercase rounded-lg border cursor-pointer transition-all ${
                          (activeTemplate.logoAlignment || 'center') === align
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {align === 'left' ? 'Sol' : align === 'center' ? 'Orta' : 'Sağ'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <SwitchRow 
                label="İşletme Adı / Ünvanı" 
                checked={activeTemplate.showCompanyName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCompanyName: v })} 
              />

              <SwitchRow 
                label="Şube & Kasa Bilgisi (Merkez / POS-01)" 
                checked={activeTemplate.showBranchCashier !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showBranchCashier: v })} 
              />

              <SwitchRow 
                label="Adres & İletişim Bilgileri" 
                checked={activeTemplate.showCompanyAddress} 
                onChange={(v) => handleUpdateActiveTemplate({ showCompanyAddress: v })} 
              />

              <SwitchRow 
                label="Vergi Dairesi & VKN" 
                checked={activeTemplate.showTaxInfo !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTaxInfo: v })} 
              />

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Fiş Belge Başlığı</label>
                <input 
                  type="text" 
                  value={activeTemplate.documentTitle || 'POS SATIŞ FİŞİ'}
                  onChange={(e) => handleUpdateActiveTemplate({ documentTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Örn: POS SATIŞ FİŞİ"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Karşılama / Hoşgeldiniz Notu</label>
                <input 
                  type="text" 
                  value={activeTemplate.welcomeNote || ''}
                  onChange={(e) => handleUpdateActiveTemplate({ welcomeNote: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Örn: Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. FİŞ, MÜŞTERİ & KASİYER BİLGİLERİ */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('metadata'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <UserCheck size={15} /> 3. Fiş, Müşteri & Kasiyer
            </span>
            {openSections.metadata ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.metadata && (
            <div className="p-3.5 space-y-2.5 border-t border-slate-800 bg-slate-900/80">
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
                label="Kasiyer / Personel Adı" 
                checked={activeTemplate.showPersonnelName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showPersonnelName: v })} 
              />
              <SwitchRow 
                label="Müşteri / Cari Adı" 
                checked={activeTemplate.showCustomerName !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCustomerName: v })} 
              />
              <SwitchRow 
                label="Müşteri Vergi & Adres Detayı" 
                checked={activeTemplate.showCustomerTaxAddress || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCustomerTaxAddress: v })} 
              />
              <SwitchRow 
                label="Masa No / Paket Servis Etiketi" 
                checked={activeTemplate.showTableOrderType || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTableOrderType: v })} 
              />
            </div>
          )}
        </div>

        {/* 4. ÜRÜN KALEMLERİ & TABLO DÜZENİ */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('items'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <ShoppingBag size={15} /> 4. Ürün Kalemleri & Tablo Düzeni
            </span>
            {openSections.items ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.items && (
            <div className="p-3.5 space-y-3 border-t border-slate-800 bg-slate-900/80">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Satır Görünüm Formatı</label>
                <select 
                  value={activeTemplate.itemFormat || 'double_line'}
                  onChange={(e) => handleUpdateActiveTemplate({ itemFormat: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="double_line">İki Satırlı Termal Standart (1. Adı, 2. Mik x Fiyat)</option>
                  <option value="single_line">Tek Satırlı Sıkıştırılmış Tablo</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  İki satırlı düzen, uzun ürün adlarının dar termal rulo kağıtlarında taşmasını engeller.
                </p>
              </div>

              <SwitchRow 
                label="Ürün / Stok Kodu Satırı" 
                checked={activeTemplate.showItemCode || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showItemCode: v })} 
              />
              <SwitchRow 
                label="İskonto / İndirim Detayı" 
                checked={activeTemplate.showDiscountRate !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showDiscountRate: v })} 
              />
              <SwitchRow 
                label="KDV Oranı Satırı (%10, %20 vb.)" 
                checked={activeTemplate.showVatRate !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showVatRate: v })} 
              />
              <SwitchRow 
                label="Sıra Numarası (1., 2., 3...)" 
                checked={activeTemplate.showRowNumbers || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showRowNumbers: v })} 
              />
            </div>
          )}
        </div>

        {/* 5. DİP TOPLAMLAR & ÖDEME */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('totals'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <Receipt size={15} /> 5. Dip Toplamlar & Ödeme
            </span>
            {openSections.totals ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.totals && (
            <div className="p-3.5 space-y-2.5 border-t border-slate-800 bg-slate-900/80">
              <SwitchRow 
                label="Ara Toplam (Matrah)" 
                checked={activeTemplate.showSubtotal !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showSubtotal: v })} 
              />
              <SwitchRow 
                label="Toplam İskonto Satırı" 
                checked={activeTemplate.showTotalDiscount !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTotalDiscount: v })} 
              />
              <SwitchRow 
                label="Toplam KDV Satırı" 
                checked={activeTemplate.showTotalVat !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showTotalVat: v })} 
              />
              <SwitchRow 
                label="Ödeme Türleri Dağılımı (Nakit, POS)" 
                checked={activeTemplate.showPaymentMethodBreakdown !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showPaymentMethodBreakdown: v })} 
              />
              <SwitchRow 
                label="Verilen Nakit & Para Üstü" 
                checked={activeTemplate.showCashPaidAndChange !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCashPaidAndChange: v })} 
              />
              <SwitchRow 
                label="Müşteri Bakiyesi / Güncel Borcu" 
                checked={activeTemplate.showCustomerBalance || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showCustomerBalance: v })} 
              />
            </div>
          )}
        </div>

        {/* 6. ALT BİLGİ, BARKOD & QR KOD */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleSection('footer'); }}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 hover:bg-slate-950 flex items-center justify-between text-white font-bold text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-teal-400 font-extrabold">
              <QrCode size={15} /> 6. Alt Bilgi, Barkod & QR Kod
            </span>
            {openSections.footer ? <ChevronUp size={14} className="text-teal-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {openSections.footer && (
            <div className="p-3.5 space-y-3 border-t border-slate-800 bg-slate-900/80">
              <SwitchRow 
                label="Fiş Altı Notu Gösterilsin" 
                checked={activeTemplate.showFooter !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showFooter: v })} 
              />

              {activeTemplate.showFooter !== false && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Fiş Altı Notu</label>
                  <input 
                    type="text" 
                    value={activeTemplate.customTextContent || 'MALİ DEĞERİ YOKTUR. BİLGİ FİŞİDİR.'}
                    onChange={(e) => handleUpdateActiveTemplate({ customTextContent: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">İade / Değişim Politikası Notu</label>
                <input 
                  type="text" 
                  value={activeTemplate.refundPolicyNote || ''}
                  onChange={(e) => handleUpdateActiveTemplate({ refundPolicyNote: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Örn: 7 gün içinde fiş ile değişim yapılır."
                />
              </div>

              <SwitchRow 
                label="Fiş Barkodu (CODE128 - İadelerde Okutmak İçin)" 
                checked={activeTemplate.showBarcode !== false} 
                onChange={(v) => handleUpdateActiveTemplate({ showBarcode: v })} 
              />

              <SwitchRow 
                label="Doğrulama / Web QR Kodu" 
                checked={activeTemplate.showQrCode || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showQrCode: v })} 
              />

              {activeTemplate.showQrCode && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">QR Kod Linki / URL</label>
                  <input 
                    type="text" 
                    value={activeTemplate.qrCodeUrl || ''}
                    onChange={(e) => handleUpdateActiveTemplate({ qrCodeUrl: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="https://isletmeniz.com/fis"
                  />
                </div>
              )}

              <SwitchRow 
                label="Wi-Fi / Sosyal Medya Bilgisi" 
                checked={activeTemplate.showWifiSocial || false} 
                onChange={(v) => handleUpdateActiveTemplate({ showWifiSocial: v })} 
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
