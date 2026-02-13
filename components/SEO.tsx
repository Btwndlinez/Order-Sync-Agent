/**
 * SEO Head Component - Meta Tags, OpenGraph, Twitter Cards, & Schema.org
 * Optimized for search visibility and social sharing
 */



interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  twitterCard?: "summary" | "summary_large_image" | "app" | "player"
  twitterSite?: string
  twitterCreator?: string
  productSchema?: ProductSchema
  softwareApplicationSchema?: SoftwareApplicationSchema
}

interface ProductSchema {
  name: string
  description: string
  brand?: string
  offers: OfferSchema[]
}

interface SoftwareApplicationSchema {
  name: string
  description: string
  applicationCategory: string
  operatingSystem: string
  offers?: OfferSchema[]
  aggregateRating?: {
    "@type": string
    ratingValue: string
    reviewCount: string
  }
}

interface OfferSchema {
  price: string
  priceCurrency: string
  availability?: string
  url: string
  priceValidUntil?: string
  seller?: {
    name: string
  }
}

export function SEO({
  title = "Order Sync Agent | Generate Stripe Checkout Links from Messenger & WhatsApp",
  description = "Stop manual data entry. Use AI to extract order details from Messenger chats and generate Stripe checkout links instantly. Close sales 3x faster.",
  keywords = "Stripe for Facebook Marketplace, Messenger checkout automation, social selling tool, automated Stripe links, WhatsApp order management",
  ogTitle = "Turn Messenger Chats into Paid Orders in 1-Click 🚀",
  ogDescription = "Use AI to extract order details from Messenger & WhatsApp chats and generate Stripe checkout links instantly. Close sales 3x faster.",
  ogImage = "/logo.svg",
  ogUrl = "https://www.ordersyncagent.com",
  twitterCard = "summary_large_image",
  twitterSite = "@ordersyncagent",
  twitterCreator = "@ordersyncagent",
  productSchema,
  softwareApplicationSchema,
}: SEOProps) {
  const structuredData = productSchema
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productSchema.name,
        description: productSchema.description,
        brand: productSchema.brand
          ? {
              "@type": "Brand",
              name: productSchema.brand,
            }
          : undefined,
        offers: productSchema.offers.map((offer) => ({
          "@type": "Offer",
          price: offer.price,
          priceCurrency: offer.priceCurrency,
          availability: offer.availability || "https://schema.org/InStock",
          url: offer.url,
          priceValidUntil: offer.priceValidUntil,
          seller: offer.seller
            ? {
                "@type": "Organization",
                name: offer.seller.name,
              }
            : undefined,
        })),
      }
    : softwareApplicationSchema
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: softwareApplicationSchema.name,
        description: softwareApplicationSchema.description,
        applicationCategory: softwareApplicationSchema.applicationCategory,
        operatingSystem: softwareApplicationSchema.operatingSystem,
        offers: softwareApplicationSchema.offers?.map((offer) => ({
          "@type": "Offer",
          price: offer.price,
          priceCurrency: offer.priceCurrency,
          availability: offer.availability || "https://schema.org/InStock",
          url: offer.url,
          priceValidUntil: offer.priceValidUntil,
          seller: offer.seller
            ? {
                "@type": "Organization",
                name: offer.seller.name,
              }
            : undefined,
        })),
        aggregateRating: softwareApplicationSchema.aggregateRating,
      }
    : null

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={ogUrl} />

      {/* Favicon & Icons */}
      <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/logo.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo.svg" />
      <link rel="mask-icon" href="/logo.svg" color="#1877F2" />
      <meta name="msapplication-TileImage" content="/logo.svg" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Order Sync Agent" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="theme-color" content="#1877F2" />
      <meta name="msapplication-TileColor" content="#1877F2" />

      {/* JSON-LD Schema.org */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
        />
      )}
    </>
  )
}

export const PRO_PLAN_SCHEMA = {
  name: "Order Sync Agent Pro",
  description:
    "AI-powered checkout generation for social commerce. Generate Stripe links from Messenger & WhatsApp chats instantly.",
  brand: "Order Sync Agent",
  offers: [
    {
      price: "19.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.ordersyncagent.com#pricing",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      seller: {
        name: "Order Sync Agent",
      },
    },
  ],
}

export const PRICING_PAGE_SCHEMA = {
  "@context": "https://schema.org" as const,
  "@type": "WebPage" as const,
  name: "Order Sync Agent Pricing",
  description:
    "Simple, transparent pricing for AI-powered checkout generation. Starter ($0), Pro ($19/mo), Business ($49/mo).",
  url: "https://www.ordersyncagent.com/pricing",
}

export function PricingSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
      mainEntity: {
        "@type": "Product",
        name: "Order Sync Agent Plans",
        description:
          "Choose the right plan for your social commerce business. From free Starter to full-featured Business.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "19.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Business",
          price: "49.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      ],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  )
}

export const SOFTWARE_APPLICATION_SCHEMA = {
  name: "Order Sync Agent - Chrome Extension",
  description: "AI-powered checkout generation for social commerce. Generate Stripe links from Messenger & WhatsApp chats instantly with our Chrome extension.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Chrome",
  offers: [
    {
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.ordersyncagent.com",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      seller: {
        name: "Order Sync Agent",
      },
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "150",
  },
}

export function ChromeExtensionSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          ...SOFTWARE_APPLICATION_SCHEMA,
        }, null, 2) 
      }}
    />
  )
}
