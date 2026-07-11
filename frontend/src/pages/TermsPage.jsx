import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <FileText className="mx-auto h-16 w-16 text-primary-600 mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Conditions générales d&apos;utilisation</h1>
            <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Overglow Trip est une plateforme de réservation d&apos;expériences touristiques au Maroc.
                Ces conditions régissent l&apos;accès et l&apos;utilisation du site par les voyageurs, les opérateurs et les administrateurs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Compte utilisateur</h2>
              <p className="text-gray-700 leading-relaxed">
                Vous êtes responsable de la confidentialité de vos identifiants. Les informations fournies doivent être exactes.
                Overglow peut suspendre un compte en cas d&apos;usage frauduleux ou contraire aux présentes conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Réservations et paiements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Une réservation n&apos;est confirmée qu&apos;après paiement validé (carte via Stripe/PayPal) ou validation manuelle (virement / espèces).</li>
                <li>Les prix affichés incluent les taxes indiquées sur la fiche produit.</li>
                <li>Les politiques d&apos;annulation et de remboursement sont propres à chaque expérience et affichées avant paiement.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Obligations des opérateurs</h2>
              <p className="text-gray-700 leading-relaxed">
                Les opérateurs s&apos;engagent à fournir des expériences conformes à la description publiée, à respecter les capacités
                et horaires, et à traiter les voyageurs de manière professionnelle. Overglow peut retirer une offre non conforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                Overglow agit comme intermédiaire technique. La responsabilité de la réalisation de l&apos;expérience incombe à l&apos;opérateur.
                Overglow n&apos;est pas responsable des dommages indirects liés à une annulation force majeure ou à un manquement de l&apos;opérateur,
                dans les limites prévues par la loi applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question :{' '}
                <Link to="/contact" className="text-primary-600 font-semibold hover:underline">
                  Centre d&apos;aide
                </Link>
                {' '}ou consultez notre{' '}
                <Link to="/privacy" className="text-primary-600 font-semibold hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
