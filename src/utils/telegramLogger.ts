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
    
    const existingLogsStr = localStorage.getItem('storm_error_logs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    existingLogs.unshift(newLog);
    if (existingLogs.length > 100) existingLogs.pop();
    localStorage.setItem('storm_error_logs', JSON.stringify(existingLogs));
  } catch (err) {
    console.error('Local error log creation failed:', err);
  }
}

