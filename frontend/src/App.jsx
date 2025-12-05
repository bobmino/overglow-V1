import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

import Hero from './components/Hero';
import Features from './components/Features';
import TopDestinations from './components/TopDestinations';
import FlexibilityBanner from './components/FlexibilityBanner';
import TopAttractions from './components/TopAttractions';
import TopTours from './components/TopTours';
import WarmDestinations from './components/WarmDestinations';
import AuthCTA from './components/AuthCTA';
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import OperatorDashboardPage from './pages/OperatorDashboardPage';
import OperatorProductsPage from './pages/OperatorProductsPage';
import OperatorBookingsPage from './pages/OperatorBookingsPage';
import OperatorProductFormPage from './pages/OperatorProductFormPage';
import OperatorWizardPage from './pages/OperatorWizardPage';
import OperatorOnboardingPage from './pages/OperatorOnboardingPage';
import AffiliatePage from './pages/AffiliatePage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InquiriesPage from './pages/InquiriesPage';
import MyInquiriesPage from './pages/MyInquiriesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOperatorsPage from './pages/AdminOperatorsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import ApprovalRequestsPage from './pages/ApprovalRequestsPage';
import AdminBadgeRequestsPage from './pages/AdminBadgeRequestsPage';
import FavoritesPage from './pages/FavoritesPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ViewHistoryPage from './pages/ViewHistoryPage';
import RecommendedProducts from './components/RecommendedProducts';
import PrivateRoute from './components/PrivateRoute';
import OperatorRoute from './components/OperatorRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <>
              <Hero />
              <Features />
              <TopDestinations />
              <FlexibilityBanner />
              <TopAttractions />
              <TopTours />
              <RecommendedProducts title="Pour vous" type="personalized" limit={8} />
              <WarmDestinations />
              <AuthCTA />
            </>
          } />
          <Route path="search" element={<SearchPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          <Route path="favorites" element={
            <PrivateRoute>
              <FavoritesPage />
            </PrivateRoute>
          } />
          <Route path="loyalty" element={
            <PrivateRoute>
              <LoyaltyPage />
            </PrivateRoute>
          } />
          <Route path="view-history" element={
            <PrivateRoute>
              <ViewHistoryPage />
            </PrivateRoute>
          } />
          <Route path="dashboard/inquiries" element={
            <PrivateRoute>
              <MyInquiriesPage />
            </PrivateRoute>
          } />
          <Route path="operator/wizard" element={
            <PrivateRoute>
              <OperatorWizardPage />
            </PrivateRoute>
          } />
          <Route path="operator/onboarding" element={
            <PrivateRoute>
              <OperatorOnboardingPage />
            </PrivateRoute>
          } />
          <Route path="operator/dashboard" element={
            <OperatorRoute>
              <OperatorDashboardPage />
            </OperatorRoute>
          } />
          <Route path="operator/products" element={
            <OperatorRoute>
              <OperatorProductsPage />
            </OperatorRoute>
          } />
          <Route path="operator/products/new" element={
            <OperatorRoute>
              <OperatorProductFormPage />
            </OperatorRoute>
          } />
          <Route path="operator/products/:id/edit" element={
            <OperatorRoute>
              <OperatorProductFormPage />
            </OperatorRoute>
          } />
          <Route path="operator/bookings" element={
            <OperatorRoute>
              <OperatorBookingsPage />
            </OperatorRoute>
          } />
          <Route path="operator/analytics" element={
            <OperatorRoute>
              <AnalyticsPage />
            </OperatorRoute>
          } />
          <Route path="operator/inquiries" element={
            <OperatorRoute>
              <InquiriesPage />
            </OperatorRoute>
          } />
          <Route path="admin/dashboard" element={
            <PrivateRoute>
              <AdminDashboardPage />
            </PrivateRoute>
          } />
          <Route path="admin/operators" element={
            <PrivateRoute>
              <AdminOperatorsPage />
            </PrivateRoute>
          } />
          <Route path="admin/products" element={
            <PrivateRoute>
              <AdminProductsPage />
            </PrivateRoute>
          } />
          <Route path="admin/users" element={
            <PrivateRoute>
              <AdminUsersPage />
            </PrivateRoute>
          } />
          <Route path="admin/settings" element={
            <PrivateRoute>
              <AdminSettingsPage />
            </PrivateRoute>
          } />
          <Route path="notifications" element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          } />
          <Route path="operator/withdrawals" element={
            <PrivateRoute>
              <WithdrawalsPage />
            </PrivateRoute>
          } />
          <Route path="admin/withdrawals" element={
            <PrivateRoute>
              <AdminWithdrawalsPage />
            </PrivateRoute>
          } />
          <Route path="admin/approval-requests" element={
            <PrivateRoute>
              <ApprovalRequestsPage />
            </PrivateRoute>
          } />
          <Route path="admin/badge-requests" element={
            <PrivateRoute>
              <AdminBadgeRequestsPage />
            </PrivateRoute>
          } />
        </Route>
        
        {/* Checkout routes without layout */}
        <Route path="checkout" element={
          <PrivateRoute>
            <CheckoutPage />
          </PrivateRoute>
        } />
        <Route path="booking-success" element={
          <PrivateRoute>
            <BookingSuccessPage />
          </PrivateRoute>
        } />
        
        {/* Auth routes without layout */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="affiliate" element={<AffiliatePage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="terms" element={<PrivacyPage />} />
          <Route path="contact" element={<HelpPage />} />
        <Route path="operator/register" element={<RegisterPage />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
