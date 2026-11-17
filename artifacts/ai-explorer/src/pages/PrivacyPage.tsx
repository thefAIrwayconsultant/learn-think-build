import { PublicPageLayout } from "./PublicPageLayout";

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      eyebrow="Privacy"
      title="Learn Think Build — Privacy Policy"
      metaDescription="Learn what information Learn Think Build uses for parent-owned family accounts and learner mission progress."
    >
      <p className="public-updated">Last updated: November 16, 2026.</p>
      <section className="public-copy-card">
        <h2>About this service</h2>
        <p>Learn Think Build (we, us) runs learnthinkbuild.com, a parent-guided AI learning service for children ages 10 and up. The program has 4 chapters and 80 hands-on sessions, with age paths for 10-12, 13-15, and 16+. The app allows each learner up to 10 minutes of active learning in a rolling 24-hour window.</p>
      </section>
      <section className="public-copy-card">
        <h2>Adult accounts and learner profiles</h2>
        <p>The service is intended for an adult parent or guardian to create and manage the family account and supervise the learner. Sign-in is handled by Clerk. The app does not independently verify the account holder’s age or relationship to a child.</p>
        <p>A guardian creates a learner profile using a display name and selects one broad, self-reported age band: 10-12, 13-15, or 16+. We do not provide separate fields for a child’s email address, birth date, or last name. The display-name field accepts free text, so use a first name or nickname and do not include a last name or other personal details.</p>
      </section>
      <section className="public-copy-card">
        <h2>Information handled by account and learning features</h2>
        <p>Clerk handles the adult account’s sign-in information, including the account email and authentication information, and any name or identity-provider details associated with the sign-in method. Our family database stores the Clerk account ID, the family record’s creation time, and Stripe customer and subscription IDs and subscription status. We do not copy the account email or name into the family record.</p>
        <p>The learner profile stores its internal profile ID, the family-account link, display name, age band, creation time, and learning settings. Learning settings include the weekly goal, learner and guardian chapter-pledge status, and chapter-project text and review status.</p>
        <p>To provide the course and family dashboard, we also save lesson completion, lesson IDs, written reflections, time spent, quiz scores, chapter mastery scores, quiz-attempt details such as missed and reviewed topics, and whether a family discussion card was marked discussed. We keep a limited rolling learning-time record and session state. Written reflections and chapter-project text are saved and visible in the guardian’s family dashboard. Quiz answers are graded on the server; selected answers are not saved, but scores and missed or reviewed lesson topics are.</p>
        <p>These text fields accept free-form writing and are not automatically checked or redacted for personal information. A learner could include an email address, birth date, last name, or other personal information in a display name, reflection, or project even though the app does not ask for those details in separate fields. Please do not enter them.</p>
        <p>If a family redeems an access code, the code and redemption time are linked to the family account. Learning records and project text do not have an automatic expiry in the app; they remain until the learner profile is deleted or a full-family deletion request is handled. The active learning-time record is limited to the current rolling window.</p>
        <p>Stripe handles checkout and payment details. We do not store card numbers in our app database. Stripe sends us subscription events; we store the related Stripe IDs and subscription status.</p>
      </section>
      <section className="public-copy-card">
        <h2>What we do not collect</h2>
        <p>The app has no separate child email, birth-date, or last-name fields, and it does not provide a live chatbot. AI demonstrations are simulated; learner reflections and project text are not sent to a live AI service. Because the text fields accept free-form writing, we cannot say that personal information is never submitted in them.</p>
      </section>
      <section className="public-copy-card">
        <h2>How we use it</h2>
        <p>We use account information to sign in the adult account holder and provide family access. We use the selected age band to show the corresponding learning path, and use saved lesson activity, reflections, quizzes, projects, pledges, and learning time to resume sessions, apply course progression, and show progress to the guardian. Stripe subscription status and redeemed access codes determine family access. The family subscription is $4.99 per month for the Monthly Learning Plan.</p>
      </section>
      <section className="public-copy-card">
        <h2>Sharing</h2>
        <p>We do not sell personal information. Replit hosts the application and its PostgreSQL database; information saved by the app and operational server logs are handled on that service. A Stripe checkout email may appear in a diagnostic log when a payment event cannot be matched to a family account. Clerk handles sign-in and account identity. Stripe receives checkout and payment information and sends subscription events back to the app.</p>
        <p>The site loads fonts from Google Fonts, so Google receives the browser request and ordinary connection information such as the IP address. When an account holder uses Google sign-in, Google also handles that authentication. The Contact page opens a mail link rather than submitting a form to our app; the sender’s email provider and Google’s Gmail service handle messages sent to our contact address.</p>
      </section>
      <section className="public-copy-card">
        <h2>Access and deletion</h2>
        <p>A guardian can remove an individual learner profile from the family dashboard. This deletes that profile and its linked learning records from our app database. There is no self-service control to delete the entire family account. To request full family-account and app-stored learner-data deletion, email <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a>. We will confirm the request within 30 days; full-account requests are handled manually. Clerk and Stripe may hold account or payment records under their own service terms and retention practices.</p>
      </section>
      <section className="public-copy-card">
        <h2>Children’s privacy and family pledges</h2>
        <p>The age band is self-reported guidance, not age verification. The app records learner and guardian agreement to a learning pledge for each chapter. Those learning pledges do not verify the account holder’s age or relationship to the learner, and the code has no separate age-verification or verified parental-consent flow. If you believe learner information was added without the responsible adult’s authorization, contact <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a> to request its removal.</p>
      </section>
      <section className="public-copy-card">
        <h2>Contact</h2>
        <p>Kolb Enterprises LLC, 16 Eagle Drive, Kingston, MA 02364, <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a>.</p>
      </section>
    </PublicPageLayout>
  );
}
