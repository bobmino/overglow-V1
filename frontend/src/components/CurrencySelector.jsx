import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelector = ({ className = '' }) => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <select
      aria-label="Sélecteur de devise"
      value={selectedCurrency}
      onChange={(e) => setSelectedCurrency(e.target.value)}
      className={`px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none ${className}`}
    >
      <option value="MAD">MAD</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>
  );
};

export default CurrencySelector;

