import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { usePageTracking } from '../hooks/useAnalytics';
import ToastContainer from './ToastContainer';

const Layout = () => {
  // Track page views - must be inside Router context
  usePageTracking();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ToastContainer />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
