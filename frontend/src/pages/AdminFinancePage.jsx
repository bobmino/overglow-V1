import React from 'react';
import { Landmark } from 'lucide-react';

/** [PROMPT-1] Finance placeholder — detailed module later. */
const AdminFinancePage = () => (
  <div className="container mx-auto px-4 py-12 bg-slate-50 min-h-screen">
    <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-gray-200 p-10">
      <Landmark size={48} className="mx-auto text-primary-600 mb-4" />
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Finances</h1>
      <p className="text-gray-600">
        Module finances en préparation. Les paiements en attente et retraits restent
        disponibles dans le menu latéral.
      </p>
    </div>
  </div>
);

export default AdminFinancePage;
