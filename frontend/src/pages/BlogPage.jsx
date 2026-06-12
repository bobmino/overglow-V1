import React from 'react';
import ComingSoon from '../components/ComingSoon';
import { Helmet } from 'react-helmet-async';

const BlogPage = () => {
  return (
    <>
      <Helmet>
        <title>Blog - Conseils, Guides et Actualités | Overglow Trip</title>
        <meta name="description" content="Découvrez nos articles sur les destinations, conseils de voyage, culture marocaine et bien plus encore" />
      </Helmet>
      <ComingSoon title="Le Blog Overglow" />
    </>
  );
};

export default BlogPage;
