import React from 'react';
import ComingSoon from '../components/ComingSoon';
import { Helmet } from 'react-helmet-async';

const LoyaltyPage = () => {
  return (
    <>
      <Helmet>
        <title>Programme de Fidélité | Overglow Trip</title>
      </Helmet>
      <ComingSoon title="Programme de Fidélité" />
    </>
  );
};

export default LoyaltyPage;

