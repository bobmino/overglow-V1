import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import CartDrawer from './components/CartDrawer';

// Critical components (loaded immediately)
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import OperatorRoute from './components/OperatorRoute';
import AdminRoute from './components/AdminRoute';

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
const CircuitPage = lazy(() => import('./pages/CircuitPage'));
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
const PartnerSignupPage = lazy(() => import('./pages/PartnerSignupPage'));
const CulturePage = lazy(() => import('./pages/CulturePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import PlaceholderPage from './components/PlaceholderPage';
const AdminPendingPaymentsPage = lazy(() => import('./pages/AdminPendingPaymentsPage'));

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
        <CartDrawer />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
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
          <Route path="experiences/:id" element={<ProductDetailPage />} />
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
              <Suspense fallback={<LoadingFallback />}>
                <FavoritesPage />
              </Suspense>
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
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboardPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/operators" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminOperatorsPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/products" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminProductsPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/users" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminUsersPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/settings" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminSettingsPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/badges" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBadgeManagementPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/blog" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/blog/new" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogFormPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/blog/:id/edit" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBlogFormPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/pending-payments" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminPendingPaymentsPage />
              </Suspense>
            </AdminRoute>
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
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminWithdrawalsPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/approval-requests" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ApprovalRequestsPage />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/badge-requests" element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBadgeRequestsPage />
              </Suspense>
            </AdminRoute>
          } />

          {/* [TASK-10] Pages publiques dans le Layout (header + footer) */}
          <Route path="about" element={
            <Suspense fallback={<LoadingFallback />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="terms" element={
            <Suspense fallback={<LoadingFallback />}>
              <TermsPage />
            </Suspense>
          } />
          <Route path="privacy" element={
            <Suspense fallback={<LoadingFallback />}>
              <PrivacyPage />
            </Suspense>
          } />
          <Route path="help" element={
            <Suspense fallback={<LoadingFallback />}>
              <HelpPage />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<LoadingFallback />}>
              <HelpPage />
            </Suspense>
          } />
          <Route path="faq" element={
            <Suspense fallback={<LoadingFallback />}>
              <FAQPage />
            </Suspense>
          } />
          <Route path="culture" element={
            <Suspense fallback={<LoadingFallback />}>
              <CulturePage />
            </Suspense>
          } />
          <Route path="how-it-works" element={
            <Suspense fallback={<LoadingFallback />}>
              <HowItWorksPage />
            </Suspense>
          } />
          <Route path="affiliate" element={
            <Suspense fallback={<LoadingFallback />}>
              <AffiliatePage />
            </Suspense>
          } />
          <Route path="partners/signup" element={
            <Suspense fallback={<LoadingFallback />}>
              <PartnerSignupPage />
            </Suspense>
          } />
          <Route path="safety" element={<PlaceholderPage titleKey="footer.safety" defaultTitle="Sécurité" />} />
          <Route path="careers" element={<PlaceholderPage titleKey="footer.careers" defaultTitle="Carrières" />} />
          <Route path="press" element={<PlaceholderPage titleKey="footer.press" defaultTitle="Presse" />} />
          <Route path="operator/help" element={<PlaceholderPage titleKey="footer.operator_help" defaultTitle="Centre d'aide opérateur" />} />
          <Route path="operator/resources" element={<PlaceholderPage titleKey="footer.operator_resources" defaultTitle="Ressources" />} />
          <Route path="operator/community" element={<PlaceholderPage titleKey="footer.operator_community" defaultTitle="Communauté" />} />
          <Route path="cookies" element={<PlaceholderPage titleKey="footer.cookies" defaultTitle="Cookies" />} />
          <Route path="accessibility" element={<PlaceholderPage titleKey="footer.accessibility" defaultTitle="Accessibilité" />} />
          <Route path="cookie-consent" element={<PlaceholderPage titleKey="footer.cookie_consent" defaultTitle="Préférences de cookies" />} />

          {/* [TASK-10] 404 catch-all (dans le Layout) */}
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback />}>
              <NotFoundPage />
            </Suspense>
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
          <Route path="operator/register" element={<RegisterPage />} />
      </Routes>
    </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
