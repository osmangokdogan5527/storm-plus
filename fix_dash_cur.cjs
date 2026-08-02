const fs = require('fs');

let file = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const broken = `  const [dashboardCurrency, setDashboardCurrency] = useState<
    "TRY"
  >("TRY");`;

const fixed = `  const dashboardCurrency = "TRY";`;

file = file.replace(broken, fixed);
fs.writeFileSync('src/components/DashboardView.tsx', file, 'utf8');
console.log('Fixed dash currency');
