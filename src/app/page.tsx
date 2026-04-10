"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function LandingPage() {
  const { t } = useI18n();
  const mockupCards = useMemo(
    () => [
      {
        name: "Maria",
        text: t("landing_mockup_msg_1"),
        badge: t("landing_mockup_status_high"),
        tone: "high",
      },
      {
        name: "Ana",
        text: t("landing_mockup_msg_2"),
        badge: t("landing_mockup_status_risk"),
        tone: "risk",
      },
      {
        name: "Joao",
        text: t("landing_mockup_msg_3"),
        badge: t("landing_mockup_status_active"),
        tone: "active",
      },
    ],
    [t]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mockupCards.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [mockupCards.length]);

  return (
    <main className="landing page landing-premium">
      <MarketingNav showHome={false} showSections={false} showLocale={false} />

      <div className="landing-shell">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">{t("landing_brand_kicker")}</p>
            <h1 className="landing-title">{t("landing_title")}</h1>
            <p className="landing-subtitle">{t("landing_subtitle")}</p>
            <p className="landing-highlight">{t("landing_hero_highlight")}</p>
            <div className="landing-actions">
              <Link className="landing-button" href="#pricing">
                {t("landing_onboarding_cta")}
              </Link>
              <span className="landing-tagline">{t("landing_hero_tagline")}</span>
            </div>
          </div>

          <div className="landing-mockup" aria-hidden="true">
            <div className="landing-mockup-head">
              <p>{t("landing_demo_label")}</p>
            </div>
            <div className="landing-mockup-stack">
              <div className="landing-mockup-list">
                {mockupCards.map((card, index) => (
                  <div
                    key={card.name}
                    className={`landing-mockup-card ${index === activeIndex ? "is-active" : ""}`.trim()}
                  >
                    <div>
                      <p className="landing-mockup-name">{card.name}</p>
                      <p className="landing-mockup-msg">{card.text}</p>
                    </div>
                    <span className={`landing-mockup-badge badge-${card.tone}`}>
                      {card.badge}
                    </span>
                  </div>
                ))}
              </div>
              <div className="landing-mockup-side">
                <p className="landing-mockup-label">{t("landing_mockup_revenue_at_risk")}</p>
                <p className={`landing-mockup-value status-${mockupCards[activeIndex].tone}`}>
                  {mockupCards[activeIndex].badge}
                </p>
                <div className="landing-mockup-bar">
                  <span style={{ width: `${(activeIndex + 1) * 25}%` }} />
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
