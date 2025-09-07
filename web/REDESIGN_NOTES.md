# HASIVU Landing Redesign (Startwell-inspired)

Status: Implemented as default homepage and available at /startwell

What changed
- New Startwell-inspired landing component: `web/src/components/landing/StartwellInspiredLandingPage.tsx`
- New route for preview: `web/src/app/startwell/page.tsx`
- Homepage now uses the new landing: `web/src/app/page.tsx`
- Added testimonials and FAQs sections
- Clear CTAs to Order Online and Manage Subscription
- Friendly, high-contrast styling; accessible labels on social/contact links

How to run locally
- From repo root: `npm --prefix web run dev`
- Visit: `http://localhost:3000/` and `http://localhost:3000/startwell`

Content to finalize
- Replace the modal video source at `/videos/how-to-order.mp4` and poster image
- Update social profile links via env vars
  - NEXT_PUBLIC_SOCIAL_INSTAGRAM
  - NEXT_PUBLIC_SOCIAL_TWITTER
  - NEXT_PUBLIC_SOCIAL_LINKEDIN
- Confirm contact email/phone

Recommended next steps

Sprrrint-inspired option
- New component: `web/src/components/landing/SprrrintInspiredLandingPage.tsx`
- Preview route: `http://localhost:3000/sprrrint`
- Minimal, typography-first layout with slim sticky footer CTA and subtle grid background

Hybrid option
- New component: `web/src/components/landing/HybridLandingPage.tsx`
- Preview route: `http://localhost:3000/blend`
- Startwell content (hero chips, reasons, how-it-works, testimonials, FAQs) with Sprrrint-like minimal header, grid background, black CTAs, and sticky footer CTA

1) SEO polish
- Add page-specific Open Graph image for the homepage
  - Placeholder SVG added at `public/og/home.svg`. For production, replace with a 1200x630 PNG at `public/og/home.png`.
- Ensure canonical URLs are correct in production
2) Analytics
   - Confirm GA ID in environment and validate pageview events
   - Add conversion event for “Order Now” and “Manage Subscription” clicks
3) Accessibility and performance
   - Run Lighthouse and axe checks; fix any contrast/landmark warnings
   - Lazy-load any heavy media; confirm CLS is <0.1
4) Real data integration (optional)
   - Pull ratings/testimonials from your API or CMS
   - Add real-time counters if desired
5) A/B test
   - Consider toggling the new homepage behind a feature flag to compare engagement
6) Design system alignment
   - Extract tokens/components to your design system if parts are reused

Rollback
- To revert homepage to previous version, change `web/src/app/page.tsx` to render `ProductionLandingPage`.
