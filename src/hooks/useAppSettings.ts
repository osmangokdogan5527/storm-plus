import { useState, useEffect, useRef } from 'react';
import { saveSettings } from '../firebase';


export function useAppSettings(cloudSettings?: any) {
  const isSettingsLoaded = useRef(false);

  useEffect(() => {
    if (cloudSettings && !isSettingsLoaded.current) {
      isSettingsLoaded.current = true;
      if (cloudSettings.activeTheme) setActiveTheme(cloudSettings.activeTheme);
      if (cloudSettings.designStyle) setDesignStyle(cloudSettings.designStyle);
      if (cloudSettings.activeLogoTheme) setActiveLogoTheme(cloudSettings.activeLogoTheme);
      if (cloudSettings.appFontSize) setAppFontSize(cloudSettings.appFontSize);
      if (cloudSettings.sidebarBg) setSidebarBg(cloudSettings.sidebarBg);
      if (cloudSettings.sidebarPattern) setSidebarPattern(cloudSettings.sidebarPattern);
      if (cloudSettings.sidebarPatternOpacity !== undefined) setSidebarPatternOpacity(cloudSettings.sidebarPatternOpacity);
      if (cloudSettings.sidebarPatternColor) setSidebarPatternColor(cloudSettings.sidebarPatternColor);
      if (cloudSettings.hiddenTabs) setHiddenTabs(cloudSettings.hiddenTabs);
      if (cloudSettings.tabOrder) setTabOrder(cloudSettings.tabOrder);
      if (cloudSettings.geminiApiKey) setGeminiApiKey(cloudSettings.geminiApiKey);
      if (cloudSettings.isAiEnabled !== undefined) setIsAiEnabled(cloudSettings.isAiEnabled);
      if (cloudSettings.autoBackupEnabled !== undefined) setAutoBackupEnabled(cloudSettings.autoBackupEnabled);
    }
  }, [cloudSettings]);

  const syncToCloud = async (updates: any) => {
    if (isSettingsLoaded.current) {
      try {
        await saveSettings('appSettings', updates);
      } catch (e) {
        console.error("Buluta ayar senkronizasyonu başarısız:", e);
      }
    }
  };

  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;

  const [activeTheme, setActiveTheme] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'red';
    }
    // Migration check to ensure previous users get the new default 'sky' with 'fluid-mesh'
    const isInitializedV4 = localStorage.getItem('storm_default_setup_v4');
    if (!isInitializedV4) {
      localStorage.setItem('storm_default_setup_v4', 'true');
      localStorage.setItem('kolay_hesap_accent_theme', 'red');
      localStorage.setItem('storm_muhasebe_design_style', 'pro-solid');
      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
      return 'red';
    }

    const saved = localStorage.getItem('kolay_hesap_accent_theme');
    if (saved === 'rose') return 'red';
    return saved || 'sky';
  });

  const [designStyle, setDesignStyle] = useState<string>('pro-solid');

  useEffect(() => {
    document.documentElement.setAttribute('data-design-style', 'pro-solid');
    localStorage.setItem('storm_muhasebe_design_style', 'pro-solid');
  }, [designStyle]);

  const [activeLogoTheme, setActiveLogoTheme] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_logo_theme') || 'theme';
  });

  const [appFontSize, setAppFontSize] = useState<'xsmall' | 'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('storm_muhasebe_font_size') as 'xsmall' | 'small' | 'medium' | 'large') || 'medium';
  });

  const [sidebarBg, setSidebarBg] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_bg') || '#050505';
  });

  const [sidebarPattern, setSidebarPattern] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_pattern') || 'crystal';
  });

  const [sidebarPatternOpacity, setSidebarPatternOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('storm_muhasebe_sidebar_pattern_opacity') || '0.75');
  });

  const [sidebarPatternColor, setSidebarPatternColor] = useState<'white' | 'black' | 'theme'>(() => {
    return (localStorage.getItem('storm_muhasebe_sidebar_pattern_color') as 'white' | 'black' | 'theme') || 'theme';
  });

  const [hiddenTabs, setHiddenTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_hidden_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const toggleTabVisibility = (tabId: string) => {
    if (tabId === 'ayarlar' || tabId === 'dashboard') return;
    setHiddenTabs((prev) => {
      const next = prev.includes(tabId)
        ? prev.filter((t) => t !== tabId)
        : [...prev, tabId];
      localStorage.setItem('storm_muhasebe_hidden_tabs', JSON.stringify(next));
      syncToCloud({ hiddenTabs: next });
      return next;
    });
  };

  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    const defaultOrder = ['dashboard', 'pos', 'online_marketler', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'raporlar', 'ayarlar'];
    const saved = localStorage.getItem('storm_muhasebe_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((t: string) => defaultOrder.includes(t));
          const missing = defaultOrder.filter((t: string) => !filtered.includes(t));
          let order = [...filtered, ...missing];

          // Reorder 'pos' right under 'dashboard' and 'online_marketler' right under 'pos'
          if (order.includes('pos')) {
            order = order.filter((t) => t !== 'pos' && t !== 'online_marketler');
            const dashIdx = order.indexOf('dashboard');
            const insertIdx = dashIdx >= 0 ? dashIdx + 1 : 0;
            order.splice(insertIdx, 0, 'pos', 'online_marketler');
          }
          localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(order));
          syncToCloud({ tabOrder: order });
          return order;
        }
      } catch (e) {}
    }
    localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(defaultOrder));
    return defaultOrder;
  });

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...tabOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setTabOrder(newOrder);
      localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(newOrder));
      syncToCloud({ tabOrder: newOrder });
    }
  };

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_gemini_api_key') || '';
  });

  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => {
    return localStorage.getItem('storm_muhasebe_ai_enabled') !== 'false';
  });

  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('storm_auto_backup_enabled') !== 'false';
  });

  // Sync auto backup with electron when it changes
  useEffect(() => {
    if ((window as any).electronAPI && (window as any).electronAPI.setAutoBackup) {
      (window as any).electronAPI.setAutoBackup(autoBackupEnabled);
    }
  }, [autoBackupEnabled]);

  
  useEffect(() => {
    if (isSettingsLoaded.current) {
      syncToCloud({
        activeTheme,
        designStyle,
        activeLogoTheme,
        appFontSize,
        sidebarBg,
        sidebarPattern,
        sidebarPatternOpacity,
        sidebarPatternColor,
        geminiApiKey,
        isAiEnabled,
        autoBackupEnabled
      });
      localStorage.setItem('kolay_hesap_accent_theme', activeTheme);
      localStorage.setItem('storm_muhasebe_design_style', designStyle);
      localStorage.setItem('storm_muhasebe_logo_theme', activeLogoTheme);
      localStorage.setItem('storm_muhasebe_font_size', appFontSize);
      localStorage.setItem('storm_muhasebe_sidebar_bg', sidebarBg);
      localStorage.setItem('storm_muhasebe_sidebar_pattern', sidebarPattern);
      localStorage.setItem('storm_muhasebe_sidebar_pattern_opacity', sidebarPatternOpacity.toString());
      localStorage.setItem('storm_muhasebe_sidebar_pattern_color', sidebarPatternColor);
      localStorage.setItem('storm_muhasebe_gemini_api_key', geminiApiKey);
      localStorage.setItem('storm_muhasebe_ai_enabled', isAiEnabled.toString());
      localStorage.setItem('storm_auto_backup_enabled', autoBackupEnabled.toString());
    }
  }, [
    activeTheme, designStyle, activeLogoTheme, appFontSize, sidebarBg,
    sidebarPattern, sidebarPatternOpacity, sidebarPatternColor,
    geminiApiKey, isAiEnabled, autoBackupEnabled
  ]);

  return {
    activeTheme, setActiveTheme,
    designStyle, setDesignStyle,
    activeLogoTheme, setActiveLogoTheme,
    appFontSize, setAppFontSize,
    sidebarBg, setSidebarBg,
    sidebarPattern, setSidebarPattern,
    sidebarPatternOpacity, setSidebarPatternOpacity,
    sidebarPatternColor, setSidebarPatternColor,
    hiddenTabs, setHiddenTabs, toggleTabVisibility,
    tabOrder, setTabOrder, moveTab,
    geminiApiKey, setGeminiApiKey,
    isAiEnabled, setIsAiEnabled,
    autoBackupEnabled, setAutoBackupEnabled
  };
}
