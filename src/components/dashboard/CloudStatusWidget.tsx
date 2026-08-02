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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-5 h-full flex flex-col relative overflow-hidden">
      {renderWidgetControls()}
      
      {/* BACKGROUND ACCENT */}
      <div
        className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${
          isOnline ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bulut Senkronizasyonu</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Veri Yedekleme ve Bağlantı Durumu</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10 gap-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
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
            <span className={`text-sm font-bold ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isOnline ? 'Çevrimiçi Bağlı' : 'Çevrimdışı'}
            </span>
          </div>
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-500/50" /> : <WifiOff className="w-4 h-4 text-rose-500/50" />}
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${isOnline ? 'animate-spin-slow' : ''}`} />
            <span className="text-xs font-semibold">Son Senkronizasyon</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5">
            {timeAgo}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
           <CheckCircle className="w-3 h-3" />
           {isOnline ? 'Tüm veriler güvende' : 'Bağlantı bekleniyor...'}
        </div>
        <span className="text-[10px] font-mono bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
          {isOnline ? 'AKTİF' : 'BEKLEMEDE'}
        </span>
      </div>
    </div>
  );
}
