import Link from 'next/link';
import { LifeBuoy, Mail, ShieldCheck } from 'lucide-react';

const supportOptions = [
  {
    title: 'School onboarding',
    description: 'Help setting up menus, student rosters, staff access, and daily kitchen flows.',
    contact: 'onboarding@hasivu.com',
  },
  {
    title: 'Parent ordering support',
    description: 'Assistance with account access, meal orders, payment status, and delivery updates.',
    contact: 'support@hasivu.com',
  },
  {
    title: 'Security or privacy concern',
    description: 'Report suspicious activity, account concerns, or data-protection questions.',
    contact: 'security@hasivu.com',
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--hasivu-bg,#fff7f0)] px-4 py-12 text-[var(--hasivu-text,#2D3436)]">
      <section className="mx-auto max-w-4xl rounded-3xl border border-[var(--hasivu-border,#f0e4e4)] bg-white p-8 shadow-[var(--hasivu-shadow-md,0_4px_20px_rgba(0,0,0,0.06))]">
        <div className="mb-8 flex items-start gap-4">
          <span className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <LifeBuoy aria-hidden="true" className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-700">
              HASIVU support
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
              We are here to keep school meals running smoothly.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Use the right channel below so the support team can route your request quickly.
              Production deployments should replace these addresses with your institution-specific
              support desk.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {supportOptions.map(option => (
            <article
              key={option.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <Mail aria-hidden="true" className="mb-4 h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-950">{option.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
              <a
                className="mt-4 inline-flex min-h-11 items-center rounded-full text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                href={`mailto:${option.contact}`}
              >
                {option.contact}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p>
              For urgent school-day meal disruption, use your school&apos;s internal escalation
              channel first, then file a HASIVU support request with the affected order IDs.
            </p>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="mt-8 inline-flex min-h-11 items-center rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
