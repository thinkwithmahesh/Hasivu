/**
 * HASIVU Platform - Production SEO Optimization System
 * Comprehensive SEO utilities for enhanced search engine visibility
 * Implements structured data, meta tags, and social media optimization
 */

import { Metadata } from 'next';

// Base application configuration
const APP_CONFIG = {
  name: 'HASIVU',
  fullName: 'HASIVU - School Meal Management Platform',
  description:
    'Complete school meal management system with real-time ordering, nutrition tracking, RFID pickup verification, and seamless payment integration for students, parents, and administrators.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://hasivu.com',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'hasivu.com',
  logo: '/icons/icon-512x512.png',
  author: 'HASIVU Team',
  keywords: [
    'school meal management',
    'student food ordering',
    'RFID verification',
    'school nutrition tracking',
    'educational technology',
    'cafeteria management',
    'meal planning software',
    'school administration',
    'parent portal',
    'student services',
  ],
  category: 'Education Technology',
  type: 'SaaS Platform',
  locale: 'en_US',
  twitter: '@hasivu_official',
  social: {
    twitter: 'https://twitter.com/hasivu_official',
    linkedin: 'https://linkedin.com/company/hasivu',
    facebook: 'https://facebook.com/hasivu.official',
    youtube: 'https://youtube.com/@hasivu',
  },
};

// SEO Page Types
export interface SEOPageConfig {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

// Generate base metadata
export function generateBaseMetadata(): Metadata {
  return {
    title: {
      default: APP_CONFIG.fullName,
      template: `%s | ${APP_CONFIG.name}`,
    },
    description: APP_CONFIG.description,
    applicationName: APP_CONFIG.name,
    authors: [{ name: APP_CONFIG.author }],
    creator: APP_CONFIG.author,
    publisher: APP_CONFIG.author,
    generator: 'Next.js',
    keywords: APP_CONFIG.keywords,
    referrer: 'origin-when-cross-origin',
    colorScheme: 'light dark',
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
      viewportFit: 'cover',
    },
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#2563eb' },
      { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' },
    ],
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: APP_CONFIG.name,
      startupImage: [
        {
          url: '/startup/iphone5.png',
          media:
            '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/startup/iphone6.png',
          media:
            '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/startup/iphoneplus.png',
          media:
            '(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/startup/iphonex.png',
          media:
            '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/startup/iphonexr.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/startup/iphonexsmax.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/startup/ipad.png',
          media:
            '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
        },
      ],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(APP_CONFIG.url),
    alternates: {
      canonical: APP_CONFIG.url,
      languages: {
        'en-US': '/en-US',
        'es-ES': '/es-ES',
        'fr-FR': '/fr-FR',
      },
    },
    openGraph: {
      type: 'website',
      siteName: APP_CONFIG.fullName,
      title: APP_CONFIG.fullName,
      description: APP_CONFIG.description,
      url: APP_CONFIG.url,
      locale: APP_CONFIG.locale,
      images: [
        {
          url: `${APP_CONFIG.url}/og/default.png`,
          width: 1200,
          height: 630,
          alt: `${APP_CONFIG.name} - School Meal Management Platform`,
          type: 'image/png',
        },
        {
          url: `${APP_CONFIG.url}/og/square.png`,
          width: 1200,
          height: 1200,
          alt: `${APP_CONFIG.name} Logo`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: APP_CONFIG.twitter,
      creator: APP_CONFIG.twitter,
      title: APP_CONFIG.fullName,
      description: APP_CONFIG.description,
      images: [`${APP_CONFIG.url}/og/twitter.png`],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: '/favicon.ico',
    },
    verification: {
      google: process.env.GOOGLE_SITEVERIFICATION,
      yandex: process.env.YANDEXVERIFICATION,
      yahoo: process.env.YAHOO_SITEVERIFICATION,
      other: {
        'facebook-domain-verification': process.env.FACEBOOK_DOMAIN_VERIFICATION || '',
        'p:domain_verify': process.env.PINTEREST_DOMAIN_VERIFICATION || '',
      },
    },
    category: APP_CONFIG.category,
    classification: APP_CONFIG.type,
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'msapplication-TileColor': '#2563eb',
      'msapplication-config': '/browserconfig.xml',
      'theme-color': '#2563eb',
    },
  };
}

// Generate page-specific metadata
export function generatePageMetadata(config: SEOPageConfig): Metadata {
  const fullTitle =
    config.title === APP_CONFIG.fullName ? config.title : `${config.title} | ${APP_CONFIG.name}`;
  const canonical = config.canonical || `${APP_CONFIG.url}${config.path}`;
  const pageUrl = `${APP_CONFIG.url}${config.path}`;
  const imageUrl = config.image
    ? `${APP_CONFIG.url}${config.image}`
    : `${APP_CONFIG.url}/og/default.png`;

  const metadata: Metadata = {
    title: fullTitle,
    description: config.description,
    keywords: [...APP_CONFIG.keywords, ...(config.keywords || [])],
    alternates: {
      canonical,
    },
    openGraph: {
      type: config.type || 'website',
      title: fullTitle,
      description: config.description,
      url: pageUrl,
      siteName: APP_CONFIG.fullName,
      locale: APP_CONFIG.locale,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      ...(config.publishedTime && { publishedTime: config.publishedTime }),
      ...(config.modifiedTime && { modifiedTime: config.modifiedTime }),
      ...(config.author && { authors: [config.author] }),
      ...(config.section && { section: config.section }),
      ...(config.tags && { tags: config.tags }),
    },
    twitter: {
      card: 'summary_large_image',
      site: APP_CONFIG.twitter,
      creator: APP_CONFIG.twitter,
      title: fullTitle,
      description: config.description,
      images: [imageUrl],
    },
    robots: {
      index: !config.noIndex,
      follow: !config.noFollow,
      googleBot: {
        index: !config.noIndex,
        follow: !config.noFollow,
      },
    },
  };

  return metadata;
}

// Structured data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.fullName,
    alternateName: APP_CONFIG.name,
    url: APP_CONFIG.url,
    logo: `${APP_CONFIG.url}${APP_CONFIG.logo}`,
    description: APP_CONFIG.description,
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-HASIVU',
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: ['English', 'Spanish', 'French'],
    },
    sameAs: Object.values(APP_CONFIG.social),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
  };
}

export function generateWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_CONFIG.fullName,
    alternateName: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: APP_CONFIG.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    softwareVersion: '1.0.0',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: APP_CONFIG.author,
    },
    screenshot: [
      `${APP_CONFIG.url}/screenshots/desktop-1.png`,
      `${APP_CONFIG.url}/screenshots/mobile-1.png`,
    ],
    featureList: [
      'Real-time meal ordering',
      'RFID verification system',
      'Nutrition tracking',
      'Payment integration',
      'Parent portal',
      'Admin dashboard',
      'Multi-language support',
    ],
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${APP_CONFIG.url}${item.url}`,
    })),
  };
}

export function generateArticleSchema(config: {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image: string;
  url: string;
  section?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.title,
    description: config.description,
    image: `${APP_CONFIG.url}${config.image}`,
    author: {
      '@type': 'Person',
      name: config.author,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.fullName,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}${APP_CONFIG.logo}`,
      },
    },
    datePublished: config.publishedTime,
    dateModified: config.modifiedTime || config.publishedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${APP_CONFIG.url}${config.url}`,
    },
    ...(config.section && { articleSection: config.section }),
    ...(config.tags && { keywords: config.tags }),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate meta tags as HTML string (for dynamic insertion)
export function generateMetaTagsHTML(config: SEOPageConfig): string {
  const canonical = config.canonical || `${APP_CONFIG.url}${config.path}`;
  const imageUrl = config.image
    ? `${APP_CONFIG.url}${config.image}`
    : `${APP_CONFIG.url}/og/default.png`;

  return `
    <!-- Basic Meta Tags -->
    <meta name="description" content="${config.description}" />
    <meta name="keywords" content="${[...APP_CONFIG.keywords, ...(config.keywords || [])].join(', ')}" />
    <meta name="author" content="${config.author || APP_CONFIG.author}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="${config.type || 'website'}" />
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${APP_CONFIG.url}${config.path}" />
    <meta property="og:site_name" content="${APP_CONFIG.fullName}" />
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${APP_CONFIG.twitter}" />
    <meta name="twitter:title" content="${config.title}" />
    <meta name="twitter:description" content="${config.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Robots -->
    <meta name="robots" content="${config.noIndex ? 'noindex' : 'index'},${config.noFollow ? 'nofollow' : 'follow'}" />
  `.trim();
}

// Pre-configured page metadata
export const PAGE_METADATA = {
  home: {
    title: APP_CONFIG.fullName,
    description: APP_CONFIG.description,
    path: '/',
    keywords: ['school meals', 'student portal', 'food ordering', 'education technology'],
  },
  login: {
    title: 'Sign In',
    description:
      'Sign in to your HASIVU account to order meals, track nutrition, and manage your school food experience.',
    path: '/login',
    keywords: ['login', 'sign in', 'student portal', 'parent access'],
    noIndex: true,
  },
  dashboard: {
    title: 'Dashboard',
    description:
      'Your HASIVU dashboard with real-time meal ordering, nutrition tracking, and account management.',
    path: '/dashboard',
    keywords: ['dashboard', 'student portal', 'meal orders', 'nutrition tracking'],
    noIndex: true,
  },
  menu: {
    title: "Today's Menu",
    description:
      "Browse today's delicious and nutritious school meal options with detailed nutrition information.",
    path: '/menu',
    keywords: ['school menu', 'meal options', 'nutrition information', 'food ordering'],
  },
  orders: {
    title: 'Order History',
    description:
      'View your complete meal order history with nutrition summaries and spending insights.',
    path: '/orders',
    keywords: ['order history', 'meal orders', 'nutrition tracking', 'spending history'],
    noIndex: true,
  },
  wallet: {
    title: 'Account Balance',
    description:
      'Manage your meal account balance, view transaction history, and add funds to your wallet.',
    path: '/wallet',
    keywords: ['account balance', 'meal wallet', 'payment history', 'add funds'],
    noIndex: true,
  },
  nutrition: {
    title: 'Nutrition Tracker',
    description:
      'Track your daily nutrition intake with detailed reports and personalized recommendations.',
    path: '/nutrition',
    keywords: ['nutrition tracking', 'dietary analysis', 'health monitoring', 'meal planning'],
    noIndex: true,
  },
  support: {
    title: 'Help & Support',
    description:
      'Get help with your HASIVU account, find answers to common questions, and contact support.',
    path: '/support',
    keywords: ['help', 'support', 'FAQ', 'contact', 'troubleshooting'],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how HASIVU protects your privacy and handles your personal information.',
    path: '/privacy',
    keywords: ['privacy policy', 'data protection', 'user privacy', 'information security'],
  },
  terms: {
    title: 'Terms of Service',
    description: 'Read the terms of service for using the HASIVU school meal management platform.',
    path: '/terms',
    keywords: ['terms of service', 'user agreement', 'platform rules', 'legal terms'],
  },
} as const;

// Export configuration for external use
export { APP_CONFIG };
