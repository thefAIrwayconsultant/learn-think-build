import { PublicPageLayout } from "./PublicPageLayout";

export default function TermsPage() {
  return (
    <PublicPageLayout
      eyebrow="Terms"
      title="Learn Think Build — Terms of Service"
      metaDescription="Review the terms for parent-owned Learn Think Build family accounts and AI learning missions."
    >
      <p className="public-updated">Last updated: [DATE].</p>
      <section className="public-copy-card">
        <h2>The service</h2>
        <p>Access to Learn Think Build 4 chapters / 80 daily missions (20 per chapter, 10 minutes a day) for kids ages 10 and up, for $4.99/month per family account, billed by [Stripe].</p>
      </section>
      <section className="public-copy-card">
        <h2>Who can use it</h2>
        <p>A parent or guardian buys and owns the account and supervises their child use. Accounts are for one family; do not share login details outside your household.</p>
      </section>
      <section className="public-copy-card">
        <h2>Billing and cancellation</h2>
        <p>The subscription renews monthly at $4.99 until cancelled. Cancel any time from [ACCOUNT SETTINGS / LINK]; access continues until the end of the paid month.</p>
        <p>[CONFIRM REFUND RULE: no refunds for a partial month / refunds on request within X days — pick one before publishing.]</p>
      </section>
      <section className="public-copy-card">
        <h2>The missions</h2>
        <p>Missions use simulated AI for teaching, not a live chatbot. Content is for learning; results will vary by child.</p>
      </section>
      <section className="public-copy-card">
        <h2>Acceptable use</h2>
        <p>Do not copy, resell, or redistribute mission content, and do not use the service in a way that breaks the law.</p>
      </section>
      <section className="public-copy-card">
        <h2>Changes</h2>
        <p>We may update these terms and will post the new version here with a new last updated date.</p>
      </section>
      <section className="public-copy-card">
        <h2>Contact / governing law</h2>
        <p>[LEGAL BUSINESS NAME], [CONTACT EMAIL]. These terms are governed by the laws of [STATE].</p>
      </section>
    </PublicPageLayout>
  );
}
