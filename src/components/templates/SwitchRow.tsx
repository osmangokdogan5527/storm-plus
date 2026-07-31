import React from 'react';

export function SwitchRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
      className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer transition-colors select-none text-left focus:outline-none focus:ring-1 focus:ring-teal-500/50"
    >
      <span className="text-xs text-slate-200 font-semibold">{label}</span>
      <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-700'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </div>
    </button>
  );
}

