import React from 'react';
import ComingSoon from './ComingSoon';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const PlaceholderPage = ({ titleKey, defaultTitle }) => {
  const { t } = useTranslation();
  const pageTitle = t(titleKey, defaultTitle);

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Overglow Trip</title>
      </Helmet>
      <ComingSoon title={pageTitle} />
    </>
  );
};

export default PlaceholderPage;
