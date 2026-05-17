import Link from 'next/link';

const terms = [
  {
    title: 'Authorized use',
    body: 'HASIVU is intended for schools, parents, students, kitchen staff, administrators, and approved vendors participating in school meal operations.',
  },
  {
    title: 'Account responsibility',
    body: 'Users must keep account access private, report suspicious activity, and use only the role and school access provisioned to them.',
  },
  {
    title: 'Orders and payments',
    body: 'Meal availability, cut-off times, refunds, and payment settlement rules are configured by each school or operator and should be documented before launch.',
  },
  {
    title: 'Operational availability',
    body: 'Schools should maintain a fallback meal-service process for incidents, connectivity loss, payment-provider outages, or database degradation.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--hasivu-bg,#fff7f0)] px-4 py-12 text-[var(--hasivu-text,#2D3436)]">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[var(--hasivu-border,#f0e4e4)] bg-white p-8 shadow-[var(--hasivu-shadow-md,0_4px_20px_rgba(0,0,0,0.06))]">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-700">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
          Terms of service
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          These launch terms are a product placeholder for operational review. Replace with
          school-approved legal terms before public production use.
        </p>

        <div className="mt-8 space-y-6">
          {terms.map(section => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <Link
          href="/auth/login"
          className="mt-8 inline-flex min-h-11 items-center rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Back to sign in
        </Link>
      </article>
    </main>
  );
}
