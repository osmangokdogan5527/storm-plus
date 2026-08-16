import fs from 'fs';
let c = fs.readFileSync('src/components/StoklarView.tsx', 'utf8');

const useMemos = `
  const invStats = useMemo(() => {
    let totalStockValue = 0;
    let totalQuantity = 0;
    let criticalItemsCount = 0;
    let totalItems = 0;

    (stoklar || []).forEach(s => {
      totalStockValue += (s.purchasePrice || 0) * (s.quantity || 0);
      totalQuantity += (s.quantity || 0);
      if ((s.quantity || 0) <= (s.minQuantity || 5)) {
        criticalItemsCount++;
      }
      totalItems++;
    });

    return { totalStockValue, totalQuantity, criticalItemsCount, totalItems };
  }, [stoklar]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (stoklar || []).forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [stoklar]);

  const brands = useMemo(() => {
    const br = new Set<string>();
    (stoklar || []).forEach(s => {
      if (s.brand) br.add(s.brand);
    });
    return Array.from(br).sort();
  }, [stoklar]);

  const filteredStoklar = useMemo(() => {
    return (stoklar || []).filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.barcode && s.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchType = true;
      if (filterType === 'critical') matchType = (s.quantity || 0) <= (s.minQuantity || 5);
      else if (filterType === 'instock') matchType = (s.quantity || 0) > 0;
      else if (filterType === 'outstock') matchType = (s.quantity || 0) === 0;

      const matchCategory = selectedCategory === '' || s.category === selectedCategory;
      const matchBrand = selectedBrand === '' || s.brand === selectedBrand;

      return matchSearch && matchType && matchCategory && matchBrand;
    });
  }, [stoklar, searchTerm, filterType, selectedCategory, selectedBrand]);

`;

c = c.replace(/  const \[expandedCariId, setExpandedCariId\] = useState<string \| null>\(null\);\n/g, "  const [expandedCariId, setExpandedCariId] = useState<string | null>(null);\n" + useMemos);

fs.writeFileSync('src/components/StoklarView.tsx', c);
