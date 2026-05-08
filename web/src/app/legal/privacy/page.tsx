import Link from 'next/link';

const sections = [
  {
    title: 'Information we handle',
    body: 'HASIVU stores account, student, school, order, payment-status, RFID-delivery, and notification information needed to operate school meal workflows.',
  },
  {
    title: 'How information is used',
    body: 'Data is used to authenticate users, prepare meals, process orders, coordinate delivery, provide support, and maintain security and audit records.',
  },
  {
    title: 'Operational safeguards',
    body: 'Production deployments should use httpOnly cookies, encrypted managed PostgreSQL, Redis with authentication, structured audit logs, and least-privilege access controls.',
  },
  {
    title: 'Questions and requests',
    body: 'Schools remain the primary administrator for student and family records. Privacy requests should be routed through the school administrator or support@hasivu.com.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--hasivu-bg,#fff7f0)] px-4 py-12 text-[var(--hasivu-text,#2D3436)]">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[var(--hasivu-border,#f0e4e4)] bg-white p-8 shadow-[var(--hasivu-shadow-md,0_4px_20px_rgba(0,0,0,0.06))]">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-700">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
          Privacy notice
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          This launch notice describes the operational data HASIVU needs for school meal ordering.
          Replace this page with institution-approved legal text before public production use.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map(section => (
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
