import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

// Critical components (loaded immediately)
import Hero from './components/Hero';
import Features from './components/Features';
import TopDestinations from './components/TopDestinations';
import FlexibilityBanner from './components/FlexibilityBanner';
import TopAttractions from './components/TopAttractions';
import TopTours from './components/TopTours';
import WarmDestinations from './components/WarmDestinations';
import AuthCTA from './components/AuthCTA';
import RecommendedProducts from './components/RecommendedProducts';
import PrivateRoute from './components/PrivateRoute';
import OperatorRoute from './components/OperatorRoute';

// Critical pages (loaded immediately)
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy loaded pages (loaded on demand)
const DestinationPage = lazy(() => import('./pages/DestinationPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage'));
const OperatorDashboardPage = lazy(() => import('./pages/OperatorDashboardPage'));
const OperatorProductsPage = lazy(() => import('./pages/OperatorProductsPage'));
const OperatorBookingsPage = lazy(() => import('./pages/OperatorBookingsPage'));
const OperatorProductFormPage = lazy(() => import('./pages/OperatorProductFormPage'));
const OperatorWizardPage = lazy(() => import('./pages/OperatorWizardPage'));
const OperatorOnboardingPage = lazy(() => import('./pages/OperatorOnboardingPage'));
const AffiliatePage = lazy(() => import('./pages/AffiliatePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const TagHubPage = lazy(() => import('./pages/TagHubPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const InquiriesPage = lazy(() => import('./pages/InquiriesPage'));
const MyInquiriesPage = lazy(() => import('./pages/MyInquiriesPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminOperatorsPage = lazy(() => import('./pages/AdminOperatorsPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminBadgeManagementPage = lazy(() => import('./pages/AdminBadgeManagementPage'));
const AdminBlogPage = lazy(() => import('./pages/AdminBlogPage'));
const AdminBlogFormPage = lazy(() => import('./pages/AdminBlogFormPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const WithdrawalsPage = lazy(() => import('./pages/WithdrawalsPage'));
const AdminWithdrawalsPage = lazy(() => import('./pages/AdminWithdrawalsPage'));
const ApprovalRequestsPage = lazy(() => import('./pages/ApprovalRequestsPage'));
const AdminBadgeRequestsPage = lazy(() => import('./pages/AdminBadgeRequestsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const ViewHistoryPage = lazy(() => import('./pages/ViewHistoryPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  // Prefetch critical routes on mount
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const criticalRoutes = ['/search', '/products'];
        criticalRoutes.forEach(route => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
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
          <Route path="destinations/:city" element={
            <Suspense fallback={<LoadingFallback />}>
              <DestinationPage />
            </Suspense>
          } />
          <Route path="categories/:category" element={
            <Suspense fallback={<LoadingFallback />}>
              <CategoryPage />
            </Suspense>
          } />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="blog" element={
            <Suspense fallback={<LoadingFallback />}>
              <BlogPage />
            </Suspense>
          } />
          <Route path="blog/:slug" element={
            <Suspense fallback={<LoadingFallback />}>
              <BlogPostPage />
            </Suspense>
          } />
          <Route path="tags/:tag" element={
            <Suspense fallback={<LoadingFallback />}>
              <TagHubPage />
            </Suspense>
          } />
          <Route path="booking" element={
            <Suspense fallback={<LoadingFallback />}>
              <BookingPage />
            </Suspense>
          } />
          <Route path="dashboard" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <DashboardPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="profile" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ProfilePage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="favorites" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FavoritesPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="loyalty" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <LoyaltyPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="view-history" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ViewHistoryPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="dashboard/inquiries" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyInquiriesPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="operator/wizard" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorWizardPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="operator/onboarding" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorOnboardingPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="operator/dashboard" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorDashboardPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/products" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorProductsPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/products/new" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorProductFormPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/products/:id/edit" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorProductFormPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/bookings" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OperatorBookingsPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/analytics" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AnalyticsPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="operator/inquiries" element={
            <OperatorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <InquiriesPage />
              </Suspense>
            </OperatorRoute>
          } />
          <Route path="admin/dashboard" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboardPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/operators" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminOperatorsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/products" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminProductsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/users" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminUsersPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/settings" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminSettingsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/badges" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBadgeManagementPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/blog" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/blog/new" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogFormPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/blog/:id/edit" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogFormPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="notifications" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <NotificationsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="operator/withdrawals" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <WithdrawalsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/withdrawals" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminWithdrawalsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/approval-requests" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ApprovalRequestsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="admin/badge-requests" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBadgeRequestsPage />
              </Suspense>
            </PrivateRoute>
          } />
        </Route>
        
        {/* Checkout routes without layout */}
        <Route path="checkout" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <CheckoutPage />
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="booking-success" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <BookingSuccessPage />
            </Suspense>
          </PrivateRoute>
        } />
        
        {/* Auth routes without layout */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="affiliate" element={
            <Suspense fallback={<LoadingFallback />}>
              <AffiliatePage />
            </Suspense>
          } />
          <Route path="help" element={
            <Suspense fallback={<LoadingFallback />}>
              <HelpPage />
            </Suspense>
          } />
          <Route path="privacy" element={
            <Suspense fallback={<LoadingFallback />}>
              <PrivacyPage />
            </Suspense>
          } />
          <Route path="about" element={
            <Suspense fallback={<LoadingFallback />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="terms" element={
            <Suspense fallback={<LoadingFallback />}>
              <PrivacyPage />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<LoadingFallback />}>
              <HelpPage />
            </Suspense>
          } />
        <Route path="operator/register" element={<RegisterPage />} />
      </Routes>
    </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
