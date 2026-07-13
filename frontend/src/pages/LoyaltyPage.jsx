import React from 'react';
import { useTranslation } from 'react-i18next';
import ComingSoon from '../components/ComingSoon';
import { Helmet } from 'react-helmet-async';

const LoyaltyPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('loyalty.meta_title')}</title>
      </Helmet>
      <ComingSoon title={t('loyalty.title')} />
    </>
  );
};

export default LoyaltyPage;
