import { Route, Routes } from 'react-router-dom'

import LoginPage from '../pages/auth/LoginPage'
import ProtectedRoute from '../middleware/ProtectedRoute'
import Notfound from '../pages/Notfound'

// admin
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminProducts from '../pages/admin/products/AdminProducts'
import AdminCategories from '../pages/admin/AdminCategories'
import CreateProduct from '../pages/admin/products/CreateProduct'
import EditProduct from '../pages/admin/products/EditProducts'

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

export default function AppRoutes() {
  return (
    <Routes>

      {/* auth */}
      <Route element={<AuthLayout />}>
        <Route path="/hc-admin" element={<LoginPage />} />
      </Route>

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
      </Route>

      {/* 404 */}
      <Route path="*" element={<Notfound />} />

    </Routes>
  )
}
