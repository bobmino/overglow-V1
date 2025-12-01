import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const CancellationPolicy = ({ policy }) => {
  if (!policy) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <p className="text-slate-600 text-sm">
          Politique d'annulation standard : Annulation gratuite jusqu'à 24h avant le début de l'expérience.
        </p>
      </div>
    );
  }

  const getPolicyInfo = () => {
    switch (policy.type) {
      case 'free':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Annulation Gratuite',
          description: policy.description || `Annulation gratuite jusqu'à ${policy.freeCancellationHours || 24} heures avant le début de l'expérience`,
        };
      case 'moderate':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Annulation Modérée',
          description: policy.description || `Annulation possible jusqu'à ${policy.freeCancellationHours || 48} heures avant. Remboursement partiel après ce délai.`,
        };
      case 'strict':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Annulation Stricte',
          description: policy.description || `Annulation possible jusqu'à ${policy.freeCancellationHours || 7} jours avant. Remboursement partiel après ce délai.`,
        };
      case 'non_refundable':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Non Remboursable',
          description: policy.description || 'Cette réservation n\'est pas remboursable. Aucun remboursement ne sera effectué en cas d\'annulation.',
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          title: 'Politique d\'Annulation',
          description: policy.description || 'Veuillez contacter l\'opérateur pour plus d\'informations sur la politique d\'annulation.',
        };
    }
  };

  const policyInfo = getPolicyInfo();
  const Icon = policyInfo.icon;

  return (
    <div className={`${policyInfo.bgColor} rounded-lg p-4 border ${policyInfo.borderColor}`}>
      <div className="flex items-start gap-3">
        <Icon size={24} className={`${policyInfo.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-bold ${policyInfo.color} mb-1`}>
            {policyInfo.title}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {policyInfo.description}
          </p>
          {policy.type !== 'non_refundable' && policy.refundPercentage && (
            <p className="text-slate-600 text-xs mt-2">
              Remboursement : {policy.refundPercentage}% du montant total
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
