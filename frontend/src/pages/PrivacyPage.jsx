import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <Shield className="mx-auto h-16 w-16 text-primary-600 mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Politique de confidentialité</h1>
            <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Overglow-Trip s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous collectons</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous collectons les informations suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Informations d'identification (nom, email, téléphone)</li>
                <li>Informations de paiement (traitées de manière sécurisée)</li>
                <li>Données de navigation et d'utilisation</li>
                <li>Contenu que vous publiez sur notre plateforme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Comment nous utilisons vos informations</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous utilisons vos informations pour fournir, améliorer et personnaliser nos services, traiter vos transactions, et communiquer avec vous.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage de vos informations</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations uniquement avec les opérateurs pour faciliter vos réservations, ou si la loi l'exige.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos droits</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vous avez le droit de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Accéder à vos données personnelles</li>
                <li>Corriger vos informations</li>
                <li>Demander la suppression de vos données</li>
                <li>Vous opposer au traitement de vos données</li>
                <li>Demander la portabilité de vos données</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations personnelles contre tout accès non autorisé, perte ou destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à :{' '}
                <a href="mailto:privacy@overglow-trip.com" className="text-primary-600 hover:underline">
                  privacy@overglow-trip.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

