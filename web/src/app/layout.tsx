import { Instrument_Serif, Nunito, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/CartContext';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import PaperShadersBackground from '@/components/ui/paper-shaders-background';
import {
  generateBaseMetadata,
  generateBaseViewport,
  generateOrganizationSchema,
  generateWebApplicationSchema,
} from '@/lib/seo';
import { getNonce } from '@/lib/security/nonce';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '600', '700'],
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-hero',
  display: 'swap',
  weight: '400',
});

// Generate comprehensive production-ready metadata
export const metadata = generateBaseMetadata();
export const viewport = generateBaseViewport();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get CSP nonce from middleware
  const nonce = await getNonce();
  // Generate structured data for SEO
  const organizationSchema = generateOrganizationSchema();
  const webApplicationSchema = generateWebApplicationSchema();

  return (
    <html lang="en">
      <head>
        {/* Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        {/* Structured Data - Web Application Schema */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webApplicationSchema),
          }}
        />

        {/* Performance Optimization - DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.hasivu.com" />

        {/* Performance Optimization - Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* PWA Enhancement */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HASIVU" />
        <meta name="msapplication-TileColor" content="#E07020" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Analytics - Google Analytics (Production) */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              nonce={nonce}
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                    send_page_view: true,
                    anonymize_ip: true,
                    cookie_flags: 'max-age=7200;secure;samesite=strict'
                  });
                `,
              }}
            />
          </>
        )}

        {/* Service Worker Registration */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                    })
                    .catch(function(registrationError) {
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <PaperShadersBackground />
        {/*
          Provider Hierarchy Explanation:

          1. ReduxProvider: Global state management (outermost)
          2. AuthProvider: Authentication context for user state
          3. CartProvider: Shopping cart state (requires auth context, client-side only)
          4. AccessibilityProvider: Accessibility features
          5. ThemeProvider: Theme switching and styling (innermost)

          This order ensures:
          - Cart operations can access user authentication state
          - Cart state is available throughout the app (all routes)
          - Client-side operations (localStorage) happen after proper hydration
          - No conflicts with theme or accessibility providers
        */}
        <ReduxProvider>
          <AuthProvider>
            <CartProvider>
              <AccessibilityProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  {/* Skip to main content for accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-hasivu-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-hasivu-primary-700 transition-colors"
                  >
                    Skip to main content
                  </a>

                  <div className="min-h-screen relative flex flex-col">
                    {/* Main content area */}
                    <main id="main-content" className="flex-1" tabIndex={-1}>
                      {children}
                    </main>

                    {/* Footer spacer for mobile navigation */}
                    <div className="pb-safe-bottom" />
                  </div>

                  {/* Toast notifications with HASIVU styling */}
                  <Toaster
                    richColors
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        padding: '16px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      },
                      className: 'shadow-lg',
                    }}
                  />
                </ThemeProvider>
              </AccessibilityProvider>
            </CartProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
