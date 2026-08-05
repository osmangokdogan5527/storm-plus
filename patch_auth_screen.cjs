const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

// 1. Change adminTab state type
code = code.replace(
  "const [adminTab, setAdminTab] = React.useState<'errors' | 'feedback'>('errors');",
  "const [adminTab, setAdminTab] = React.useState<'errors' | 'feedback' | 'userLogs'>('userLogs');\n  const [userLogs, setUserLogs] = React.useState<any[]>([]);\n  React.useEffect(() => {\n    if (showAdminDashboard) {\n      const logsStr = localStorage.getItem('storm_user_logs');\n      if (logsStr) {\n        try {\n          setUserLogs(JSON.parse(logsStr));\n        } catch (e) {}\n      }\n    }\n  }, [showAdminDashboard, adminTab]);"
);

// 2. Add the button to the header
const buttonRegex = /<button\s+onClick=\{\(\) => setAdminTab\('feedback'\)\}([\s\S]*?)<\/button>/;
const feedbackBtnMatch = code.match(buttonRegex);
if (feedbackBtnMatch) {
  const feedbackBtn = feedbackBtnMatch[0];
  const userLogsBtn = feedbackBtn.replace(/'feedback'/g, "'userLogs'").replace(/İstek & Geri Bildirim/, "Giriş/Çıkışlar");
  code = code.replace(feedbackBtn, userLogsBtn + '\n                  ' + feedbackBtn);
}

// 3. Clear button logic
const clearLogicRegex = /if \(adminTab === 'errors'\) \{[\s\S]*?\} else \{[\s\S]*?\}/;
code = code.replace(clearLogicRegex, `if (adminTab === 'errors') {
                        localStorage.removeItem('storm_error_logs');
                        setErrorLogs([]);
                      } else if (adminTab === 'feedback') {
                        localStorage.removeItem('storm_feedback_logs');
                        setFeedbackList([]);
                      } else {
                        localStorage.removeItem('storm_user_logs');
                        setUserLogs([]);
                      }`);

// 4. Add the tab content
const errorsTabRegex = /\{adminTab === 'errors' && \([\s\S]*?\}\)/;
const errorsTabMatch = code.match(errorsTabRegex);
if (errorsTabMatch) {
  const userLogsTab = `{adminTab === 'userLogs' && (
                  userLogs.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <Users size={48} className="mx-auto mb-4 text-teal-500/50" />
                      <p className={\`text-sm uppercase tracking-widest font-bold \${textTertiary}\`}>Giriş/Çıkış Kaydı Bulunamadı</p>
                      <p className={\`text-xs font-mono mt-2 \${textMuted}\`}>Henüz kullanıcı hareketi kaydedilmemiş.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userLogs.map((log: any) => (
                        <div key={log.id} className={\`p-4 rounded-xl flex items-center justify-between transition-colors \${
                          isCleanLight 
                             ? 'bg-slate-50 border border-slate-200' 
                             : 'bg-white/5 border border-white/10'
                        }\`}>
                          <div className="flex items-center gap-4">
                            <div className={\`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 \${log.action === 'login' ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}\`}>
                              <Lock size={20} />
                            </div>
                            <div>
                              <p className={\`text-sm font-bold uppercase tracking-widest \${textPrimary}\`}>{log.userName}</p>
                              <p className={\`text-xs font-mono mt-1 \${log.action === 'login' ? 'text-teal-400' : 'text-rose-400'}\`}>
                                {log.action === 'login' ? 'Sisteme Giriş Yaptı' : 'Sistemden Çıkış Yaptı'}
                              </p>
                            </div>
                          </div>
                          <div className={\`text-right text-xs font-mono \${textTertiary}\`}>
                            <p>{new Date(log.timestamp).toLocaleDateString('tr-TR')}</p>
                            <p className="mt-1">{new Date(log.timestamp).toLocaleTimeString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}`;
  code = code.replace(errorsTabMatch[0], userLogsTab + '\n                ' + errorsTabMatch[0]);
}

fs.writeFileSync('src/components/AuthScreen.tsx', code);
