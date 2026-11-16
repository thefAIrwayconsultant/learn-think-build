import { PublicPageLayout } from "./PublicPageLayout";

export default function ContactPage() {
  return (
    <PublicPageLayout
      eyebrow="Contact"
      title="Contact us."
      metaDescription="Contact Learn Think Build with questions from a parent or guardian."
    >
      <section className="public-copy-card">
        <h2>Questions about Learn Think Build?</h2>
        <p>A parent can reach us at <a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a>.</p>
        <p>We reply within 3 days.</p>
      </section>
    </PublicPageLayout>
  );
}
