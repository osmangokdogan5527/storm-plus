import React, { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';

interface PosNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialValue: string | number;
  onConfirm: (value: number) => void;
  allowDecimal?: boolean;
}

export const PosNumpadModal: React.FC<PosNumpadModalProps> = ({
  isOpen,
  onClose,
  title,
  initialValue,
  onConfirm,
  allowDecimal = true
}) => {
  const [value, setValue] = useState(String(initialValue || ''));

  useEffect(() => {
    if (isOpen) {
      setValue(String(initialValue || ''));
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setValue('');
    } else if (key === 'BACKSPACE') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (allowDecimal && !value.includes('.')) {
        setValue(prev => prev + (prev === '' ? '0.' : '.'));
      }
    } else {
      if (value === '0' && key !== '.') {
        setValue(key);
      } else {
        setValue(prev => prev + key);
      }
    }
  };

  const handleConfirm = () => {
    const num = Number(value);
    if (!isNaN(num)) {
      onConfirm(num);
    }
    onClose();
  };

  const buttonClass = "w-full h-16 sm:h-20 bg-slate-800 hover:bg-slate-700 text-white text-2xl font-bold rounded-2xl transition-colors active:scale-95 touch-manipulation flex items-center justify-center border-2 border-slate-700 hover:border-teal-400";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-950">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 bg-slate-900 border-b border-slate-800">
          <div className="bg-slate-950 border-2 border-teal-500/30 rounded-2xl p-4 flex items-center justify-end overflow-hidden shadow-inner h-20">
            <span className="text-4xl font-black text-teal-400 font-mono tracking-wider truncate">
              {value || '0'}
            </span>
          </div>
        </div>

        {/* Numpad */}
        <div className="p-4 sm:p-6 bg-slate-950 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button key={num} onClick={() => handleKeyPress(num)} className={buttonClass}>
              {num}
            </button>
          ))}
          <button onClick={() => handleKeyPress(allowDecimal ? '.' : '')} className={buttonClass + (allowDecimal ? '' : ' opacity-50 cursor-not-allowed pointer-events-none')}>
            {allowDecimal ? ',' : ''}
          </button>
          <button onClick={() => handleKeyPress('0')} className={buttonClass}>
            0
          </button>
          <button onClick={() => handleKeyPress('BACKSPACE')} className={buttonClass + " text-red-400 hover:text-red-300"}>
            <Delete size={28} />
          </button>
          
          <button onClick={() => handleKeyPress('C')} className="col-span-1 h-16 bg-slate-800 hover:bg-slate-700 text-red-400 text-xl font-bold rounded-2xl border-2 border-slate-700">
            TEMİZLE
          </button>
          <button onClick={handleConfirm} className="col-span-2 h-16 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xl font-black rounded-2xl shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all active:scale-95">
            ONAYLA
          </button>
        </div>
      </div>
    </div>
  );
};
