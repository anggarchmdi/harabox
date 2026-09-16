import { Route, Routes } from 'react-router-dom'

import LoginPage from '../pages/auth/LoginPage'
import ProtectedRoute from '../middleware/ProtectedRoute'
import Notfound from '../pages/Notfound'
// import LogoSpinnerDemo from '../pages/demo/LogoSpinnerDemo'

// admin
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminProducts from '../pages/admin/products/AdminProducts'
import AdminCategories from '../pages/admin/AdminCategories'
import AdminAddons from '../pages/admin/addons/AdminAddons'
import CreateProduct from '../pages/admin/products/CreateProduct'
import EditProduct from '../pages/admin/products/EditProducts'
import AdminTestimonials from '../pages/admin/AdminTestimonials'
import AdminSettings from '../pages/admin/AdminSettings'

// layout
import AdminLayout from '../layout/AdminLayout'
import AuthLayout from '../layout/AuthLayout'
import MainLayout from '../layout/MainLayout'
import MenuLayout from '../layout/MenuLayout'

// user
import HomePage from '../pages/HomePage'
import MenuPage from '../pages/MenuPage'
import TentangKami from '../pages/TentangKami'
import CaraPesan from '../pages/CaraPesan'
import ProductDetailPage from '../pages/ProductDetailPage'
import TestimonialPage from '../pages/TestimonialPage'
import CartPage from '../pages/CartPage'
import OrderTrackingPage from '../pages/OrderTrackingPage'

export default function AppRoutes() {
  return (
    <Routes>

      {/* auth */}
      <Route element={<AuthLayout />}>
        <Route path="/hc-admin" element={<LoginPage />} />
      </Route>

      {/* demo loader preview (terpisah & tidak merubah alur produksi) */}
      {/* <Route path="/demo/loader" element={<LogoSpinnerDemo />} /> */}

      {/* admin */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>

          {/* dashboard */}
          <Route index element={<AdminDashboard />} />

          {/* orders */}
          <Route path="orders" element={<AdminOrders />} />

          {/* products */}
          <Route path="products">
            <Route index element={<AdminProducts />} />
            <Route path="create" element={<CreateProduct />} />
            <Route path=":id/edit" element={<EditProduct />} />
          </Route>

          {/* categories */}
          <Route path="categories" element={<AdminCategories />} />

          {/* addons */}
          <Route path="addons" element={<AdminAddons />} />

          {/* testimonials */}
          <Route path="testimonials" element={<AdminTestimonials />} />

          {/* settings & capacity */}
          <Route path="settings" element={<AdminSettings />} />

        </Route>
      </Route>

      {/* user */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<MenuLayout />}>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:slug" element={<ProductDetailPage />} />
        <Route path="/tentang-kami" element={<TentangKami />} />
        <Route path="/cara-pesan" element={<CaraPesan />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/cek-pesanan" element={<OrderTrackingPage />} />
        <Route path="/cek-pesanan/:orderCode" element={<OrderTrackingPage />} />
        {/* Halaman input testimoni khusus (tersembunyi dari navigasi menu) */}
        <Route path="/testimoni" element={<TestimonialPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Notfound />} />

    </Routes>
  )
}
