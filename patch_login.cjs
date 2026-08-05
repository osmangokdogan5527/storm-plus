const fs = require('fs');

let authScreen = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

if (!authScreen.includes('logUserActivity')) {
  authScreen = authScreen.replace(
    "import { X, Lock, Shield, Check, AlertTriangle, Users, FileText, Download } from 'lucide-react';",
    "import { X, Lock, Shield, Check, AlertTriangle, Users, FileText, Download } from 'lucide-react';\nimport { logUserActivity } from '../utils/userLogger';"
  );
  authScreen = authScreen.replace(/setUser\(userData as any\);/g, "logUserActivity(selectedPinAccount.id, selectedPinAccount.name, 'login');\n                          setUser(userData as any);");
  fs.writeFileSync('src/components/AuthScreen.tsx', authScreen);
}

