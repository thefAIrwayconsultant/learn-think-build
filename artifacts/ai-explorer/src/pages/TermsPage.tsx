import { PublicPageLayout } from "./PublicPageLayout";

export default function TermsPage() {
  return (
    <PublicPageLayout
      eyebrow="Terms"
      title="Learn Think Build — Terms of Service"
      metaDescription="Review the terms for parent-owned Learn Think Build family accounts and AI learning missions."
    >
      <p className="public-updated">Last updated: November 16, 2026.</p>
      <section className="public-copy-card">
        <h2>The service</h2>
        <p>Learn Think Build provides 4 chapters and 80 hands-on learning sessions for children ages 10 and up. Each learner may use up to 10 minutes of active learning in a rolling 24-hour window. The Monthly Learning Plan family subscription is $4.99 per month and is billed through Stripe.</p>
      </section>
      <section className="public-copy-card">
        <h2>Who can use it</h2>
        <p>An adult parent or guardian must create and manage the family account and supervise the learner. Learners use profiles within that family account; the app does not create child email accounts. The app does not independently verify the account holder’s age or relationship to the learner, and the selected age band is self-reported guidance rather than age verification. Accounts are for one family; do not share login details outside your household.</p>
        <p>The app records a learner’s and guardian’s agreement to a learning pledge at each chapter as part of course progression. This is an in-app learning pledge; the app does not use it to verify age or parent-child relationship.</p>
      </section>
      <section className="public-copy-card">
        <h2>Billing and cancellation</h2>
        <p>The subscription renews monthly at $4.99 until cancelled. The app does not provide an in-app subscription-management or cancellation control. To request cancellation, email <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a>; cancellation is handled through Stripe. Access continues until the end of the current billing period. There are no refunds for partial months.</p>
      </section>
      <section className="public-copy-card">
        <h2>The missions</h2>
        <p>Missions use simulated AI for teaching, not a live chatbot. Learner reflections and chapter-project text are saved to the family account and shown to its guardian. Do not enter a child’s email address, birth date, last name, or other personal information in the display name, reflection, or project text. Content is for learning; results will vary by child.</p>
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
        <p>Kolb Enterprises LLC, <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a>. These terms are governed by the laws of the Commonwealth of Massachusetts.</p>
      </section>
    </PublicPageLayout>
  );
}
