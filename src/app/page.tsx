"use client";
import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { useI18n } from "@/components/i18n/LanguageProvider";

const trustBrands = [
  { name: "Cliniq+", src: "/logos/cliniq.svg" },
  { name: "InmoFlow", src: "/logos/inmoflow.svg" },
  { name: "EduPrime", src: "/logos/eduprime.svg" },
  { name: "FoodSuite", src: "/logos/foodsuite.svg" },
  { name: "StudioCare", src: "/logos/studiocare.svg" },
  { name: "BlueDesk", src: "/logos/bluedesk.svg" },
];

const marqueeBrands = [...trustBrands, ...trustBrands];

export default function LandingPage() {
  const { t } = useI18n();

  const decisionSignal = "8";

  return (
    <section className="landing page">
      <MarketingNav showHome={false} showSections={false} showLocale={false} />

      <header className="hero hero-stripe card">
        <div className="hero-copy">
          <p className="eyebrow">NÓVUA</p>
          <p className="label" style={{ marginBottom: 10 }}>
            {t("landing_badge")}
          </p>
          <h1 className="hero-title">{t("landing_title")}</h1>
          <p className="hero-subtitle">{t("landing_subtitle")}</p>

          <div className="hero-actions">
            <Link className="button" href="/signup">
              {t("cta_try_free")}
            </Link>
            <Link className="mini-button" href="/login">
              {t("cta_signin")}
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
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

      <section className="trust-row card">
        <p className="label trust-label">{t("landing_trust_label")}</p>
        <div className="trust-marquee" aria-label="Trusted teams">
          <div className="trust-track">
            {marqueeBrands.map((brand, index) => (
              <div key={`${brand.name}-${index}`} className="trust-logo-wrap">
                <Image src={brand.src} alt={brand.name} width={120} height={32} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid cols-3" style={{ marginBottom: 14 }}>
        <article className="card">
          <p className="eyebrow">{t("landing_problem")}</p>
          <h3 style={{ marginTop: 0 }}>{t("landing_problem_title")}</h3>
          <p>{t("landing_problem_2")}</p>
        </article>

        <article className="card panel-preview">
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
        </article>

        <article className="card">
          <p className="eyebrow">{t("landing_revenue_label")}</p>
          <h3 style={{ marginTop: 0 }}>{t("landing_revenue_title")}</h3>
          <p className="metric metric-warn">{decisionSignal}</p>
          <p className="subtitle">{t("landing_money_risk")}</p>
        </article>
      </section>

      <section className="card pricing-card" id="pricing" style={{ marginBottom: 14 }}>
        <div className="pricing-head">
          <div>
            <p className="eyebrow">Onboarding</p>
            <h3 style={{ marginTop: 0 }}>Pilot setup for teams with inbound volume</h3>
            <p className="subtitle">
              Novua is currently offered as a guided pilot. We help teams set up the workspace,
              define lead types, and turn the inbox into a clear work queue.
            </p>
            <p className="pricing-urgency">
              The goal is not to add another inbox. The goal is to make the right conversation obvious at the right time.
            </p>
            <article className="pricing-pain card" style={{ marginTop: 12 }}>
              <p className="warn" style={{ margin: 0 }}>Setup and monthly plans are available for pilot customers.</p>
              <p className="subtitle" style={{ marginTop: 6 }}>
                We currently price pilots based on team size, volume, and onboarding scope instead of fixed public plans.
              </p>
            </article>
          </div>
        </div>

        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="button" href="/signup">
            Request pilot access
          </Link>
          <Link className="mini-button" href="/login">
            View product
          </Link>
        </div>
      </section>

      <section className="cta card">
        <h3 style={{ marginTop: 0 }}>{t("landing_cta_title")}</h3>
        <p>{t("landing_cta_text")}</p>
        <div className="hero-actions">
          <Link className="button" href="/signup">
            {t("cta_create_account")}
          </Link>
          <Link className="mini-button" href="/login">
            {t("cta_signin")}
          </Link>
        </div>
      </section>
    </section>
  );
}
