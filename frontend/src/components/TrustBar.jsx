import React from 'react';
import { ShieldCheck, Headphones, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** [TASK-24] Soften unverifiable claims (no fake 24/7 / Trustpilot). */
const TrustBar = ({ compact = false }) => {
  const { t } = useTranslation();

  const items = [
    {
      icon: ShieldCheck,
      title: t('trust.secure_title'),
      subtitle: t('trust.secure_subtitle'),
    },
    {
      icon: Headphones,
      title: t('trust.support_title'),
      subtitle: t('trust.support_subtitle'),
    },
    {
      icon: BadgeCheck,
      title: t('trust.quality_title'),
      subtitle: t('trust.quality_subtitle'),
    },
  ];

  return (
    <div className={`relative z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon size={20} className="text-primary-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-600">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustBar;
