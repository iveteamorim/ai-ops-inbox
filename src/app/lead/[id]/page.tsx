import { redirect } from "next/navigation";

export default async function LeadAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/conversation/${id}`);
}
