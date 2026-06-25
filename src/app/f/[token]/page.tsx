import { DiagnosticoFormPage } from "@/components/marketing/DiagnosticoFormPage";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PublicFormPage({ params }: Props) {
  const { token } = await params;
  return <DiagnosticoFormPage token={decodeURIComponent(token)} />;
}
