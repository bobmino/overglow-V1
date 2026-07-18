/**
 * Affichage montants BO / ops en MAD (devise plateforme Maroc).
 */
export const formatMoneyMad = (n, { decimals = 0 } = {}) => {
  const value = Number(n) || 0;
  const formatted = (decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString())
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace(/\u202f/g, ' ');
  return `${formatted} MAD`;
};
