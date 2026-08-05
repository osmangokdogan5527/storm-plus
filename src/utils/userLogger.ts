export function logUserActivity(userId: string, userName: string, action: 'login' | 'logout') {
  try {
    const logsStr = localStorage.getItem('storm_user_logs');
    const logs = logsStr ? JSON.parse(logsStr) : [];
    logs.unshift({
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      userId,
      userName,
      action,
      timestamp: new Date().toISOString()
    });
    // Keep only last 1000 logs to prevent localStorage bloat
    if (logs.length > 1000) {
      logs.length = 1000;
    }
    localStorage.setItem('storm_user_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log user activity', e);
  }
}
