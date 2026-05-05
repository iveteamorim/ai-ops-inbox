import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_DEMO_EMAIL = "demo@novua.digital";
const DEFAULT_DEMO_PASSWORD = "NovuaDemo2026!";
const DEFAULT_DEMO_COMPANY_NAME = "Novua Demo Workspace";
const DEFAULT_DEMO_FULL_NAME = "Recruiter Demo";

const DEMO_LEAD_TYPES = [
  { id: "premium-treatment", name: "Tratamiento premium", estimated_value: 180 },
  { id: "first-visit", name: "Primera visita", estimated_value: 90 },
  { id: "follow-up", name: "Seguimiento", estimated_value: 60 },
];

const DEMO_SEEDS = [
  {
    name: "Nora Nuevo",
    phone: "+34600000010",
    message: "Hola, quería pedir información sobre tratamiento premium y saber si tenéis hueco mañana.",
    hoursAgo: 1,
    status: "new",
    leadType: "Tratamiento premium",
    estimatedValue: 180,
    priority: "high",
  },
  {
    name: "Carlos Ejemplo",
    phone: "+34600000011",
    message: "Hola, me interesa seguimiento. ¿Podéis darme más información?",
    hoursAgo: 4,
    status: "active",
    replyOffsetHours: 1,
    leadType: "Seguimiento",
    estimatedValue: 60,
    priority: "medium",
  },
  {
    name: "Marina Test",
    phone: "+34600000012",
    message: "Hola, quería saber el precio de primera visita.",
    hoursAgo: 18,
    status: "no_response",
    leadType: "Primera visita",
    estimatedValue: 90,
    priority: "high",
  },
  {
    name: "Lucia Demo",
    phone: "+34600000013",
    message: "Hola, quiero reservar tratamiento premium esta semana. ¿Tenéis disponibilidad?",
    hoursAgo: 12,
    status: "won",
    replyOffsetHours: 10,
    leadType: "Tratamiento premium",
    estimatedValue: 180,
    priority: "high",
  },
  {
    name: "Diego Perdido",
    phone: "+34600000014",
    message: "Hola, quería reservar primera visita esta semana.",
    hoursAgo: 24,
    status: "lost",
    replyOffsetHours: 18,
    leadType: "Primera visita",
    estimatedValue: 90,
    priority: "medium",
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
  }
}

function loadEnv() {
  const cwd = process.cwd();
  for (const fileName of [".env.local", ".env", ".env.smoke"]) {
    loadEnvFile(path.join(cwd, fileName));
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function listAllUsers(adminClient) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`List users failed: ${error.message}`);
    }

    users.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

function buildDemoConfig() {
  return {
    workspace_mode: "customer_demo",
    demo_workspace: true,
    business_setup: {
      business_name: DEFAULT_DEMO_COMPANY_NAME,
      lead_types: DEMO_LEAD_TYPES,
    },
  };
}

async function findOrCreateCompany(adminClient, name) {
  const { data: existingCompany, error: lookupError } = await adminClient
    .from("companies")
    .select("id, name, config")
    .eq("name", name)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Company lookup failed: ${lookupError.message}`);
  }

  if (existingCompany) {
    return existingCompany;
  }

  const { data: company, error: createError } = await adminClient
    .from("companies")
    .insert({ name, config: buildDemoConfig() })
    .select("id, name, config")
    .single();

  if (createError || !company) {
    throw new Error(`Company create failed: ${createError?.message ?? "unknown"}`);
  }

  return company;
}

async function getExistingProfileCompany(adminClient, userId) {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Profile lookup failed: ${profileError.message}`);
  }

  if (!profile?.company_id) return null;

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("id, name, config")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (companyError) {
    throw new Error(`Profile company lookup failed: ${companyError.message}`);
  }

  return company;
}

async function ensureDemoCompany(adminClient, company) {
  const { data, error } = await adminClient
    .from("companies")
    .update({
      name: DEFAULT_DEMO_COMPANY_NAME,
      plan: "trial",
      config: buildDemoConfig(),
    })
    .eq("id", company.id)
    .select("id, name, config")
    .single();

  if (error || !data) {
    throw new Error(`Demo company update failed: ${error?.message ?? "unknown"}`);
  }

  return data;
}

async function ensureDemoUser(adminClient, { email, password, company, fullName }) {
  const users = await listAllUsers(adminClient);
  const existingUser = users.find((user) => (user.email ?? "").toLowerCase() === email) ?? null;
  const userMetadata = {
    full_name: fullName,
    company_name: company.name,
    company_id: company.id,
    role: "agent",
    demo_workspace: true,
  };

  if (!existingUser) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      throw new Error(`Demo user create failed: ${error?.message ?? "unknown"}`);
    }

    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existingUser.user_metadata ?? {}),
      ...userMetadata,
    },
  });

  if (error || !data.user) {
    throw new Error(`Demo user update failed: ${error?.message ?? "unknown"}`);
  }

  return data.user;
}

async function ensureDemoProfile(adminClient, { userId, companyId, fullName }) {
  const { error } = await adminClient.from("profiles").upsert(
    {
      id: userId,
      company_id: companyId,
      full_name: fullName,
      role: "agent",
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Demo profile upsert failed: ${error.message}`);
  }
}

async function resetDemoData(adminClient, { companyId, assignedToUserId }) {
  const phones = DEMO_SEEDS.map((seed) => seed.phone);
  const { data: contacts, error: contactsError } = await adminClient
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .in("phone", phones);

  if (contactsError) {
    throw new Error(`Demo contacts lookup failed: ${contactsError.message}`);
  }

  const contactIds = (contacts ?? []).map((contact) => contact.id);
  if (contactIds.length > 0) {
    const { data: conversations, error: conversationsError } = await adminClient
      .from("conversations")
      .select("id")
      .eq("company_id", companyId)
      .in("contact_id", contactIds);

    if (conversationsError) {
      throw new Error(`Demo conversations lookup failed: ${conversationsError.message}`);
    }

    const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
    if (conversationIds.length > 0) {
      const { error: messagesDeleteError } = await adminClient
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds);

      if (messagesDeleteError) {
        throw new Error(`Demo messages delete failed: ${messagesDeleteError.message}`);
      }

      const { error: conversationsDeleteError } = await adminClient
        .from("conversations")
        .delete()
        .in("id", conversationIds);

      if (conversationsDeleteError) {
        throw new Error(`Demo conversations delete failed: ${conversationsDeleteError.message}`);
      }
    }

    const { error: contactsDeleteError } = await adminClient.from("contacts").delete().in("id", contactIds);
    if (contactsDeleteError) {
      throw new Error(`Demo contacts delete failed: ${contactsDeleteError.message}`);
    }
  }

  let focusConversationId = null;

  for (const seed of DEMO_SEEDS) {
    const inboundAt = new Date(Date.now() - seed.hoursAgo * 60 * 60 * 1000).toISOString();
    const outboundAt =
      typeof seed.replyOffsetHours === "number"
        ? new Date(Date.now() - seed.replyOffsetHours * 60 * 60 * 1000).toISOString()
        : null;
    const lastTouchAt = outboundAt ?? inboundAt;

    const { data: contact, error: contactError } = await adminClient
      .from("contacts")
      .insert({
        company_id: companyId,
        name: seed.name,
        phone: seed.phone,
      })
      .select("id")
      .single();

    if (contactError || !contact?.id) {
      throw new Error(`Demo contact insert failed: ${contactError?.message ?? "unknown"}`);
    }

    const { data: conversation, error: conversationError } = await adminClient
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contact.id,
        assigned_to: outboundAt ? assignedToUserId : null,
        channel: "whatsapp",
        status: seed.status,
        lead_type: seed.leadType,
        estimated_value: seed.estimatedValue,
        expected_value: seed.status === "won" ? seed.estimatedValue : 0,
        ai_priority: seed.priority,
        last_message_at: lastTouchAt,
        last_inbound_at: inboundAt,
        last_outbound_at: outboundAt,
        created_at: inboundAt,
        updated_at: lastTouchAt,
      })
      .select("id")
      .single();

    if (conversationError || !conversation?.id) {
      throw new Error(`Demo conversation insert failed: ${conversationError?.message ?? "unknown"}`);
    }

    if (!focusConversationId && seed.status === "no_response") {
      focusConversationId = conversation.id;
    }

    const messages = [
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
      messages.push({
        company_id: companyId,
        conversation_id: conversation.id,
        direction: "outbound",
        sender_type: "agent",
        channel: "whatsapp",
        text: "Gracias, te paso la información y vemos disponibilidad.",
        raw_payload: { source: "demo_seed" },
        created_at: outboundAt,
      });
    }

    const { error: messageError } = await adminClient.from("messages").insert(messages);
    if (messageError) {
      throw new Error(`Demo messages insert failed: ${messageError.message}`);
    }
  }

  return { seeded: DEMO_SEEDS.length, focusConversationId };
}

async function verifyPasswordLogin({ supabaseUrl, anonKey, email, password }) {
  if (!anonKey) return { verified: false, skipped: "missing_anon_key" };

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { error } = await authClient.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Demo login verification failed: ${error.message}`);
  }
  await authClient.auth.signOut();
  return { verified: true };
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL ?? required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = (process.env.DEMO_USER_EMAIL ?? DEFAULT_DEMO_EMAIL).trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD ?? DEFAULT_DEMO_PASSWORD;
  const fullName = (process.env.DEMO_USER_FULL_NAME ?? DEFAULT_DEMO_FULL_NAME).trim();

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const existingUsers = await listAllUsers(adminClient);
  const existingUser = existingUsers.find((user) => (user.email ?? "").toLowerCase() === email) ?? null;
  const existingCompany = existingUser ? await getExistingProfileCompany(adminClient, existingUser.id) : null;
  const baseCompany = existingCompany ?? (await findOrCreateCompany(adminClient, DEFAULT_DEMO_COMPANY_NAME));
  const company = await ensureDemoCompany(adminClient, baseCompany);
  const user = await ensureDemoUser(adminClient, { email, password, company, fullName });
  await ensureDemoProfile(adminClient, { userId: user.id, companyId: company.id, fullName });
  const seedResult = await resetDemoData(adminClient, { companyId: company.id, assignedToUserId: user.id });
  const loginVerification = await verifyPasswordLogin({ supabaseUrl, anonKey, email, password });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        company: {
          id: company.id,
          name: company.name,
        },
        profile: {
          id: user.id,
          role: "agent",
        },
        seeded: seedResult.seeded,
        focusConversationId: seedResult.focusConversationId,
        loginVerification,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
