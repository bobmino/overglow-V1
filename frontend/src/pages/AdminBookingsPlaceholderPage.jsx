import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * [PROMPT-1] Placeholder — full AdminBookingsPage arrives in PROMPT 2.
 */
const AdminBookingsPlaceholderPage = () => (
  <div className="container mx-auto px-4 py-12 bg-slate-50 min-h-screen">
    <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-gray-200 p-10">
      <CalendarDays size={48} className="mx-auto text-primary-600 mb-4" />
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Réservations</h1>
      <p className="text-gray-600 mb-6">
        La page de gestion des réservations arrive dans la prochaine étape.
        En attendant, retrouvez les indicateurs sur le tableau de bord.
      </p>
      <Link
        to="/admin/dashboard"
        className="inline-flex px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
      >
        Retour au tableau de bord
      </Link>
    </div>
  </div>
);

export default AdminBookingsPlaceholderPage;
