import { NextResponse } from "next/server";

const FORM_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function formCorsPreflightResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: FORM_CORS_HEADERS,
  });
}

export function formCorsJsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: FORM_CORS_HEADERS,
  });
}
