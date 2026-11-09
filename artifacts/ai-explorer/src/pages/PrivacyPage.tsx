import { PublicPageLayout } from "./PublicPageLayout";

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      eyebrow="Privacy"
      title="Learn Think Build — Privacy Policy"
      metaDescription="Learn what information Learn Think Build uses for parent-owned family accounts and learner mission progress."
    >
      <p className="public-updated">Last updated: [DATE].</p>
      <section className="public-copy-card">
        <h2>About this service</h2>
        <p>Learn Think Build (we, us) runs learnthinkbuild.com, an AI Jumpstart for kids ages 10 and up: 4 chapters of 20 daily hands-on, parent-guided missions (80 total), 10 minutes a day, with age paths for 10-12, 13-15, and 16+.</p>
      </section>
      <section className="public-copy-card">
        <h2>Who holds the account</h2>
        <p>A parent or guardian creates and owns the family account. We do not ask for a child email address or birth date.</p>
      </section>
      <section className="public-copy-card">
        <h2>What we collect</h2>
        <p>Parent account details you enter at signup; payment details handled by [Stripe — we do not store card numbers on our servers]; mission progress for the family account so a child can pick up where they left off.</p>
      </section>
      <section className="public-copy-card">
        <h2>What we do not collect</h2>
        <p>No child email, no child birth date, no live chatbot conversations. The AI in missions is simulated, not a live chatbot — children do not chat with a real AI or a stranger.</p>
      </section>
      <section className="public-copy-card">
        <h2>How we use it</h2>
        <p>To run the account, show mission progress, bill the $4.99/month subscription, and answer parent messages sent via the contact page.</p>
      </section>
      <section className="public-copy-card">
        <h2>Sharing</h2>
        <p>We do not sell personal information. We share only what is needed with [payment processor] to take payment and [hosting provider, if any] to run the site.</p>
      </section>
      <section className="public-copy-card">
        <h2>Parent rights</h2>
        <p>A parent can ask us to delete the family account and its mission progress at any time by emailing [CONTACT EMAIL]. We will confirm deletion within [NUMBER] days.</p>
      </section>
      <section className="public-copy-card">
        <h2>Children privacy</h2>
        <p>This service is for families with children ages 10 and up and is parent-guided. If you believe a child information was submitted without a parent permission, contact [CONTACT EMAIL] and we will remove it.</p>
      </section>
      <section className="public-copy-card">
        <h2>Contact</h2>
        <p>[LEGAL BUSINESS NAME], [MAILING ADDRESS], [CONTACT EMAIL].</p>
      </section>
    </PublicPageLayout>
  );
}
