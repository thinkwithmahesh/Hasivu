# HASIVU Platform - UI Design Goals and Specifications

## Overall UX Vision

Create a mobile-first, intuitive platform that transforms school food service from a daily coordination burden into a seamless, transparent experience. The interface should feel familiar to parents accustomed to consumer e-commerce while addressing unique institutional requirements like meal scheduling, nutritional transparency, and real-time delivery verification. Design for time-constrained working parents who value efficiency, transparency, and child welfare.

## Key Interaction Paradigms

### One-Touch Reordering

- **Purpose**: Instant reorder of previous meals with saved preferences
- **Implementation**: Quick action buttons on home screen and order history
- **Success Metric**: <3 taps to reorder favorite meals

### Visual Meal Planning

- **Purpose**: Calendar-based weekly/monthly meal scheduling with drag-and-drop functionality
- **Implementation**: Interactive calendar interface with meal preview cards
- **Success Metric**: Intuitive scheduling for 90% of parents without training

### Progressive Disclosure

- **Purpose**: Show essential information first, detailed nutritional/ingredient data on-demand
- **Implementation**: Expandable cards, detailed views, and information hierarchy
- **Success Metric**: Essential info visible within 2 seconds, detailed info within 1 additional tap

### Contextual Notifications

- **Purpose**: Smart notifications based on user behavior patterns and school schedules
- **Implementation**: AI-driven notification timing and content personalization
- **Success Metric**: >80% notification relevance rating from users

### Gestural Navigation

- **Purpose**: Swipe-based interactions for common actions (mark delivered, rate meal, quick reorder)
- **Implementation**: Native mobile gestures with visual feedback
- **Success Metric**: Gesture adoption >70% within first month of usage

## Core Screens and Views

### Login/Onboarding Screen

- **Features**: School code verification and parent profile setup with tutorial
- **Design Goals**: Trustworthy, secure, and welcoming first impression
- **Key Elements**: School logo integration, progress indicators, skip options

### Home Dashboard

- **Features**: Today's orders, quick actions, notification center, and child meal status
- **Design Goals**: Information at-a-glance with clear action priorities
- **Key Elements**: Status cards, quick action buttons, personalized content

### Menu Catalog

- **Features**: Daily/weekly menus with filtering by dietary preferences, nutrition info, and ratings
- **Design Goals**: Appetizing presentation with easy discovery and comparison
- **Key Elements**: High-quality images, filter chips, nutritional badges, rating displays

### Shopping Cart

- **Features**: Order review, scheduling options, payment method selection, and checkout
- **Design Goals**: Clear order summary with easy modification and scheduling
- **Key Elements**: Item management, calendar picker, payment options, total breakdown

### Order Tracking

- **Features**: Real-time status updates with delivery timeline and RFID verification confirmation
- **Design Goals**: Transparency and reassurance throughout order lifecycle
- **Key Elements**: Progress timeline, status notifications, delivery confirmation

### Meal Scheduler

- **Features**: Calendar view for weekly/monthly meal planning with recurring order setup
- **Design Goals**: Efficient bulk planning with visual meal distribution
- **Key Elements**: Calendar grid, meal preview cards, pattern templates, bulk actions

### Profile Management

- **Features**: Child dietary preferences, payment methods, notification settings
- **Design Goals**: Comprehensive control with clear organization and privacy
- **Key Elements**: Child profiles, dietary restrictions, preference settings

### School Admin Dashboard

- **Features**: Order management, vendor coordination, reporting, and parent communication tools
- **Design Goals**: Professional efficiency with comprehensive data visualization
- **Key Elements**: Data tables, charts, action panels, communication tools

### Vendor Portal

- **Features**: Daily orders, inventory management, payment tracking, and delivery coordination
- **Design Goals**: Operational efficiency with mobile-optimized workflows
- **Key Elements**: Order lists, inventory grids, financial summaries, delivery status

## Accessibility: WCAG AA Compliance

### Standards Compliance

- **WCAG 2.1 AA**: Full compliance ensuring platform accessibility for parents with disabilities
- **Screen Reader Support**: Comprehensive semantic markup and ARIA labels
- **Keyboard Navigation**: Complete functionality accessible via keyboard-only interaction
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text

### Specific Accessibility Features

- **Alternative Text**: Descriptive alt text for nutritional information and meal images
- **High Contrast Mode**: Optional high contrast theme for visual accessibility
- **Font Size Adjustment**: User-controllable font sizing from 12px to 24px
- **Voice Announcements**: Critical status updates announced for screen readers
- **Focus Indicators**: Clear visual focus indicators for all interactive elements

### Testing Requirements

- **Automated Testing**: Integration with accessibility testing tools (axe-core)
- **Manual Testing**: Regular testing with screen readers and keyboard navigation
- **User Testing**: Accessibility testing with parents who have disabilities

## Branding and Visual Design

### Brand Identity

- **Trust and Transparency**: Clean, modern design reflecting reliability and openness
- **Child-Focused Care**: Warm, caring visual elements without being childish
- **Professional Quality**: Suitable for premium school environment while approachable

### Color Palette

- **Primary Colors**:
  - Food Safety Green (#2E7D32) - Trust, health, nutrition
  - Reliability Blue (#1565C0) - Dependability, technology, security
  - Warm Orange (#F57C00) - Accent color for actions and highlights
- **Secondary Colors**:
  - Light Grey (#F5F5F5) - Backgrounds and subtle elements
  - Dark Grey (#424242) - Text and content
  - Success Green (#4CAF50) - Positive actions and confirmations
  - Warning Amber (#FF9800) - Alerts and attention items
  - Error Red (#F44336) - Errors and critical issues

### Typography

- **Primary Font**: System fonts for optimal performance and familiarity
  - iOS: San Francisco
  - Android: Roboto
  - Web: -apple-system, BlinkMacSystemFont, 'Segoe UI'
- **Hierarchy**: Clear typographic hierarchy with consistent sizing and spacing
- **Accessibility**: Minimum 16px for body text, high contrast ratios

### Iconography

- **Style**: Consistent icon family with clear meaning and universal recognition
- **Accessibility**: Icons paired with text labels, adequate size (24px minimum)
- **Customization**: School-specific icons where appropriate

### School Branding Integration

- **Logo Placement**: School logos prominently displayed while maintaining HASIVU identity
- **Color Adaptation**: Option to incorporate school colors as accent colors
- **Custom Elements**: School-specific imagery and messaging where appropriate

## Target Devices and Platforms

### Cross-Platform Strategy

- **Primary**: iOS and Android mobile apps (React Native) optimized for phones
- **Secondary**: Responsive web portal for desktop/tablet access
- **Admin Interfaces**: Web-based dashboards optimized for desktop use by school administrators and vendors

### Device Support

- **Minimum Requirements**:
  - iOS 12+ (iPhone 6s and later)
  - Android 8+ (API level 26)
  - Modern browsers (Chrome 80+, Safari 13+, Firefox 75+, Edge 80+)
- **Optimal Experience**:
  - iOS 14+ / Android 10+
  - 5+ inch screens with 720p+ resolution
  - 3GB+ RAM for smooth performance

### Responsive Design Breakpoints

- **Mobile**: 320px - 767px (primary focus)
- **Tablet**: 768px - 1023px (secondary)
- **Desktop**: 1024px+ (admin interfaces)

### Performance Targets

- **Load Time**: <3 seconds on 3G networks
- **Bundle Size**: <2MB total app size, <500KB initial load
- **Animation**: 60fps smooth animations and transitions
- **Offline**: Core functionality available offline with sync capabilities

## Design System Components

### Component Library

- **Buttons**: Primary, secondary, outline, icon, floating action
- **Forms**: Text inputs, dropdowns, checkboxes, radio buttons, date pickers
- **Cards**: Product cards, order cards, status cards, information cards
- **Navigation**: Tab bars, navigation headers, breadcrumbs, pagination
- **Feedback**: Alerts, toasts, loading states, empty states, error states

### Interaction Patterns

- **Loading States**: Skeleton screens, progress indicators, shimmer effects
- **Transitions**: Smooth page transitions, micro-interactions, state changes
- **Gestures**: Swipe actions, pull-to-refresh, pinch-to-zoom for images
- **Feedback**: Haptic feedback on iOS, visual feedback for all interactions

## Change Log

| Date       | Version | Description                                                                 | Author    |
| ---------- | ------- | --------------------------------------------------------------------------- | --------- |
| 2025-08-03 | 1.1     | Extracted from monolithic PRD, enhanced accessibility and branding sections | UX Team   |
| 2025-08-02 | 1.0     | Initial UI design goals from Project Brief                                  | John (PM) |

## Related Documents

- **Goals**: [01-goals-background.md](01-goals-background.md) - Platform objectives informing UX decisions
- **Requirements**: [02-requirements.md](02-requirements.md) - Functional requirements for UI features
- **Technical**: [04-technical-assumptions.md](04-technical-assumptions.md) - Technical constraints affecting design
- **Parent Experience**: [epics/epic-3-parent-ordering.md](epics/epic-3-parent-ordering.md) - Detailed parent-facing workflows

---

**Last Updated**: August 3, 2025  
**Document Owner**: UX Lead & Product Manager  
**Review Frequency**: Sprint reviews and major design iterations
