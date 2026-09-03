const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://127.0.0.1:8000/api/v1'

const BACKEND_URL = API_URL.replace(
  /\/api\/v1\/?$/,
  '',
)

export function getImageUrl(
  image?: string | null,
): string | null {
  if (!image) {
    return null
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image
  }

  return `${BACKEND_URL}/storage/${image}`
}
