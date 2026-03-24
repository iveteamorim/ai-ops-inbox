"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MarketingNav } from "@/components/MarketingNav";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { detectBrowserCurrency, type Currency } from "@/lib/i18n/currency";

const trustBrands = [
  { name: "Cliniq+", src: "/logos/cliniq.svg" },
  { name: "InmoFlow", src: "/logos/inmoflow.svg" },
  { name: "EduPrime", src: "/logos/eduprime.svg" },
  { name: "FoodSuite", src: "/logos/foodsuite.svg" },
  { name: "StudioCare", src: "/logos/studiocare.svg" },
  { name: "BlueDesk", src: "/logos/bluedesk.svg" },
];

const marqueeBrands = [...trustBrands, ...trustBrands];

type PlanCard = {
  key: "starter" | "growth" | "pro";
  title: string;
  price: string;
  cta: string;
  recovery: string;
  features: string[];
  highlight?: boolean;
};

export default function LandingPage() {
  const { t } = useI18n();
  const [currency, setCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("pricing_currency");
      if (stored === "BRL" || stored === "EUR") {
        setCurrency(stored);
        return;
      }
      setCurrency(detectBrowserCurrency());
    } catch {
      setCurrency("EUR");
    }
  }, []);

  const prices = useMemo(
    () => {
      if (!currency) return null;
      return currency === "BRL"
        ? { starter: "R$249", growth: "R$699", pro: "R$1299" }
        : { starter: "€49", growth: "€129", pro: "€249" };
    },
    [currency],
  );

  const revenueAtRisk = useMemo(() => {
    if (!currency) return null;
    return currency === "BRL" ? "R$ 10.500" : "€ 2.100";
  }, [currency]);

  const mockupLeads = useMemo(
    () => [
      {
        name: "Maria",
        message: t("landing_mockup_msg_1"),
        badgeClass: "score-high",
        badgeLabel: t("landing_mockup_status_high"),
      },
      {
        name: "Ana",
        message: t("landing_mockup_msg_2"),
        badgeClass: "status-no-response",
        badgeLabel: t("landing_mockup_status_risk"),
      },
      {
        name: "João",
        message: t("landing_mockup_msg_3"),
        badgeClass: "status-active",
        badgeLabel: t("landing_mockup_status_active"),
      },
    ],
    [t],
  );

  const planCards = useMemo<PlanCard[] | null>(() => {
    if (!prices) return null;
    return [
      {
        key: "starter",
        title: t("pricing_starter"),
        price: prices.starter,
        cta: t("pricing_cta_starter"),
        recovery: t("pricing_starter_recovery"),
        features: [t("pricing_no_miss"), t("pricing_users_2"), t("pricing_whatsapp"), t("pricing_ai_detect")],
      },
      {
        key: "growth",
        title: t("pricing_growth"),
        price: prices.growth,
        cta: t("pricing_cta_growth"),
        recovery: t("pricing_growth_recovery"),
        features: [t("pricing_no_miss"), t("pricing_users_6"), t("pricing_multichannel"), t("pricing_ai_detect"), t("pricing_money_loss")],
        highlight: true,
      },
      {
        key: "pro",
        title: t("pricing_pro"),
        price: prices.pro,
        cta: t("pricing_cta_pro"),
        recovery: t("pricing_pro_recovery"),
        features: [
          t("pricing_no_miss"),
          t("pricing_users_unlimited"),
          t("pricing_automations_adv"),
          t("pricing_lead_value_segment"),
          t("pricing_predictive_insights"),
          t("pricing_support_priority"),
        ],
      },
    ];
  }, [prices, t]);

  function changeCurrency(next: Currency) {
    setCurrency(next);
    try {
      window.localStorage.setItem("pricing_currency", next);
    } catch {
      // Ignore storage errors in private/blocked environments.
    }
  }

  return (
    <section className="landing page">
      <MarketingNav />

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
              {t("cta_primary_b2b")}
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
                {mockupLeads.map((lead) => (
                  <div key={lead.name} className="mockup-item">
                    <div>
                      <p className="mockup-name">{lead.name}</p>
                      <p className="mockup-msg">{lead.message}</p>
                    </div>
                    <span className={`badge ${lead.badgeClass}`}>{lead.badgeLabel}</span>
                  </div>
                ))}
              </div>
              <div className="mockup-side">
                <p className="mockup-kpi-label">{t("landing_mockup_revenue_at_risk")}</p>
                <p className="mockup-kpi">{revenueAtRisk ?? "..."}</p>
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
        <div className="trust-marquee" aria-label={t("landing_trust_aria")}>
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
          <p className="metric metric-warn">{revenueAtRisk ?? "..."}</p>
          <p className="subtitle">{t("landing_money_risk")}</p>
        </article>
      </section>

      <section className="card pricing-card" id="pricing" style={{ marginBottom: 14 }}>
        <div className="pricing-head">
          <div>
            <p className="eyebrow">{t("pricing_title")}</p>
            <h3 style={{ marginTop: 0 }}>{t("pricing_title")}</h3>
            <p className="subtitle">{t("pricing_subtitle")}</p>
            <p className="pricing-urgency">{t("pricing_urgency")}</p>
            <article className="pricing-pain card" style={{ marginTop: 12 }}>
              <p className="warn" style={{ margin: 0 }}>{t("pricing_pain_title")}</p>
              <p className="subtitle" style={{ marginTop: 6 }}>{t("pricing_pain_text")}</p>
            </article>
            <p className="label" style={{ marginTop: 8 }}>
              {t("pricing_selected_prefix")}{" "}
              {currency === "BRL"
                ? t("pricing_currency_brl")
                : currency === "EUR"
                  ? t("pricing_currency_eur")
                  : t("pricing_currency_loading")}
            </p>
          </div>
          <details className="prefs-menu">
            <summary className="mini-button">{t("pricing_currency")}</summary>
            <div className="prefs-panel">
              <div className="filter-row">
                <button
                  type="button"
                  className={`mini-button ${currency === "BRL" ? "is-active" : ""}`}
                  onClick={() => changeCurrency("BRL")}
                >
                  {t("pricing_currency_brl")}
                </button>
                <button
                  type="button"
                  className={`mini-button ${currency === "EUR" ? "is-active" : ""}`}
                  onClick={() => changeCurrency("EUR")}
                >
                  {t("pricing_currency_eur")}
                </button>
              </div>
            </div>
          </details>
        </div>

        <div className="grid cols-3">
          {planCards
            ? planCards.map((plan) => (
                <article key={plan.key} className={`card ${plan.highlight ? "pricing-highlight" : ""}`}>
                  <div className="pricing-plan-head">
                    <p className="eyebrow">{plan.title}</p>
                    {plan.highlight ? <span className="badge score-high">{t("pricing_growth_badge")}</span> : null}
                  </div>
                  <p className="kpi">
                    {plan.price}
                    <span className="pricing-month">{t("pricing_month")}</span>
                  </p>
                  <p className="pricing-value-line">{plan.recovery}</p>
                  {plan.features.map((feature) => (
                    <p key={feature}>{feature}</p>
                  ))}
                  <Link className="button" href="/signup">
                    {plan.cta}
                  </Link>
                </article>
              ))
            : [0, 1, 2].map((index) => (
                <article key={`pricing-skeleton-${index}`} className="card">
                  <div className="skeleton-list">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                </article>
              ))}
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
