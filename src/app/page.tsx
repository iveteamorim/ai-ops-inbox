"use client";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <section className="landing page">
      <MarketingNav showHome={false} showSections={false} showLocale={false} />

      <header className="hero hero-stripe card landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">NÓVUA</p>
          <p className="label" style={{ marginBottom: 10 }}>
            {t("landing_badge")}
          </p>
          <h1 className="hero-title">{t("landing_title")}</h1>
          <p className="hero-subtitle">{t("landing_subtitle")}</p>
          <p className="pricing-urgency">{t("landing_onboarding_goal")}</p>

          <div className="hero-actions">
            <Link className="button" href="#pricing">
              {t("landing_onboarding_cta")}
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <p className="label" style={{ marginBottom: 10 }}>
            {t("landing_demo_label")}
          </p>
          <div className="product-mockup">
            <div className="mockup-topbar">
              <span className="mock-dot" />
              <span className="mock-dot" />
              <span className="mock-dot" />
              <span className="mockup-url">{t("landing_mockup_url")}</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-list">
                <div className="mockup-item">
                  <div>
                    <p className="mockup-name">Maria</p>
                    <p className="mockup-msg">{t("landing_mockup_msg_1")}</p>
                  </div>
                  <span className="badge score-high">{t("landing_mockup_status_high")}</span>
                </div>
                <div className="mockup-item">
                  <div>
                    <p className="mockup-name">Ana</p>
                    <p className="mockup-msg">{t("landing_mockup_msg_2")}</p>
                  </div>
                  <span className="badge status-no-response">{t("landing_mockup_status_risk")}</span>
                </div>
                <div className="mockup-item">
                  <div>
                    <p className="mockup-name">Joao</p>
                    <p className="mockup-msg">{t("landing_mockup_msg_3")}</p>
                  </div>
                  <span className="badge status-active">{t("landing_mockup_status_active")}</span>
                </div>
              </div>
              <div className="mockup-side">
                <p className="mockup-kpi-label">{t("landing_mockup_revenue_at_risk")}</p>
                <p className="mockup-kpi">{t("landing_mockup_status_high")}</p>
                <div className="mockup-bar">
                  <span />
                </div>
                <p className="mockup-kpi-label">{t("landing_mockup_unanswered_label")}</p>
                <p className="mockup-kpi-small">{t("landing_mockup_unanswered_high_value")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="card landing-statement" style={{ marginBottom: 14, textAlign: "center" }}>
        <p className="hero-title" style={{ marginBottom: 8 }}>
          {t("landing_statement_line_1")}
        </p>
        <p className="hero-subtitle" style={{ marginBottom: 0 }}>
          {t("landing_statement_line_2")}
        </p>
      </section>

      <section className="grid cols-3 landing-problem" style={{ marginBottom: 14 }}>
        <article className="card">
          <p className="eyebrow">{t("landing_problem")}</p>
          <h3 style={{ marginTop: 0 }}>{t("landing_problem_1_title")}</h3>
          <p>{t("landing_problem_1")}</p>
        </article>

        <article className="card">
          <p className="eyebrow">{t("landing_problem")}</p>
          <h3 style={{ marginTop: 0 }}>{t("landing_problem_2_title")}</h3>
          <p>{t("landing_problem_2")}</p>
        </article>

        <article className="card">
          <p className="eyebrow">{t("landing_problem")}</p>
          <h3 style={{ marginTop: 0 }}>{t("landing_problem_3_title")}</h3>
          <p>{t("landing_problem_3")}</p>
        </article>
      </section>

      <section className="card landing-how" style={{ marginBottom: 14 }}>
        <p className="eyebrow">{t("landing_how_eyebrow")}</p>
        <h3 style={{ marginTop: 0 }}>{t("landing_how_title")}</h3>
        <div className="grid cols-2" style={{ gap: 12 }}>
          <div className="card">
            <div className="preview-row">
              <span>1.</span>
              <strong>{t("landing_how_step_1")}</strong>
            </div>
            <div className="preview-row">
              <span>2.</span>
              <strong>{t("landing_how_step_2")}</strong>
            </div>
            <div className="preview-row">
              <span>3.</span>
              <strong>{t("landing_how_step_3")}</strong>
            </div>
            <div className="preview-row">
              <span>4.</span>
              <strong>{t("landing_how_step_4")}</strong>
            </div>
          </div>
          <div className="card">
            <p className="eyebrow">{t("landing_how_output_title")}</p>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              {t("landing_how_output_fields")}
            </p>
          </div>
        </div>
      </section>

      <section className="card panel-preview landing-result" style={{ marginBottom: 14 }}>
        <p className="eyebrow">{t("landing_result")}</p>
        <h3 style={{ marginTop: 0 }}>{t("landing_result_title")}</h3>
        <div className="preview-row">
          <span>{t("landing_response_time")}</span>
          <strong>↓</strong>
        </div>
        <div className="preview-row">
          <span>{t("landing_unfollowed")}</span>
          <strong>↓</strong>
        </div>
        <div className="preview-row">
          <span>{t("landing_converted")}</span>
          <strong>↑</strong>
        </div>
      </section>

      <section className="card landing-positioning" style={{ marginBottom: 14, textAlign: "center" }}>
        <p className="hero-subtitle" style={{ marginBottom: 8 }}>
          {t("landing_positioning_line_1")}
        </p>
        <p className="hero-title" style={{ marginBottom: 0 }}>
          {t("landing_positioning_line_2")}
        </p>
      </section>

      <section className="card pricing-card landing-onboarding" id="pricing" style={{ marginBottom: 14 }}>
        <div className="pricing-head">
          <div>
            <p className="eyebrow">{t("landing_onboarding_eyebrow")}</p>
            <h3 style={{ marginTop: 0 }}>{t("landing_onboarding_title")}</h3>
            <p className="subtitle">{t("landing_onboarding_subtitle")}</p>
            <article className="pricing-pain card" style={{ marginTop: 12 }}>
              <p className="warn" style={{ margin: 0 }}>{t("landing_onboarding_note_title")}</p>
              <p className="subtitle" style={{ marginTop: 6 }}>{t("landing_onboarding_note_text")}</p>
            </article>
          </div>
        </div>

        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="button" href="/signup">
            {t("landing_onboarding_cta")}
          </Link>
        </div>
      </section>

      <section className="landing-built-by" style={{ marginBottom: 14, textAlign: "center" }}>
        <p className="subtitle" style={{ marginBottom: 0 }}>
          {t("landing_built_by")}
        </p>
      </section>
    </section>
  );
}
