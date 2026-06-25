"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

type DemoTourProps = {
  title: string;
  steps: string[];
  storageKey: string;
};

export function DemoTour({ title, steps, storageKey }: DemoTourProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const hidden = window.sessionStorage.getItem(storageKey);
    setVisible(hidden !== "done");
  }, [storageKey]);

  const current = useMemo(() => steps[index] ?? "", [index, steps]);

  if (!visible) {
    return null;
  }

  const isLast = index === steps.length - 1;

  function close() {
    window.sessionStorage.setItem(storageKey, "done");
    setVisible(false);
  }

  return (
    <aside className="tour-card" role="status" aria-live="polite">
      <p className="label">{t("tour_label")}</p>
      <h3 className="tour-title">{title}</h3>
      <p className="tour-step">{current}</p>
      <div className="actions">
        {index > 0 && (
          <button className="mini-button" type="button" onClick={() => setIndex((prev) => prev - 1)}>
            {t("tour_prev")}
          </button>
        )}
        {!isLast && (
          <button className="mini-button" type="button" onClick={() => setIndex((prev) => prev + 1)}>
            {t("tour_next")}
          </button>
        )}
        <button className="mini-button mini-warn" type="button" onClick={close}>
          {isLast ? t("tour_finish") : t("tour_skip")}
        </button>
      </div>
    </aside>
  );
}
