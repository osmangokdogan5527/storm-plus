import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface CloudStatusWidgetProps {
  isOnline: boolean;
  lastSyncTime?: Date;
  renderWidgetControls: () => React.ReactNode;
}

export function CloudStatusWidget({
  isOnline,
  lastSyncTime,
  renderWidgetControls,
}: CloudStatusWidgetProps) {
  const [timeAgo, setTimeAgo] = useState<string>('Şimdi');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSyncTime) {
        setTimeAgo('Bilinmiyor');
        return;
      }
      const now = new Date();
      const diff = now.getTime() - lastSyncTime.getTime();
      const diffMinutes = Math.floor(diff / 60000);
      const diffSeconds = Math.floor(diff / 1000);

      if (diffMinutes < 1) {
        setTimeAgo(`${diffSeconds} saniye önce`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} dakika önce`);
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        setTimeAgo(`${diffHours} saat önce`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // update every 10 sec
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <div className={`h-full flex flex-col gap-2.5 group transition-all duration-300`}>
      <div className="flex justify-between items-center dashboard-widget-header px-4 py-2.5 rounded-xl">
        <span className="text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-500)] animate-pulse shadow-[0_0_8px_var(--accent-500)]"></span>
          BULUT SENKRONİZASYONU
        </span>
        {renderWidgetControls()}
      </div>
      <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* BACKGROUND ACCENT */}
        <div
          className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${
            isOnline ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        <div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bulut Senkronizasyonu</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Veri Yedekleme ve Bağlantı Durumu</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10 gap-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <div className="flex items-center gap-3">
                <div className={`relative flex h-3 w-3`}>
                  {isOnline ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  )}
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isOnline ? 'Çevrimiçi Bağlı' : 'Çevrimdışı'}
                </span>
              </div>
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-500/50" /> : <WifiOff className="w-4 h-4 text-rose-500/50" />}
            </div>

            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <div className="flex items-center gap-2 text-white/60">
                <RefreshCw className={`w-4 h-4 ${isOnline ? 'animate-spin-slow' : ''}`} />
                <span className="text-[10px] uppercase tracking-widest font-semibold">Son Senkronizasyon</span>
              </div>
              <span className="text-xs font-bold text-white bg-white/5 px-2 py-1 rounded shadow-sm border border-white/10 font-mono">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-widest">
            <CheckCircle className="w-3 h-3" />
            {isOnline ? 'Tüm veriler güvende' : 'Bağlantı bekleniyor...'}
          </div>
          <span className="text-[10px] font-mono bg-white/5 text-white/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {isOnline ? 'AKTİF' : 'BEKLEMEDE'}
          </span>
        </div>
      </div>
    </div>
  );
}
