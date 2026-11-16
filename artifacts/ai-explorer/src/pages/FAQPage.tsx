import { Link } from "wouter";
import { PublicPageLayout } from "./PublicPageLayout";

export default function FAQPage() {
  return (
    <PublicPageLayout
      eyebrow="Help"
      title="Frequently asked questions"
      metaDescription="Answers to parent questions about ages, AI safety, missions, the family plan, and accounts."
    >
      <div className="faq-list">
        <details className="faq-item">
          <summary>What ages is Learn Think Build for?</summary>
          <div className="faq-answer">Kids ages 10 and up, with age paths: Curious Starter (10-12), Thoughtful Explorer (13-15), Independent Builder (16+). A parent or guardian creates the account and guides the missions.</div>
        </details>
        <details className="faq-item">
          <summary>What do we get for $4.99/month?</summary>
          <div className="faq-answer">The full program: 4 chapters, 20 daily missions each — 80 short, hands-on missions, 10 minutes a day. One price per family account, billed monthly. Cancel any time.</div>
        </details>
        <details className="faq-item">
          <summary>Is my child chatting with a real AI?</summary>
          <div className="faq-answer">No. The AI in the missions is simulated for teaching. There is no live chatbot, and we do not collect your child email or birth date.</div>
        </details>
        <details className="faq-item">
          <summary>Do I need to know anything about AI first?</summary>
          <div className="faq-answer">No. Missions are short, hands-on, and parent-guided. No experience needed.</div>
        </details>
        <details className="faq-item">
          <summary>How long is a mission?</summary>
          <div className="faq-answer">About 10 minutes a day — one mission per day.</div>
        </details>
        <details className="faq-item">
          <summary>Can I try one mission before paying?</summary>
          <div className="faq-answer">Yes — see the <Link href="/sample-mission">free sample mission</Link> on the sample mission page.</div>
        </details>
        <details className="faq-item">
          <summary>How do I cancel?</summary>
          <div className="faq-answer">A subscription can be cancelled at any time. Access continues until the end of the current billing period. There are no refunds for partial months.</div>
        </details>
        <details className="faq-item">
          <summary>I forgot my password — what do I do?</summary>
          <div className="faq-answer">Use Forgot password on the <Link href="/sign-in">sign-in page</Link>.</div>
        </details>
        <details className="faq-item">
          <summary>Who do I contact with a question?</summary>
          <div className="faq-answer"><a href="mailto:btkolb@gmail.com">btkolb@gmail.com</a></div>
        </details>
      </div>
    </PublicPageLayout>
  );
}
