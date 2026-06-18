import { DiagnosticoFormPage } from "@/components/marketing/DiagnosticoFormPage";

export default async function DiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : undefined;
  return <DiagnosticoFormPage token={token} />;
}
