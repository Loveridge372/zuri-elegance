
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";

import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import BrandsPage from "./pages/BrandsPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.jsx";
import PaymentFailed from "./pages/PaymentFailed.jsx";

import BeautyAnalysisPage from "./pages/BeautyAnalysisPage";
import BeautyDashboardPage from "./pages/BeautyDashboardPage";
import BeautyHistoryPage from "./pages/BeautyHistoryPage";
import BeautyAssistantPage from "./pages/BeautyAssistantPage.jsx";

import WishlistPage from "./pages/WishlistPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import DeliveryPage from "./pages/DeliveryPage.jsx";

import ContactPage from "./pages/ContactPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";

import ReturnsPolicyPage from "./pages/ReturnsPolicyPage.jsx";
import ShippingPolicyPage from "./pages/ShippingPolicyPage.jsx";
import TermsConditionsPage from "./pages/TermsConditionsPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage.jsx";
import AdminCustomerDetailsPage from "./pages/admin/AdminCustomerDetailsPage.jsx";
import AdminOrderDetailsPage from "./pages/admin/AdminOrderDetailsPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
import AdminRoute from "./pages/admin/AdminRoute.jsx";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminBeautyIntelligencePage from "./pages/admin/AdminBeautyIntelligencePage.jsx";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage.jsx";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage.jsx";
import AdminRewardsPage from "./pages/admin/AdminRewardsPage.jsx";

import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

import LuxeFooter from "./components/LuxeFooter.jsx";
import FloatingAssistantChat from "./components/FloatingAssistantChat.jsx";

export default function App() {
  const location = useLocation();
  const rootParams = new URLSearchParams(location.search);
  const rootPaymentReference =
    rootParams.get("reference") ||
    rootParams.get("ref") ||
    rootParams.get("trxref") ||
    localStorage.getItem("zuri_pending_payment_reference");

  const hideFooter = [
    "/",
    "/login",
    "/register",
    "/reset-password",
    "/verify",
    "/verify-email",
  ].includes(location.pathname);

  return (
    <>
      <Routes>

        {/* DEFAULT */}
        <Route
          path="/"
          element={
            rootPaymentReference ? (
              <PaymentSuccessPage />
            ) : (
              <Navigate to="/products" replace />
            )
          }
        />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* SHOP */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />

        {/* CART + CHECKOUT */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* USER */}
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />

        {/* INFO PAGES */}
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/returns-policy"
          element={<ReturnsPolicyPage />}
        />

        <Route
          path="/shipping-policy"
          element={<ShippingPolicyPage />}
        />

        <Route
          path="/terms-and-conditions"
          element={<TermsConditionsPage />}
        />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicyPage />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Navigate to="/admin/customers" replace />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminCustomersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/customers/:id"
          element={
            <AdminRoute>
              <AdminCustomerDetailsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProductsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/brands"
          element={
            <AdminRoute>
              <AdminBrandsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <AdminOrderDetailsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/beauty-intelligence"
          element={
            <AdminRoute>
              <AdminBeautyIntelligencePage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <AdminRoute>
              <AdminReviewsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AdminNotificationsPage />
            </AdminRoute>
          }
        />

        <Route
         path="/beauty-dashboard"
          element={
          <BeautyDashboardPage />} 
          />

        <Route
         path="/beauty-analysis"
          element={
          <BeautyAnalysisPage />} 
          />

        <Route
        path="/beauty-history" 
        element={
        <BeautyHistoryPage />} 
        />

        <Route
        path="/beauty-assistant"
        element={
        <BeautyAssistantPage />}
        />

        <Route 
        path="/admin/coupons" 
        element={
        <AdminRoute>
        <AdminCouponsPage />
        </AdminRoute>}
         />

        <Route 
        path="/admin/rewards" 
        element={
        <AdminRoute>
        <AdminRewardsPage />
        </AdminRoute>}
         />

        <Route 
        path="/admin/settings" 
        element={
        <AdminRoute>
        <AdminSettingsPage />
        </AdminRoute>}
         />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/products" replace />} />

      </Routes>

      {!hideFooter && <LuxeFooter />}

      <FloatingAssistantChat />
    </>
  );
}
