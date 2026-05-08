'use client';

import React, { ReactNode } from 'react';
import Head from 'next/head';

export interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  containerVariant?: 'fixed' | 'fluid';
  showHeader?: boolean;
  showFooter?: boolean;
  metadata?: {
    keywords?: string;
    ogImage?: string;
    canonical?: string;
  };
}

const Header: React.FC = () => (
  <header className="border-b border-orange-200 bg-emerald-800 text-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <div className="text-2xl font-bold tracking-tight">HASIVU</div>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-stone-200 bg-stone-50">
    <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-stone-600">
      © {new Date().getFullYear()} HASIVU. All rights reserved.
    </div>
  </footer>
);

export const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'HASIVU - Smart School Food Delivery',
  description = 'School meal ordering platform with RFID verification and real-time tracking.',
  containerVariant = 'fixed',
  showHeader = true,
  showFooter = true,
  metadata = {},
}) => {
  const {
    keywords = 'school food, delivery, RFID, education, nutrition, parents',
    ogImage = '/images/og-image.jpg',
    canonical,
  } = metadata;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        {canonical && <link rel="canonical" href={canonical} />}
      </Head>

      <div className="flex min-h-screen flex-col bg-stone-50">
        {showHeader && <Header />}
        <main className="flex flex-1 flex-col">
          {containerVariant === 'fixed' ? (
            <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
          ) : (
            <div className="flex-1 py-6">{children}</div>
          )}
        </main>
        {showFooter && <Footer />}
      </div>
    </>
  );
};

export default Layout;
