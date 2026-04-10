"use client";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <main className="landing page landing-premium">
      <MarketingNav showHome={false} showSections={false} showLocale={false} />

      <div className="landing-shell">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">{t("landing_brand_kicker")}</p>
            <h1 className="landing-title">{t("landing_title")}</h1>
            <p className="landing-subtitle">{t("landing_subtitle")}</p>
            <p className="landing-highlight">
              {t("landing_statement_line_1")} {t("landing_statement_line_2")}
            </p>
            <div className="landing-actions">
              <Link className="landing-button" href="#pricing">
                {t("landing_onboarding_cta")}
              </Link>
              <span className="landing-tagline">{t("landing_onboarding_tagline")}</span>
            </div>
          </div>

          <div className="landing-mockup" aria-hidden="true">
            <div className="landing-mockup-head">
              <p>{t("landing_demo_label")}</p>
              <span>{t("landing_mockup_url")}</span>
            </div>
            <div className="landing-mockup-grid">
              <div className="landing-mockup-list">
                <div className="landing-mockup-card">
                  <div>
                    <p className="landing-mockup-name">Maria</p>
                    <p className="landing-mockup-msg">{t("landing_mockup_msg_1")}</p>
                  </div>
                  <span className="landing-mockup-badge badge-high">
                    {t("landing_mockup_status_high")}
                  </span>
                </div>
                <div className="landing-mockup-card">
                  <div>
                    <p className="landing-mockup-name">Ana</p>
                    <p className="landing-mockup-msg">{t("landing_mockup_msg_2")}</p>
                  </div>
                  <span className="landing-mockup-badge badge-risk">
                    {t("landing_mockup_status_risk")}
                  </span>
                </div>
                <div className="landing-mockup-card">
                  <div>
                    <p className="landing-mockup-name">Joao</p>
                    <p className="landing-mockup-msg">{t("landing_mockup_msg_3")}</p>
                  </div>
                  <span className="landing-mockup-badge badge-active">
                    {t("landing_mockup_status_active")}
                  </span>
                </div>
              </div>
              <div className="landing-mockup-side">
                <p className="landing-mockup-label">{t("landing_mockup_revenue_at_risk")}</p>
                <p className="landing-mockup-value">{t("landing_mockup_status_high")}</p>
                <div className="landing-mockup-bar">
                  <span />
                </div>
                <p className="landing-mockup-label">{t("landing_mockup_unanswered_label")}</p>
                <p className="landing-mockup-strong">{t("landing_mockup_unanswered_high_value")}</p>
                <p className="landing-mockup-foot">{t("landing_mockup_footer")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-statement">
          <p>{t("landing_positioning_line_1")} {t("landing_positioning_line_2")}</p>
        </section>

        <section className="landing-grid">
          <article className="landing-card">
            <p className="landing-card-label">{t("landing_problem")}</p>
            <h3>{t("landing_problem_1_title")}</h3>
            <p>{t("landing_problem_2")}</p>
          </article>

          <article className="landing-card landing-card-result">
            <p className="landing-card-label">{t("landing_result")}</p>
            <h3>{t("landing_result_title")}</h3>
            <div className="landing-metrics">
              <div>
                <span>{t("landing_response_time")}</span>
                <strong>↓</strong>
              </div>
              <div>
                <span>{t("landing_unfollowed")}</span>
                <strong>↓</strong>
              </div>
              <div>
                <span>{t("landing_converted")}</span>
                <strong>↑</strong>
              </div>
            </div>
          </article>

          <article className="landing-card landing-card-decision">
            <p className="landing-card-label">{t("landing_revenue_label")}</p>
            <h3>{t("landing_revenue_title")}</h3>
            <p className="landing-metric">8</p>
            <p className="landing-metric-sub">{t("landing_money_risk")}</p>
          </article>
        </section>

        <section className="landing-onboarding" id="pricing">
          <p className="landing-card-label">{t("landing_onboarding_eyebrow")}</p>
          <h2>{t("landing_onboarding_title")}</h2>
          <p className="landing-onboarding-copy">{t("landing_onboarding_subtitle")}</p>
          <p className="landing-onboarding-highlight">{t("landing_onboarding_goal")}</p>

          <div className="landing-onboarding-note">
            <p className="landing-onboarding-note-title">{t("landing_onboarding_note_title")}</p>
            <p>{t("landing_onboarding_note_text")}</p>
          </div>

          <div className="landing-actions">
            <Link className="landing-button" href="/signup">
              {t("landing_onboarding_cta")}
            </Link>
            <Link className="landing-button ghost" href="/login">
              {t("landing_onboarding_view")}
            </Link>
          </div>
        </section>

        <section className="landing-final">
          <h2>{t("landing_final_title")}</h2>
          <Link className="landing-button" href="#pricing">
            {t("landing_onboarding_cta")}
          </Link>
        </section>
      </div>
    </main>
  );
}
