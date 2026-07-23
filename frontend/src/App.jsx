import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MobileMenuProvider } from './context/MobileMenuContext';
import Layout from './components/Layout';
import CartDrawer from './components/CartDrawer';
import RtlDocumentSync from './components/RtlDocumentSync';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';
import LanguageRoot from './components/LanguageRoot';
import { RootLangRedirect, LegacyPublicRedirect } from './components/LangRedirects';

// Critical components (loaded immediately)
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import OperatorRoute from './components/OperatorRoute';
import AdminRoute from './components/AdminRoute';

// Critical auth pages (loaded immediately)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Lazy loaded catalogue pages (perf)
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));

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
const OperatorAccountPage = lazy(() => import('./pages/OperatorAccountPage'));
const OperatorSupportPage = lazy(() => import('./pages/OperatorSupportPage'));
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
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const PressPage = lazy(() => import('./pages/PressPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const CookieConsentPage = lazy(() => import('./pages/CookieConsentPage'));
const OperatorHelpPage = lazy(() => import('./pages/OperatorHelpPage'));
const OperatorResourcesPage = lazy(() => import('./pages/OperatorResourcesPage'));
const OperatorCommunityPage = lazy(() => import('./pages/OperatorCommunityPage'));
import DashboardShell from './components/DashboardShell';
const AdminPendingPaymentsPage = lazy(() => import('./pages/AdminPendingPaymentsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminBookingsPage = lazy(() => import('./pages/AdminBookingsPage'));
const AdminFinancePage = lazy(() => import('./pages/AdminFinancePage'));
const AdminChatInbox = lazy(() => import('./pages/AdminChatInbox'));
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'));
const AdminFaqPage = lazy(() => import('./pages/AdminFaqPage'));

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
        const criticalRoutes = ['/fr/explore', '/fr/search'];
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
      <MobileMenuProvider>
      <Router>
        <ScrollToTopOnNavigate />
        <RtlDocumentSync />
        <CartDrawer />
      <Routes>
        {/* Auth routes without layout, without lang prefix */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/operator/register" element={<RegisterPage />} />

        {/* Checkout routes without layout, without lang prefix */}
        <Route path="/checkout" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <CheckoutPage />
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="/booking-success" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <BookingSuccessPage />
            </Suspense>
          </PrivateRoute>
        } />

        {/* Backoffice shells — hors Layout public (pas de Header/Footer site) */}
        <Route
          path="/operator"
          element={
            <OperatorRoute>
              <DashboardShell variant="operator" />
            </OperatorRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorDashboardPage />
            </Suspense>
          } />
          <Route path="products" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorProductsPage />
            </Suspense>
          } />
          <Route path="products/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorProductFormPage />
            </Suspense>
          } />
          <Route path="products/:id/edit" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorProductFormPage />
            </Suspense>
          } />
          <Route path="bookings" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorBookingsPage />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsPage />
            </Suspense>
          } />
          <Route path="inquiries" element={
            <Suspense fallback={<LoadingFallback />}>
              <InquiriesPage />
            </Suspense>
          } />
          <Route path="support" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorSupportPage />
            </Suspense>
          } />
          <Route path="withdrawals" element={
            <Suspense fallback={<LoadingFallback />}>
              <WithdrawalsPage />
            </Suspense>
          } />
          <Route path="wizard" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorWizardPage />
            </Suspense>
          } />
          <Route path="account" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorAccountPage />
            </Suspense>
          } />
          <Route path="onboarding" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorOnboardingPage />
            </Suspense>
          } />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardShell variant="admin" />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminDashboardPage />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminAnalyticsPage />
            </Suspense>
          } />
          <Route path="operators" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminOperatorsPage />
            </Suspense>
          } />
          <Route path="products" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminProductsPage />
            </Suspense>
          } />
          <Route path="products/:id/edit" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorProductFormPage />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminUsersPage />
            </Suspense>
          } />
          <Route path="bookings" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBookingsPage />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminSettingsPage />
            </Suspense>
          } />
          <Route path="badges" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBadgeManagementPage />
            </Suspense>
          } />
          <Route path="blog" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBlogPage />
            </Suspense>
          } />
          <Route path="blog/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBlogFormPage />
            </Suspense>
          } />
          <Route path="blog/:id/edit" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBlogFormPage />
            </Suspense>
          } />
          <Route path="faq" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminFaqPage />
            </Suspense>
          } />
          <Route path="pending-payments" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminPendingPaymentsPage />
            </Suspense>
          } />
          <Route path="withdrawals" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminWithdrawalsPage />
            </Suspense>
          } />
          <Route path="finance" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminFinancePage />
            </Suspense>
          } />
          <Route path="approval-requests" element={
            <Suspense fallback={<LoadingFallback />}>
              <ApprovalRequestsPage />
            </Suspense>
          } />
          <Route path="badge-requests" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminBadgeRequestsPage />
            </Suspense>
          } />
          <Route path="chat" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminChatInbox />
            </Suspense>
          } />
          <Route path="reviews" element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminReviewsPage />
            </Suspense>
          } />
        </Route>

        {/* Account shell — Layout (header + footer), pas de préfixe de langue */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <DashboardPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ProfilePage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="/favorites" element={
              <Suspense fallback={<LoadingFallback />}>
                <FavoritesPage />
              </Suspense>
          } />
          <Route path="/loyalty" element={
            <Suspense fallback={<LoadingFallback />}>
              <LoyaltyPage />
            </Suspense>
          } />
          <Route path="/view-history" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ViewHistoryPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <NotificationsPage />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="/dashboard/inquiries" element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyInquiriesPage />
              </Suspense>
            </PrivateRoute>
          } />
          {/* Public operator footer pages — déclarées avant le shell /operator */}
          <Route path="/operator/help" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorHelpPage />
            </Suspense>
          } />
          <Route path="/operator/resources" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorResourcesPage />
            </Suspense>
          } />
          <Route path="/operator/community" element={
            <Suspense fallback={<LoadingFallback />}>
              <OperatorCommunityPage />
            </Suspense>
          } />
        </Route>

        {/* [INT-01] Redirections legacy (URL sans préfixe → URL avec préfixe de langue) */}
        {/* Doivent être déclarées AVANT /:lang pour intercepter ces chemins publics */}
        <Route path="/" element={<RootLangRedirect />} />
        <Route path="/search" element={<LegacyPublicRedirect />} />
        <Route path="/explore" element={<LegacyPublicRedirect />} />
        <Route path="/stays" element={<LegacyPublicRedirect />} />
        <Route path="/extras" element={<LegacyPublicRedirect />} />
        <Route path="/products/:id" element={<LegacyPublicRedirect />} />
        <Route path="/experiences/:id" element={<LegacyPublicRedirect />} />
        <Route path="/destinations/:city" element={<LegacyPublicRedirect />} />
        <Route path="/categories/:category" element={<LegacyPublicRedirect />} />
        <Route path="/blog" element={<LegacyPublicRedirect />} />
        <Route path="/blog/:slug" element={<LegacyPublicRedirect />} />
        <Route path="/tags/:tag" element={<LegacyPublicRedirect />} />
        <Route path="/about" element={<LegacyPublicRedirect />} />
        <Route path="/help" element={<LegacyPublicRedirect />} />
        <Route path="/contact" element={<LegacyPublicRedirect />} />
        <Route path="/faq" element={<LegacyPublicRedirect />} />
        <Route path="/culture" element={<LegacyPublicRedirect />} />
        <Route path="/how-it-works" element={<LegacyPublicRedirect />} />
        <Route path="/affiliate" element={<LegacyPublicRedirect />} />
        <Route path="/partners/signup" element={<LegacyPublicRedirect />} />
        <Route path="/terms" element={<LegacyPublicRedirect />} />
        <Route path="/privacy" element={<LegacyPublicRedirect />} />
        <Route path="/safety" element={<LegacyPublicRedirect />} />
        <Route path="/careers" element={<LegacyPublicRedirect />} />
        <Route path="/press" element={<LegacyPublicRedirect />} />
        <Route path="/cookies" element={<LegacyPublicRedirect />} />
        <Route path="/accessibility" element={<LegacyPublicRedirect />} />
        <Route path="/cookie-consent" element={<LegacyPublicRedirect />} />
        <Route path="/booking" element={<LegacyPublicRedirect />} />

        {/* [INT-01] Pages publiques préfixées par la langue (/:lang/...) */}
        <Route path="/:lang" element={<LanguageRoot />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={
              <Suspense fallback={<LoadingFallback />}>
                <SearchPage />
              </Suspense>
            } />
            <Route path="explore" element={
              <Suspense fallback={<LoadingFallback />}>
                <SearchPage />
              </Suspense>
            } />
            <Route path="stays" element={
              <Suspense fallback={<LoadingFallback />}>
                <SearchPage />
              </Suspense>
            } />
            <Route path="extras" element={
              <Suspense fallback={<LoadingFallback />}>
                <SearchPage />
              </Suspense>
            } />
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
            <Route path="products/:id" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProductDetailPage />
              </Suspense>
            } />
            <Route path="experiences/:id" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProductDetailPage />
              </Suspense>
            } />
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
            <Route path="safety" element={
              <Suspense fallback={<LoadingFallback />}>
                <SafetyPage />
              </Suspense>
            } />
            <Route path="careers" element={
              <Suspense fallback={<LoadingFallback />}>
                <CareersPage />
              </Suspense>
            } />
            <Route path="press" element={
              <Suspense fallback={<LoadingFallback />}>
                <PressPage />
              </Suspense>
            } />
            <Route path="cookies" element={
              <Suspense fallback={<LoadingFallback />}>
                <CookiesPage />
              </Suspense>
            } />
            <Route path="accessibility" element={
              <Suspense fallback={<LoadingFallback />}>
                <AccessibilityPage />
              </Suspense>
            } />
            <Route path="cookie-consent" element={
              <Suspense fallback={<LoadingFallback />}>
                <CookieConsentPage />
              </Suspense>
            } />

            {/* [TASK-10] 404 catch-all (dans le Layout) */}
            <Route path="*" element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            } />
          </Route>
        </Route>
      </Routes>
    </Router>
      </MobileMenuProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
