import { useState, useEffect, useRef } from 'react';
import { saveSettings } from '../firebase';
import { KeyboardShortcut } from '../types';
import { DEFAULT_SHORTCUTS } from '../constants';

export function useAppShortcuts(
  handleNavigate: (tab: any) => void,
  setPendingIslemModal: (modal: any) => void,
  setPendingAddCari: (val: boolean) => void,
  setPendingAddStock: (val: boolean) => void,
  cloudSettings?: any
) {
  const isSettingsLoaded = useRef(false);

  useEffect(() => {
    if (cloudSettings && !isSettingsLoaded.current) {
      isSettingsLoaded.current = true;
      if (cloudSettings.shortcuts) {
        setShortcuts(cloudSettings.shortcuts);
      }
    }
  }, [cloudSettings]);

  const syncToCloud = async (updates: any) => {
    if (isSettingsLoaded.current) {
      try {
        await saveSettings('shortcutSettings', updates);
      } catch (e) {
        console.error("Buluta kısayol senkronizasyonu başarısız:", e);
      }
    }
  };

  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_shortcuts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = DEFAULT_SHORTCUTS.map(def => {
            const found = parsed.find((p: any) => p.id === def.id);
            return found ? { ...def, ...found, } : def;
          });
          return merged;
        }
      } catch (e) {}
    }
    return DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable) {
          return;
        }
      }

      const matchedShortcut = shortcuts.find(s => {
        if (!s.key) return false;
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const altMatch = s.altKey === e.altKey;
        const ctrlMatch = s.ctrlKey === e.ctrlKey;
        const shiftMatch = s.shiftKey === e.shiftKey;
        return keyMatch && altMatch && ctrlMatch && shiftMatch;
      });

      if (matchedShortcut) {
        e.preventDefault();
        e.stopPropagation();

        switch (matchedShortcut.id) {
          case 'open_sale':
            handleNavigate('islemler');
            setPendingIslemModal('sale');
            break;
          case 'open_purchase':
            handleNavigate('islemler');
            setPendingIslemModal('purchase');
            break;
          case 'open_collection':
            handleNavigate('islemler');
            setPendingIslemModal('collection');
            break;
          case 'open_payment':
            handleNavigate('islemler');
            setPendingIslemModal('payment');
            break;
          case 'add_cari':
            handleNavigate('cariler');
            setPendingAddCari(true);
            break;
          case 'add_stock':
            handleNavigate('stoklar');
            setPendingAddStock(true);
            break;
          case 'nav_dashboard':
            handleNavigate('dashboard');
            break;
          case 'nav_cariler':
            handleNavigate('cariler');
            break;
          case 'nav_stoklar':
            handleNavigate('stoklar');
            break;
          case 'nav_islemler':
            handleNavigate('islemler');
            break;
          case 'nav_kasa':
            handleNavigate('kasa');
            break;
          case 'nav_ayarlar':
            handleNavigate('ayarlar');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts, true);
    };
  }, [shortcuts, handleNavigate, setPendingIslemModal, setPendingAddCari, setPendingAddStock]);

  
  useEffect(() => {
    if (isSettingsLoaded.current) {
      localStorage.setItem('storm_muhasebe_shortcuts', JSON.stringify(shortcuts));
      syncToCloud({ shortcuts });
    }
  }, [shortcuts]);

  return { shortcuts, setShortcuts };
}
