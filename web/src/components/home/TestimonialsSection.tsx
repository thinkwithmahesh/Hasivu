'use client';

import React from 'react';
import { Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  organization: string;
  content: string;
  rating?: number;
  avatar?: string;
}

export interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    name: 'Parent workflow',
    role: 'Ordering and tracking',
    organization: 'Launch persona',
    content:
      'Parents need a calm mobile flow for menu review, cart updates, payment readiness, and order confirmation without exposing auth tokens to the browser.',
  },
  {
    name: 'School admin workflow',
    role: 'Operations dashboard',
    organization: 'Launch persona',
    content:
      'Admins need dense tables, fast filters, user management, schedule visibility, and payment/order status without decorative motion slowing decision-making.',
  },
  {
    name: 'Kitchen workflow',
    role: 'Meal fulfillment',
    organization: 'Launch persona',
    content:
      'Kitchen staff need tablet-sized controls, high-contrast allergy flags, and clear order state changes that remain usable during busy lunch periods.',
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
  <article className="relative flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
    <Quote className="absolute right-5 top-5 h-8 w-8 text-emerald-100" aria-hidden="true" />
    <p className="flex-1 pr-8 leading-7 text-stone-700">{testimonial.content}</p>
    <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">
        {testimonial.name.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-stone-950">{testimonial.name}</p>
        <p className="text-sm text-stone-600">{testimonial.role}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {testimonial.organization}
        </p>
      </div>
    </div>
  </article>
);

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title = 'Role workflows before marketing claims',
  subtitle = 'HASIVU’s launch UI should show verified product workflows instead of invented customer quotes, ratings, or unverifiable adoption numbers.',
  testimonials = defaultTestimonials,
}) => {
  return (
    <section className="relative overflow-hidden bg-orange-50/70 py-20">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-stone-950 md:text-4xl">{title}</h2>
          <p className="mt-4 leading-7 text-stone-600">{subtitle}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(testimonial => (
            <TestimonialCard key={`${testimonial.name}-${testimonial.role}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
