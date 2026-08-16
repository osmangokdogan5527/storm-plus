import React, { useState } from 'react';
import { PosPlatformConfig } from '../../types/pos';
import { Settings, Percent, Plus, Trash2, CheckCircle, X } from 'lucide-react';

interface PosPlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: PosPlatformConfig[];
  onSavePlatforms: (updated: PosPlatformConfig[]) => void;
}

export const PosPlatformSettingsModal: React.FC<PosPlatformSettingsModalProps> = ({
  isOpen,
  onClose,
  platforms = [],
  onSavePlatforms,
}) => {
  const [localPlatforms, setLocalPlatforms] = useState<PosPlatformConfig[]>(() =>
    Array.isArray(platforms) ? platforms : []
  );
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newCommissionRate, setNewCommissionRate] = useState<number | ''>(38);

  React.useEffect(() => {
    if (Array.isArray(platforms)) {
      setLocalPlatforms(platforms);
    }
  }, [platforms, isOpen]);

  if (!isOpen) return null;
  const safeLocalPlatforms = Array.isArray(localPlatforms) ? localPlatforms : [];

  const handleRateChange = (id: string, newRate: number) => {
    setLocalPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, commissionRate: Math.max(0, Math.min(100, newRate)) } : p))
    );
  };

  const handleToggleActive = (id: string) => {
    setLocalPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleAddCustomPlatform = () => {
    if (!newPlatformName.trim()) return;
    const cleanName = newPlatformName.trim();
    const newId = `custom_${Date.now()}`;
    const newPlat: PosPlatformConfig = {
      id: newId,
      key: newId,
      name: cleanName,
      commissionRate: typeof newCommissionRate === 'number' ? newCommissionRate : 38,
      bgColor: 'bg-indigo-600 hover:bg-indigo-500',
      borderColor: 'border-indigo-400',
      textColor: 'text-white',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-500',
      icon: '🛍️',
      active: true,
    };
    setLocalPlatforms((prev) => [...prev, newPlat]);
    setNewPlatformName('');
    setNewCommissionRate(38);
  };

  const handleDeletePlatform = (id: string) => {
    setLocalPlatforms((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    onSavePlatforms(localPlatforms);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-teal-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* HEADER */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Online Platform Komisyon Ayarları</h3>
              <p className="text-xs text-slate-400 font-medium">
                Sipariş platformlarının komisyon oranlarını ve aktiflik durumlarını yönetin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-black text-teal-300 uppercase tracking-wider block">
              Mevcut Sipariş Platformları (% Komisyon)
            </label>
            <div className="space-y-2">
              {safeLocalPlatforms.map((plat) => (
                <div
                  key={plat.id}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                    plat.active
                      ? 'bg-slate-950/90 border-slate-700'
                      : 'bg-slate-950/40 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{plat.icon}</span>
                    <span className="font-black text-sm text-white truncate">{plat.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                      <Percent size={14} className="text-amber-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={plat.commissionRate}
                        onChange={(e) => handleRateChange(plat.id, Number(e.target.value) || 0)}
                        className="w-14 bg-transparent text-right font-mono font-black text-amber-300 text-sm focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(plat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                        plat.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {plat.active ? 'Aktif' : 'Pasif'}
                    </button>

                    {plat.id.startsWith('custom_') && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlatform(plat.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Platformu Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YENİ PLATFORM EKLEME */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Plus size={16} className="text-teal-400" /> Yeni Özel Platform / Firma Ekle
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Platform Adı (Örn: Paket Servis)"
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
                className="sm:col-span-7 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
              <div className="sm:col-span-3 flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2">
                <span className="text-xs font-black text-amber-400">%</span>
                <input
                  type="number"
                  placeholder="Oran"
                  value={newCommissionRate}
                  onChange={(e) =>
                    setNewCommissionRate(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-transparent px-2 py-2 text-xs font-mono font-black text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomPlatform}
                className="sm:col-span-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs py-2 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle size={16} /> Kaydet ve Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
