"use client";

import type { PilotFeedbackView } from "@/lib/app-data";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Props = {
  items: PilotFeedbackView[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCategory(value: PilotFeedbackView["category"], lang: string) {
  if (lang === "pt") {
    if (value === "feature_request") return "Pedido de melhoria";
    if (value === "feedback") return "Feedback";
    return "Bug";
  }
  if (lang === "en") {
    if (value === "feature_request") return "Feature request";
    if (value === "feedback") return "Feedback";
    return "Bug";
  }
  if (value === "feature_request") return "Solicitud de mejora";
  if (value === "feedback") return "Comentarios";
  return "Error";
}

export function PilotFeedbackTable({ items }: Props) {
  const { lang } = useI18n();
  const copy =
    lang === "pt"
      ? {
          title: "Feedback",
          empty: "Ainda não há feedback.",
          when: "Quando",
          company: "Empresa",
          sentBy: "Enviado por",
          type: "Tipo",
          page: "Página",
          message: "Mensagem",
          status: "Estado",
          reply: "Resposta",
          new: "Novo",
          reviewed: "Revisado",
          closed: "Fechado",
          placeholder: "Resposta única visível para o cliente",
          save: "Guardar",
          saved: "Guardado.",
          failed: "Não foi possível guardar.",
          lastReply: "Última resposta",
        }
      : lang === "en"
        ? {
            title: "Feedback",
            empty: "No feedback yet.",
            when: "When",
            company: "Company",
            sentBy: "Sent by",
            type: "Type",
            page: "Page",
            message: "Message",
            status: "Status",
            reply: "Reply",
            new: "New",
            reviewed: "Reviewed",
            closed: "Closed",
            placeholder: "Single reply visible to the customer",
            save: "Save",
            saved: "Saved.",
            failed: "Could not save.",
            lastReply: "Last reply",
          }
        : {
            title: "Feedback",
            empty: "Todavía no hay feedback.",
            when: "Cuándo",
            company: "Empresa",
            sentBy: "Enviado por",
            type: "Tipo",
            page: "Página",
            message: "Mensaje",
            status: "Estado",
            reply: "Respuesta",
            new: "Nuevo",
            reviewed: "Revisado",
            closed: "Cerrado",
            placeholder: "Respuesta única visible para el cliente",
            save: "Guardar",
            saved: "Guardado.",
            failed: "No se pudo guardar.",
            lastReply: "Última respuesta",
          };

  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, item.adminReply ?? ""])),
  );
  const [statuses, setStatuses] = useState<Record<string, PilotFeedbackView["status"]>>(
    Object.fromEntries(items.map((item) => [item.id, item.status])),
  );
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function save(feedbackId: string) {
    setSaved((current) => ({ ...current, [feedbackId]: "" }));
    startTransition(async () => {
      const response = await fetch("/api/pilot-feedback/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          status: statuses[feedbackId],
          adminReply: drafts[feedbackId] ?? "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      setSaved((current) => ({
        ...current,
        [feedbackId]: response.ok && payload?.ok ? copy.saved : copy.failed,
      }));
    });
  }

  return (
    <article className="card" style={{ marginTop: 12 }}>
      <p className="label">{copy.title}</p>
      {items.length === 0 ? (
        <p className="subtitle">{copy.empty}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{copy.when}</th>
              <th>{copy.company}</th>
              <th>{copy.sentBy}</th>
              <th>{copy.type}</th>
              <th>{copy.page}</th>
              <th>{copy.message}</th>
              <th>{copy.status}</th>
              <th>{copy.reply}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.createdAt)}</td>
                <td>{item.companyName}</td>
                <td>{item.sentBy}</td>
                <td>{formatCategory(item.category, lang)}</td>
                <td>{item.pagePath ?? "—"}</td>
                <td>{item.message}</td>
                <td style={{ minWidth: 160 }}>
                  <select
                    className="input"
                    value={statuses[item.id] ?? item.status}
                    onChange={(event) =>
                      setStatuses((current) => ({
                        ...current,
                        [item.id]: event.target.value as PilotFeedbackView["status"],
                    }))
                  }
                  >
                    <option value="new">{copy.new}</option>
                    <option value="reviewed">{copy.reviewed}</option>
                    <option value="closed">{copy.closed}</option>
                  </select>
                </td>
                <td style={{ minWidth: 320 }}>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder={copy.placeholder}
                    value={drafts[item.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button className="button" type="button" disabled={isPending} onClick={() => save(item.id)}>
                      {copy.save}
                    </button>
                  </div>
                  {item.repliedAt ? <p className="subtitle" style={{ marginBottom: 0 }}>{copy.lastReply}: {formatDate(item.repliedAt)}</p> : null}
                  {saved[item.id] ? <p className="subtitle" style={{ marginBottom: 0 }}>{saved[item.id]}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
