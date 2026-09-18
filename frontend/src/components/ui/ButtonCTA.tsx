import { useLocation } from 'react-router-dom'

function ButtonCTA() {
  const location = useLocation()

  // Sembunyikan floating button di halaman keranjang agar tidak menutupi bar checkout mobile
  if (location.pathname === '/cart') {
    return null
  }

  const whatsappNumber = '6289669743193'

  const message = encodeURIComponent(
    'Halo Pawon Hara, saya ingin pesan nasi box.'
  )

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat melalui WhatsApp"
      className="group fixed bottom-6 right-4 z-50"
    >
        <div className="w-8 h-8 md:h-12 md:w-12 bottom-4 text-3xl right-3 flex justify-center text-white items-center fixed z-10 bg-green-400 rounded-full duration-300 transition-all">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 md:h-8 md:w-8"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.52 0 .18 5.34.18 11.9c0 2.1.55 4.15 1.6 5.96L.08 24l6.28-1.65a11.9 11.9 0 0 0 5.7 1.45h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.08 21.77h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.73.98.99-3.64-.23-.37a9.84 9.84 0 0 1-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.9 7c0 5.45-4.44 9.89-9.91 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
        <div className="absolute h-7 w-7 md:h-10 md:w-10 rounded-full bg-green-500 z-20 animate-ping"></div>
        </div>
    </a>
  )
}

export default ButtonCTA
