export type GoogleFormsBackupConfig = {
  action_url: string;
  fields: {
    name: string;
    email?: string;
    phone?: string;
    message: string;
  };
};

export type GoogleFormsLead = {
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
};

function cleanEntryId(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.startsWith("entry.") ? trimmed : "";
}

export function normalizeGoogleFormsActionUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.includes("/formResponse")) {
    return trimmed.split("?")[0] ?? trimmed;
  }

  if (trimmed.includes("/viewform")) {
    return trimmed.replace("/viewform", "/formResponse").split("?")[0] ?? trimmed;
  }

  return trimmed.replace(/\/$/, "");
}

export function parseGoogleFormsBackupConfig(
  config: Record<string, unknown> | null | undefined,
): GoogleFormsBackupConfig | null {
  const raw = config?.google_forms_backup;
  if (!raw || typeof raw !== "object") return null;

  const backup = raw as Record<string, unknown>;
  const actionUrl = normalizeGoogleFormsActionUrl(
    typeof backup.action_url === "string" ? backup.action_url : "",
  );
  const fieldsRaw =
    backup.fields && typeof backup.fields === "object"
      ? (backup.fields as Record<string, unknown>)
      : null;

  const name = cleanEntryId(fieldsRaw?.name);
  const message = cleanEntryId(fieldsRaw?.message);
  const email = cleanEntryId(fieldsRaw?.email);
  const phone = cleanEntryId(fieldsRaw?.phone);

  if (!actionUrl || !name || !message) {
    return null;
  }

  return {
    action_url: actionUrl,
    fields: {
      name,
      message,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
  };
}

export function getGoogleFormsBackupFromEnv(): GoogleFormsBackupConfig | null {
  const actionUrl = normalizeGoogleFormsActionUrl(process.env.GOOGLE_FORMS_BACKUP_ACTION_URL ?? "");
  const name = cleanEntryId(process.env.GOOGLE_FORMS_ENTRY_NAME);
  const message = cleanEntryId(process.env.GOOGLE_FORMS_ENTRY_MESSAGE);
  const email = cleanEntryId(process.env.GOOGLE_FORMS_ENTRY_EMAIL);
  const phone = cleanEntryId(process.env.GOOGLE_FORMS_ENTRY_PHONE);

  if (!actionUrl || !name || !message) {
    return null;
  }

  return {
    action_url: actionUrl,
    fields: {
      name,
      message,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
  };
}

export function resolveGoogleFormsBackup(
  channelConfig: Record<string, unknown> | null | undefined,
): GoogleFormsBackupConfig | null {
  return parseGoogleFormsBackupConfig(channelConfig) ?? getGoogleFormsBackupFromEnv();
}

export async function forwardLeadToGoogleForms(
  backup: GoogleFormsBackupConfig,
  lead: GoogleFormsLead,
): Promise<{ forwarded: boolean; error?: string }> {
  const body = new URLSearchParams();
  body.set(backup.fields.name, lead.name);
  body.set(backup.fields.message, lead.message);

  if (backup.fields.email && lead.email) {
    body.set(backup.fields.email, lead.email);
  }

  if (backup.fields.phone && lead.phone) {
    body.set(backup.fields.phone, lead.phone);
  }

  try {
    const response = await fetch(backup.action_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      redirect: "manual",
    });

    if (response.status >= 200 && response.status < 400) {
      return { forwarded: true };
    }

    return { forwarded: false, error: `google_forms_status_${response.status}` };
  } catch (error) {
    return {
      forwarded: false,
      error: error instanceof Error ? error.message : "google_forms_request_failed",
    };
  }
}
