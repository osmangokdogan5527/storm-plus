import { useState, useMemo, useEffect, useRef } from 'react';
import { saveSettings } from '../firebase';

export function usePrintSettings(cloudSettings?: any) {
  const isSettingsLoaded = useRef(false);

  useEffect(() => {
    if (cloudSettings && !isSettingsLoaded.current) {
      isSettingsLoaded.current = true;
      if (cloudSettings.companyName) setCompanyName(cloudSettings.companyName);
      if (cloudSettings.companyAddress) setCompanyAddress(cloudSettings.companyAddress);
      if (cloudSettings.companyPhone) setCompanyPhone(cloudSettings.companyPhone);
      if (cloudSettings.logoType) setLogoType(cloudSettings.logoType);
      if (cloudSettings.logoImageUrl) setLogoImageUrl(cloudSettings.logoImageUrl);
    }
  }, [cloudSettings]);

  const syncToCloud = async (updates: any) => {
    if (isSettingsLoaded.current) {
      try {
        await saveSettings('printSettings', updates);
      } catch (e) {
        console.error("Buluta baskı ayarları senkronizasyonu başarısız:", e);
      }
    }
  };

  const [companyName, setCompanyName] = useState('Firma Adı');
  const [companyAddress, setCompanyAddress] = useState('Firma Adresi');
  const [companyPhone, setCompanyPhone] = useState('0555 555 55 55');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [printSettingsSuccess, setPrintSettingsSuccess] = useState<string | null>(null);

  const initialPrintSettings = useMemo(() => {
    const DEFAULT_PRINT_SETTINGS = {
      companyName: 'Firma Adı',
      companyAddress: 'Firma Adresi',
      companyPhone: '0555 555 55 55',
      logoType: 'text' as 'text' | 'image',
      logoImageUrl: '',
    };
    const saved = localStorage.getItem('storm_muhasebe_print_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PRINT_SETTINGS;
  }, []);

  useEffect(() => {
    setCompanyName(initialPrintSettings.companyName);
    setCompanyAddress(initialPrintSettings.companyAddress);
    setCompanyPhone(initialPrintSettings.companyPhone);
    setLogoType(initialPrintSettings.logoType);
    setLogoImageUrl(initialPrintSettings.logoImageUrl);
  }, [initialPrintSettings]);

  const handleSavePrintSettings = () => {
    const newSettings = {
      companyName,
      companyAddress,
      companyPhone,
      logoType,
      logoImageUrl
    };
    localStorage.setItem('storm_muhasebe_print_settings', JSON.stringify(newSettings));
    syncToCloud(newSettings);
    setPrintSettingsSuccess('Baskı ayarları başarıyla kaydedildi.');
    setTimeout(() => setPrintSettingsSuccess(null), 3000);
  };

  return {
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyPhone, setCompanyPhone,
    logoType, setLogoType,
    logoImageUrl, setLogoImageUrl,
    printSettingsSuccess, handleSavePrintSettings
  };
}
