import React from 'react';
import { Badge as BadgeIcon } from 'lucide-react';

const BadgeDisplay = ({ badges, size = 'md' }) => {
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badgeItem, index) => {
        const badge = badgeItem.badgeId || badgeItem; // Support both populated and non-populated
        if (!badge) return null;

        const badgeName = badge.name || badgeItem.name;
        const badgeIcon = badge.icon || badgeItem.icon || '🏆';
        const badgeColor = badge.color || badgeItem.color || '#059669';
        const badgeDescription = badge.description || badgeItem.description || '';

        return (
          <div
            key={badge._id || badgeItem._id || index}
            className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full font-semibold text-white shadow-sm`}
            style={{ backgroundColor: badgeColor }}
            title={badgeDescription}
          >
            <span className="text-sm">{badgeIcon}</span>
            <span>{badgeName}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeDisplay;
