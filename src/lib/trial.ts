const TRIAL_DAYS = 7;

export function trialEndsAtIso(startDate = new Date()): string {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS);
  return endDate.toISOString();
}

export function hasTrialExpired(isoDate?: string | null): boolean {
  if (!isoDate) {
    return false;
  }

  const trialEnd = new Date(isoDate).getTime();
  if (Number.isNaN(trialEnd)) {
    return false;
  }

  return Date.now() > trialEnd;
}

export function formatTrialEnd(isoDate?: string | null): string {
  if (!isoDate) {
    return "-";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
