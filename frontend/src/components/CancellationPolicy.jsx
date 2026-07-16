import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CancellationPolicy = ({ policy }) => {
  const { t } = useTranslation();

  if (!policy) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <p className="text-slate-600 text-sm">{t('product.cancellation.default')}</p>
      </div>
    );
  }

  const getPolicyInfo = () => {
    const hours = policy.freeCancellationHours;
    switch (policy.type) {
      case 'free':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: t('product.cancellation.free_title'),
          description:
            policy.description ||
            t('product.cancellation.free_desc', { hours: hours || 24 }),
        };
      case 'moderate':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: t('product.cancellation.moderate_title'),
          description:
            policy.description ||
            t('product.cancellation.moderate_desc', { hours: hours || 48 }),
        };
      case 'strict':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: t('product.cancellation.strict_title'),
          description:
            policy.description ||
            t('product.cancellation.strict_desc', { days: hours || 7 }),
        };
      case 'non_refundable':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: t('product.cancellation.non_refundable_title'),
          description:
            policy.description || t('product.cancellation.non_refundable_desc'),
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          title: t('product.cancellation_policy'),
          description:
            policy.description || t('product.cancellation.contact_operator'),
        };
    }
  };

  const policyInfo = getPolicyInfo();
  const Icon = policyInfo.icon;

  return (
    <div className={`${policyInfo.bgColor} rounded-lg p-4 border ${policyInfo.borderColor}`}>
      <div className="flex items-start gap-3">
        <Icon size={24} className={`${policyInfo.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold ${policyInfo.color} mb-1`}>{policyInfo.title}</h3>
          <p className="text-slate-700 text-sm leading-relaxed">{policyInfo.description}</p>
          {policy.type !== 'non_refundable' && policy.refundPercentage && (
            <p className="text-slate-600 text-xs mt-2">
              {t('product.cancellation.refund_pct', { pct: policy.refundPercentage })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
