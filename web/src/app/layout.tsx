import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReduxProvider } from '@/components/providers/redux-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import PaperShadersBackground from '@/components/ui/paper-shaders-background'
import { generateBaseMetadata, generateOrganizationSchema, generateWebApplicationSchema } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

// Generate comprehensive production-ready metadata
export const metadata = generateBaseMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Generate structured data for SEO
  const organizationSchema = generateOrganizationSchema();
  const webApplicationSchema = generateWebApplicationSchema();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        
        {/* Structured Data - Web Application Schema */}
        <script
          type="application/ld+json"
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
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* PWA Enhancement */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HASIVU" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Performance - Resource Hints */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Analytics - Google Analytics (Production) */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
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
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased bg-gradient-to-br from-hasivu-primary-25 via-white to-hasivu-secondary-25 selection:bg-hasivu-primary-100 selection:text-hasivu-primary-900`}>
        <PaperShadersBackground />
        <ReduxProvider>
          <AuthProvider>
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
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}