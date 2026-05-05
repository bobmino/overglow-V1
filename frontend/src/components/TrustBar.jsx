import React from 'react';
import { ShieldCheck, Headphones, BadgeCheck } from 'lucide-react';

const items = [
  {
    icon: ShieldCheck,
    title: 'Paiement securise',
    subtitle: 'Transactions chiffrees et controle anti-fraude',
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    subtitle: 'Equipe assistance voyageurs et partenaires',
  },
  {
    icon: BadgeCheck,
    title: 'Selection qualite',
    subtitle: 'Experiences verifiees par notre equipe locale',
  },
];

const TrustBar = ({ compact = false }) => {
  return (
    <div className={`relative z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon size={20} className="text-emerald-600 mt-0.5" />
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
