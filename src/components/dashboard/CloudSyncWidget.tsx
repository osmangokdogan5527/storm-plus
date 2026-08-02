import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface CloudSyncWidgetProps {
  isOnline: boolean;
  lastSyncTime?: Date;
}

export function CloudSyncWidget({ isOnline, lastSyncTime }: CloudSyncWidgetProps) {
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 shadow-lg flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="text-teal-400" size={20} />
          ) : (
            <CloudOff className="text-rose-400" size={20} />
          )}
          <h2 className="text-base font-semibold text-slate-100">Bulut Durumu</h2>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
          isOnline 
            ? 'bg-teal-400/10 text-teal-400 border border-teal-400/20' 
            : 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
        }`}>
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Çevrimiçi
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Çevrimdışı
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {isOnline ? (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <CheckCircle className="text-teal-400 mb-2" size={28} />
            <span className="text-sm font-semibold text-slate-200">Bağlantı Kuruldu & Senkronize</span>
            <span className="text-xs text-slate-400 mt-1">Verileriniz anlık olarak bulutta yedeklenmektedir.</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 bg-rose-900/10 rounded-xl border border-rose-500/20">
            <RefreshCw className="text-rose-400 mb-2" size={28} />
            <span className="text-sm font-semibold text-rose-300">Bağlantı Bekleniyor</span>
            <span className="text-xs text-rose-400/70 mt-1 text-center">İnternet bağlantısı sağlandığında değişiklikler buluta aktarılacaktır.</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs p-3 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={14} />
            <span>Son Senkronizasyon:</span>
          </div>
          <span className="font-semibold text-slate-200">
            {isOnline ? 'Şimdi (Canlı)' : (lastSyncTime ? lastSyncTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Bilinmiyor')}
          </span>
        </div>
      </div>
    </div>
  );
}
