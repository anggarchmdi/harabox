import { Outlet } from 'react-router-dom'

import LogoImg from '../assets/logo.webp'

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* =====================================================
          LEFT — BRANDING
      ====================================================== */}
      <section className="relative hidden min-h-screen overflow-hidden bg-linear-to-br from-red-800 via-red-600 to-red-500 lg:flex lg:flex-col">
        {/* Background decoration */}
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-red-500/50" />

        <div className="absolute -bottom-52 -left-52 h-[620px] w-[620px] rounded-full border-[90px] border-white/5" />

        <div className="absolute right-24 top-1/2 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="absolute bottom-32 right-20 h-24 w-24 rounded-full bg-white/5" />

        {/* Small dots */}
        <div className="absolute left-20 top-1/3 grid grid-cols-3 gap-2 opacity-20">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-white"
            />
          ))}
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 flex min-h-screen flex-col px-12 py-10 xl:px-16">
          {/* Logo */}
          <div>
            <img
              src={LogoImg}
              alt="Hara Chicken"
              className="w-36"
            />
          </div>

          {/* Main content */}
          <div className="my-auto max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                HaraBox Admin
              </span>
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
              Kelola catering.
              <br />
              <span className="text-yellow-300">
                Lebih simpel.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-7 text-red-100 xl:text-lg">
              Kelola menu, paket catering, pesanan, dan kebutuhan
              operasional HaraBox dari satu dashboard.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-red-800">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="M8 16v-4" />
                    <path d="M12 16V8" />
                    <path d="M16 16v-6" />
                  </svg>
                </div>

                <p className="text-sm font-bold text-white">
                  Kelola Pesanan
                </p>

                <p className="mt-1 text-xs leading-5 text-red-100/80">
                  Pantau dan proses pesanan dengan mudah.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-red-800">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 5h16v14H4z" />
                    <path d="M8 9h8" />
                    <path d="M8 13h5" />
                  </svg>
                </div>

                <p className="text-sm font-bold text-white">
                  Kelola Menu
                </p>

                <p className="mt-1 text-xs leading-5 text-red-100/80">
                  Atur paket dan produk yang tersedia.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-red-100/70">
                HaraBox Catering
              </p>

              <p className="mt-1 text-xs text-red-100/50">
                © 2026 HaraBox. All rights reserved.
              </p>
            </div>

            <div className="hidden text-right xl:block">
              <p className="text-xs text-red-100/50">
                Admin Dashboard
              </p>

              <p className="mt-1 text-xs font-semibold text-white/80">
                v1.0.0
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT — AUTH FORM
      ====================================================== */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12 sm:px-10">
        {/* Mobile background accent */}
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-red-50 lg:hidden" />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <img
              src={LogoImg}
              alt="Hara Chicken"
              className="w-36"
            />
          </div>

          {/* Form */}
          <Outlet />

          {/* Bottom helper */}
          <p className="mt-10 text-center text-xs text-gray-400">
            HaraBox Admin Dashboard
          </p>
        </div>
      </section>
    </main>
  )
}
