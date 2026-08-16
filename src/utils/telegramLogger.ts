export function reportErrorToTelegram(error: Error, context: string) {
  const stackTrace = error.stack || 'No stack trace';
  console.error(`[${context}] Caught error:`, error);
  
  try {
    const activeUser = localStorage.getItem('storm_active_user_email') || 'Bilinmeyen Kullanıcı';
    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('tr-TR'),
      user: activeUser,
      context,
      message: error?.message || 'Bilinmeyen Hata',
      stack: stackTrace
    };
    
    // Save to local storage for offline history
    const existingLogsStr = localStorage.getItem('storm_error_logs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    existingLogs.unshift(newLog);
    if (existingLogs.length > 100) existingLogs.pop();
    localStorage.setItem('storm_error_logs', JSON.stringify(existingLogs));

    // Send via IPC to main process Telegram service if available
    if ((window as any).electronAPI && (window as any).electronAPI.sendTelegramError) {
      (window as any).electronAPI.sendTelegramError(newLog).catch((e: any) => {
        console.error('Failed to send telegram error via IPC:', e);
      });
    }

  } catch (err) {
    console.error('Local error log creation failed:', err);
  }
}


