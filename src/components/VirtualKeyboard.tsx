import React, { useState, useEffect } from 'react';
import { X, Delete, Type, Hash } from 'lucide-react';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  initialValue?: string;
  title?: string;
  placeholder?: string;
  defaultMode?: 'numpad' | 'keyboard';
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue = '',
  title = 'Klavye',
  placeholder = 'Metin girin...',
  defaultMode = 'numpad'
}) => {
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<'numpad' | 'keyboard'>(defaultMode);
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setIsShift(false);
      setMode(defaultMode);
    }
  }, [isOpen, initialValue, defaultMode]);

  if (!isOpen) return null;

  const isUpper = isShift || isCaps;

  const keyboardRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i', ','],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', '.', '@', '_']
  ];

  const handleKey = (key: string) => {
    setValue(prev => prev + (isUpper ? key.toUpperCase() : key));
    if (isShift) setIsShift(false);
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValue('');
  };

  const handleSpace = () => {
    setValue(prev => prev + ' ');
  };

  const handleConfirm = () => {
    onConfirm(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" style={{ zIndex: 9999 }}>
      <div className={`bg-slate-900 border-t sm:border border-slate-700 w-full sm:rounded-2xl shadow-2xl flex flex-col ${mode === 'keyboard' ? 'max-w-4xl' : 'max-w-md'} mx-auto overflow-hidden animate-slide-up transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {mode === 'keyboard' ? <Type size={20} className="text-teal-400" /> : <Hash size={20} className="text-teal-400" />} 
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Input Display */}
        <div className="p-4 bg-slate-900">
          <div className="bg-slate-950 border-2 border-slate-700 rounded-xl p-4 flex items-center justify-between focus-within:border-teal-500 transition-colors">
            <input
              type="text"
              value={value}
              readOnly
              placeholder={placeholder}
              className="bg-transparent border-none outline-none text-white text-2xl font-bold w-full placeholder:text-slate-600"
            />
            {value && (
              <button onClick={handleClear} className="ml-2 text-rose-500 font-bold px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg shrink-0 transition-colors">
                TEMİZLE
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Layout */}
        <div className="p-2 sm:p-4 bg-slate-800 space-y-2">
          {mode === 'numpad' ? (
            /* Numpad Layout */
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKey(num)}
                    className="h-16 bg-slate-700 hover:bg-slate-600 active:bg-teal-500 text-white rounded-xl text-3xl font-bold transition-colors shadow-sm select-none touch-manipulation"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setMode('keyboard')}
                  className="h-16 bg-slate-600 hover:bg-slate-500 active:bg-teal-500 text-white rounded-xl text-lg font-bold transition-colors shadow-sm select-none touch-manipulation"
                >
                  ABC
                </button>
                <button
                  onClick={() => handleKey('0')}
                  className="h-16 bg-slate-700 hover:bg-slate-600 active:bg-teal-500 text-white rounded-xl text-3xl font-bold transition-colors shadow-sm select-none touch-manipulation"
                >
                  0
                </button>
                <button
                  onClick={() => handleKey('.')}
                  className="h-16 bg-slate-700 hover:bg-slate-600 active:bg-teal-500 text-white rounded-xl text-3xl font-bold transition-colors shadow-sm select-none touch-manipulation"
                >
                  .
                </button>
              </div>
              <div className="col-span-1 flex flex-col gap-2">
                <button
                  onClick={handleBackspace}
                  className="h-16 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded-xl flex items-center justify-center transition-colors shadow-sm select-none touch-manipulation"
                >
                  <Delete size={32} />
                </button>
                <button
                  onClick={handleClear}
                  className="h-16 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm select-none touch-manipulation"
                >
                  SİL
                </button>
                <button
                  onClick={handleConfirm}
                  className="h-[136px] bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-900 rounded-xl text-xl font-black transition-colors shadow-sm select-none touch-manipulation"
                >
                  ONAY
                </button>
              </div>
            </div>
          ) : (
            /* Keyboard Layout */
            <>
              {keyboardRows.map((row, i) => (
                <div key={i} className="flex justify-center gap-1 sm:gap-2">
                  {row.map(key => (
                    <button
                      key={key}
                      onClick={() => handleKey(key)}
                      className="h-12 sm:h-16 flex-1 max-w-[8%] bg-slate-700 hover:bg-slate-600 active:bg-teal-500 text-white rounded-lg sm:rounded-xl text-lg sm:text-2xl font-bold transition-colors shadow-sm select-none touch-manipulation"
                    >
                      {isUpper ? key.toUpperCase() : key}
                    </button>
                  ))}
                </div>
              ))}

              <div className="flex justify-center gap-1 sm:gap-2 pt-1">
                <button
                  onClick={() => setMode('numpad')}
                  className="h-14 sm:h-16 px-3 sm:px-6 rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold transition-colors shadow-sm select-none touch-manipulation bg-slate-600 text-white hover:bg-slate-500"
                >
                  123
                </button>
                <button
                  onClick={() => setIsCaps(!isCaps)}
                  className={`h-14 sm:h-16 px-4 sm:px-6 rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold transition-colors shadow-sm select-none touch-manipulation ${isCaps ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                >
                  CAPS
                </button>
                <button
                  onClick={handleSpace}
                  className="h-14 sm:h-16 flex-grow max-w-md bg-slate-700 hover:bg-slate-600 active:bg-teal-500 text-white rounded-lg sm:rounded-xl text-lg font-bold transition-colors shadow-sm select-none touch-manipulation"
                >
                  BOŞLUK
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-14 sm:h-16 px-4 sm:px-8 bg-slate-700 hover:bg-slate-600 active:bg-rose-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shadow-sm select-none touch-manipulation"
                >
                  <Delete size={28} />
                </button>
                <button
                  onClick={handleConfirm}
                  className="h-14 sm:h-16 px-6 sm:px-10 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-900 rounded-lg sm:rounded-xl text-sm sm:text-xl font-black transition-colors shadow-sm select-none touch-manipulation"
                >
                  ONAYLA
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
