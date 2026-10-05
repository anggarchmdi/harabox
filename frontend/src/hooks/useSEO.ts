import { useEffect } from 'react'

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  noindex?: boolean
  schema?: Record<string, unknown> | Array<Record<string, unknown>>
}

const DEFAULT_TITLE = 'Pawon Hara | Nasi Box & Katering Jogja - Higienis, Murah & Enak'
const DEFAULT_DESCRIPTION =
  'Pawon Hara melayani pesanan nasi box, bento box, dan katering di Jogja untuk kebutuhan kantor, rapat, gathering, syukuran, dan berbagai acara. Higienis, halal, dan harga terjangkau.'
const DEFAULT_OG_IMAGE = 'https://pawonhara.com/og-image.jpg'
const BASE_URL = 'https://pawonhara.com'

function setOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setOrCreateCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  schema,
}: SEOProps = {}) {
  useEffect(() => {
    // 1. Document Title
    const formattedTitle = title
      ? title.includes('Pawon Hara')
        ? title
        : `${title} | Pawon Hara`
      : DEFAULT_TITLE
    document.title = formattedTitle

    // 2. Primary Meta Tags
    setOrCreateMeta('name', 'title', formattedTitle)
    setOrCreateMeta('name', 'description', description)
    if (keywords) {
      setOrCreateMeta('name', 'keywords', keywords)
    }

    // 3. Robots meta tag
    if (noindex) {
      setOrCreateMeta('name', 'robots', 'noindex, nofollow')
    } else {
      setOrCreateMeta(
        'name',
        'robots',
        'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
      )
    }

    // 4. Canonical URL
    const resolvedCanonical = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${BASE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
      : typeof window !== 'undefined'
        ? `${BASE_URL}${window.location.pathname}`
        : BASE_URL
    setOrCreateCanonical(resolvedCanonical)

    // 5. Open Graph Meta Tags
    setOrCreateMeta('property', 'og:title', formattedTitle)
    setOrCreateMeta('property', 'og:description', description)
    setOrCreateMeta('property', 'og:url', resolvedCanonical)
    setOrCreateMeta('property', 'og:type', ogType)
    setOrCreateMeta('property', 'og:image', ogImage)
    setOrCreateMeta('property', 'og:site_name', 'Pawon Hara')
    setOrCreateMeta('property', 'og:locale', 'id_ID')

    // 6. Twitter / X Meta Tags
    setOrCreateMeta('name', 'twitter:card', 'summary_large_image')
    setOrCreateMeta('name', 'twitter:title', formattedTitle)
    setOrCreateMeta('name', 'twitter:description', description)
    setOrCreateMeta('name', 'twitter:image', ogImage)

    // 7. Dynamic JSON-LD Structured Data
    const schemaScriptId = 'dynamic-page-schema'
    const existingScript = document.getElementById(schemaScriptId)

    if (schema) {
      const script = (existingScript as HTMLScriptElement) || document.createElement('script')
      script.id = schemaScriptId
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(schema)
      if (!existingScript) {
        document.head.appendChild(script)
      }
    } else if (existingScript) {
      existingScript.remove()
    }

    return () => {
      // Clean up dynamic schema when unmounting page
      const scriptToRemove = document.getElementById(schemaScriptId)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [title, description, keywords, canonical, ogImage, ogType, noindex, schema])
}
