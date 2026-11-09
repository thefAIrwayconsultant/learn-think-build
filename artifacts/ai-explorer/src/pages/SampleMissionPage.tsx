import { ArrowRight, Clock3, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import { FAMILY_MONTHLY_PRICE } from "../pricing";
import { getSampleMissionPreview } from "@workspace/curriculum";
import { PublicPageLayout } from "./PublicPageLayout";

export default function SampleMissionPage() {
  const mission = getSampleMissionPreview();
  return (
    <PublicPageLayout
      eyebrow={`Chapter 1 · ${mission.chapterTitle}`}
      title={mission.title}
      metaDescription="Preview the first Learn Think Build mission, with its real curriculum goal and opening step."
    >
      <section className="public-copy-card sample-mission-card">
        <div className="sample-mission-meta">
          <span>First mission</span>
          <span><Clock3 size={13} /> {mission.durationMinutes} minutes</span>
        </div>
        <div className="sample-mission-goal">
          <strong>Mission goal</strong>
          <p>{mission.goal}</p>
        </div>
        <ol className="sample-steps" aria-label="Mission steps">
          {mission.steps.map((step, index) => (
            <li className={`sample-step${index === 0 ? " is-open" : " is-teaser"}`} key={`${index}-${step}`}>
              <span className="sample-step-number">{index + 1}</span>
              <span className="sample-step-text">{step}</span>
              {index > 0 && <span className="sample-teaser-label">{index === 1 ? "Next in the mission" : <><LockKeyhole size={12} /> Full mission</>}</span>}
            </li>
          ))}
        </ol>
      </section>
      <section className="public-copy-card">
        <div className="sample-cta">
          <Link className="primary-button" href="/sign-up">Start the full program — {FAMILY_MONTHLY_PRICE}/month <ArrowRight size={16} /></Link>
          <Link className="secondary-button" href="/sign-up">Create a free parent account</Link>
        </div>
        <p className="sample-checkout-note">Family plan checkout is coming soon; creating an account does not start a paid subscription.</p>
      </section>
    </PublicPageLayout>
  );
}
