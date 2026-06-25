import { NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function enforceSameOrigin(request: Request) {
  const requestOrigin = normalizeOrigin(request.url);
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  if (!requestOrigin) {
    return NextResponse.json({ ok: false, error: "invalid_request_origin" }, { status: 400 });
  }

  if (originHeader) {
    const origin = normalizeOrigin(originHeader);
    if (origin !== requestOrigin) {
      return NextResponse.json({ ok: false, error: "invalid_request_origin" }, { status: 403 });
    }
    return null;
  }

  if (refererHeader) {
    const referer = normalizeOrigin(refererHeader);
    if (referer !== requestOrigin) {
      return NextResponse.json({ ok: false, error: "invalid_request_origin" }, { status: 403 });
    }
    return null;
  }

  return NextResponse.json({ ok: false, error: "missing_request_origin" }, { status: 403 });
}
