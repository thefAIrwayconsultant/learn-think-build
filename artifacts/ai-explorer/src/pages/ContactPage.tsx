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
        <p>A parent can reach us at <a href="mailto:[CONTACT EMAIL]">[CONTACT EMAIL]</a>.</p>
        <p>We reply within [NUMBER] business days.</p>
      </section>
    </PublicPageLayout>
  );
}
