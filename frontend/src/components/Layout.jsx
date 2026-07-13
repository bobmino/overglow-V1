import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { usePageTracking } from '../hooks/useAnalytics';
import ToastContainer from './ToastContainer';

/**
 * [TASK-10] Layout public (Header + Footer + nav mobile).
 * Les pages gèrent leur propre largeur (full-bleed hero possible).
 */
const Layout = () => {
  usePageTracking();

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-800">
      <Header />
      <ToastContainer />
      <main className="flex-grow w-full pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

/** Alias demandé par l'audit — même shell public */
export const PublicLayout = Layout;

export default Layout;
