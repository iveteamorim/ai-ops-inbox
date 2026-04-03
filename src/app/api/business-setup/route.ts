import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { triageConversation, type ServiceType } from "@/lib/triage/triage-conversation";

type LeadTypeInput = {
  id?: string;
  name?: string;
  estimatedValue?: number;
};

type Payload = {
  businessName?: string;
  leadTypes?: LeadTypeInput[];
};

type ProfileRow = {
  id: string;
  company_id: string;
};

type CompanyRow = {
  id: string;
  config: Record<string, unknown> | null;
};

type DemoContactSeed = {
  name: string;
  phone: string;
  message: string;
  hoursAgo: number;
  status: "active" | "no_response";
  replyOffsetHours?: number;
};

type DemoMessageInsert = {
  company_id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent";
  channel: "whatsapp";
  text: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

function buildDemoConversationSeeds(serviceCatalog: ServiceType[]): DemoContactSeed[] {
  const primary = serviceCatalog[0]?.name?.trim() || "primera consulta";
  const secondary = serviceCatalog[1]?.name?.trim() || primary;
  const tertiary = serviceCatalog[2]?.name?.trim() || secondary;

  return [
    {
      name: "Lucia Demo",
      phone: "+34600000011",
      message: `Hola, quiero reservar ${primary.toLowerCase()} esta semana. ¿Tenéis disponibilidad?`,
      hoursAgo: 12,
      status: "active",
    },
    {
      name: "Marina Test",
      phone: "+34600000012",
      message: `Hola, quería saber el precio de ${secondary.toLowerCase()}.`,
      hoursAgo: 18,
      status: "no_response",
      replyOffsetHours: 12,
    },
    {
      name: "Carlos Ejemplo",
      phone: "+34600000013",
      message: `Hola, me interesa ${tertiary.toLowerCase()}. ¿Podéis darme más información?`,
      hoursAgo: 4,
      status: "active",
    },
  ];
}

async function seedDemoConversations(params: {
  companyId: string;
  serviceCatalog: ServiceType[];
  admin: ReturnType<typeof createAdminClient>;
}) {
  const { companyId, serviceCatalog, admin } = params;
  const seeds = buildDemoConversationSeeds(serviceCatalog);

  for (const seed of seeds) {
    const inboundAt = new Date(Date.now() - seed.hoursAgo * 60 * 60 * 1000).toISOString();
    const outboundAt =
      seed.status === "no_response" && typeof seed.replyOffsetHours === "number"
        ? new Date(Date.now() - seed.replyOffsetHours * 60 * 60 * 1000).toISOString()
        : null;
    const lastTouchAt = outboundAt ?? inboundAt;
    const lastContactHoursAgo = Math.max(
      0,
      Math.round((Date.now() - new Date(lastTouchAt).getTime()) / (1000 * 60 * 60)),
    );
    const triage = triageConversation(
      {
        customerName: seed.name,
        lastCustomerMessage: seed.message,
        conversationStatus: seed.status === "active" ? "in_conversation" : "no_response",
        lastContactHoursAgo,
        assignedUnit: null,
      },
      serviceCatalog,
    );

    const { data: contact, error: contactError } = await admin
      .from("contacts")
      .insert({
        company_id: companyId,
        name: seed.name,
        phone: seed.phone,
      })
      .select("id")
      .single<{ id: string }>();

    if (contactError || !contact?.id) {
      throw new Error(`Failed to create demo contact: ${contactError?.message ?? "unknown"}`);
    }

    const { data: conversation, error: conversationError } = await admin
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contact.id,
        channel: "whatsapp",
        status: seed.status,
        lead_type: triage.leadType,
        estimated_value: triage.estimatedValue,
        expected_value: triage.estimatedValue,
        ai_priority: triage.priority,
        last_message_at: lastTouchAt,
        last_inbound_at: inboundAt,
        last_outbound_at: outboundAt,
        created_at: inboundAt,
        updated_at: lastTouchAt,
      })
      .select("id")
      .single<{ id: string }>();

    if (conversationError || !conversation?.id) {
      throw new Error(
        `Failed to create demo conversation: ${conversationError?.message ?? "unknown"}`,
      );
    }

    const messageRows: DemoMessageInsert[] = [
      {
        company_id: companyId,
        conversation_id: conversation.id,
        direction: "inbound",
        sender_type: "customer",
        channel: "whatsapp",
        text: seed.message,
        raw_payload: { source: "demo_seed" },
        created_at: inboundAt,
      },
    ];

    if (outboundAt) {
      messageRows.push({
        company_id: companyId,
        conversation_id: conversation.id,
        direction: "outbound",
        sender_type: "agent",
        channel: "whatsapp",
        text: triage.suggestedResponse,
        raw_payload: { source: "demo_seed" },
        created_at: outboundAt,
      });
    }

    const { error: messageError } = await admin.from("messages").insert(messageRows);
    if (messageError) {
      throw new Error(`Failed to create demo messages: ${messageError.message}`);
    }
  }

  return seeds.length;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0, 120) : "";
  const leadTypes = Array.isArray(body.leadTypes)
    ? body.leadTypes
        .map((row) => {
          const name = typeof row?.name === "string" ? row.name.trim().slice(0, 120) : "";
          const estimatedValue =
            typeof row?.estimatedValue === "number"
              ? row.estimatedValue
              : typeof row?.estimatedValue === "string"
                ? Number(row.estimatedValue)
                : 0;
          if (!name) return null;
          return {
            id:
              typeof row?.id === "string" && row.id.trim()
                ? row.id.trim()
                : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            estimated_value: Number.isFinite(estimatedValue) ? Math.max(0, estimatedValue) : 0,
          };
        })
        .filter((value): value is { id: string; name: string; estimated_value: number } => Boolean(value))
        .slice(0, 12)
    : [];

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, config")
    .eq("id", profile.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ ok: false, error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
  }

  const currentConfig = company.config && typeof company.config === "object" ? company.config : {};
  const currentBusinessSetup =
    "business_setup" in currentConfig && currentConfig.business_setup && typeof currentConfig.business_setup === "object"
      ? (currentConfig.business_setup as Record<string, unknown>)
      : {};
  const nextConfig = {
    ...currentConfig,
    business_setup: {
      ...currentBusinessSetup,
      business_name: businessName,
      lead_types: leadTypes,
    },
  };

  const { error: updateError } = await supabase
    .from("companies")
    .update({
      name: businessName || undefined,
      config: nextConfig,
    })
    .eq("id", company.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const serviceCatalog: ServiceType[] = leadTypes.map((item) => ({
    name: item.name,
    estimatedValue: item.estimated_value,
  }));
  let seeded = 0;

  if (serviceCatalog.length > 0) {
    const { count, error: conversationsCountError } = await admin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id);

    if (conversationsCountError) {
      return NextResponse.json({ ok: false, error: conversationsCountError.message }, { status: 500 });
    }

    if ((count ?? 0) === 0) {
      try {
        seeded = await seedDemoConversations({
          companyId: company.id,
          serviceCatalog,
          admin,
        });
      } catch (seedError) {
        return NextResponse.json(
          {
            ok: false,
            error: seedError instanceof Error ? seedError.message : "demo_seed_failed",
          },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true, seeded });
}
