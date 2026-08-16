import React from 'react';


export const CorporateTemplate: React.FC<any> = ({ dynamicPrintVars, printSettings }) => {
  const { transaction, currentCariForPrint, formatPrintCurrency, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};

  if (!transaction || !formatPrintCurrency || !transactionTypeTheme) return null;

  return (
    <div className="w-full h-full bg-white relative p-[15mm]">
      <div className="flex flex-col h-full font-sans text-xs text-zinc-900">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-zinc-900 pb-8">
          <div>
            <h1 className="text-3xl font-black uppercase text-zinc-900 mb-2">{printSettings?.companyName || 'SİRKET ADI'}</h1>
            <p className="text-sm text-zinc-600 whitespace-pre-line max-w-sm">{printSettings?.companyAddress}</p>
            <p className="text-sm text-zinc-600 mt-1">TEL: {printSettings?.companyPhone}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-400 mb-2">Fatura</h2>
            <div className="bg-zinc-100 px-4 py-2 rounded">
              <p className="text-sm font-mono"><span className="text-zinc-500 mr-2">NO:</span> {transaction.invoiceNo || transaction.id?.substring(0, 8)}</p>
              <p className="text-sm font-mono"><span className="text-zinc-500 mr-2">TARİH:</span> {transaction.date}</p>
            </div>
          </div>
        </div>

        {/* Cari */}
        <div className="mb-8 p-6 bg-zinc-50 border border-zinc-200 rounded-lg max-w-md">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">SAYIN</p>
          <p className="text-lg font-bold text-zinc-900 mb-2">{transaction.cariName}</p>
          {currentCariForPrint && (
            <div className="text-sm text-zinc-600">
              {currentCariForPrint.taxOffice && <p>VD: {currentCariForPrint.taxOffice}</p>}
              {currentCariForPrint.taxNo && <p>VN: {currentCariForPrint.taxNo}</p>}
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full text-left mb-8">
          <thead className="bg-zinc-900 text-white">
            <tr>
              <th className="p-3 font-semibold text-sm rounded-tl">ÜRÜN / HİZMET</th>
              <th className="p-3 font-semibold text-sm text-center">MİKTAR</th>
              <th className="p-3 font-semibold text-sm text-right">BİRİM FİYAT</th>
              <th className="p-3 font-semibold text-sm text-right rounded-tr">TOPLAM</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items && transaction.items.length > 0 ? (
              transaction.items.map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  <td className="p-3 text-sm">{item.stockName}</td>
                  <td className="p-3 text-sm text-center">{item.quantity} {item.unit}</td>
                  <td className="p-3 text-sm text-right font-mono">{formatPrintCurrency(item.price, transaction.currency || 'TRY')}</td>
                  <td className="p-3 text-sm text-right font-mono font-bold">{formatPrintCurrency(item.total, transaction.currency || 'TRY')}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-zinc-200">
                <td className="p-3 text-sm">{transaction.description || 'Finansal İşlem'}</td>
                <td className="p-3 text-sm text-center">1</td>
                <td className="p-3 text-sm text-right font-mono">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</td>
                <td className="p-3 text-sm text-right font-mono font-bold">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 bg-zinc-50 border border-zinc-200 rounded p-4">
            <div className="flex justify-between items-center text-lg font-black text-zinc-900">
              <span>TOPLAM</span>
              <span className="font-mono">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto">
          {printedBankDetails}
          {printedSignatureArea}
          <div className="text-center text-xs text-zinc-400 mt-8 pt-4 border-t border-zinc-200">
            Bizi tercih ettiğiniz için teşekkür ederiz.
          </div>
        </div>
      </div>
    </div>
  );
};
