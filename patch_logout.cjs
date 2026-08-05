const fs = require('fs');
let hook = fs.readFileSync('src/hooks/useAppAuth.ts', 'utf8');

if (!hook.includes('logUserActivity')) {
  hook = hook.replace(
    "import { PIN_ACCOUNTS } from '../constants';",
    "import { PIN_ACCOUNTS } from '../constants';\nimport { logUserActivity } from '../utils/userLogger';"
  );
  hook = hook.replace(
    "const handleSignOut = async () => {",
    "const handleSignOut = async () => {\n    if (user) {\n      logUserActivity(user.uid, user.displayName || 'Bilinmeyen Kullanıcı', 'logout');\n    }"
  );
  fs.writeFileSync('src/hooks/useAppAuth.ts', hook);
}
