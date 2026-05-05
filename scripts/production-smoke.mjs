import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function fetchOk(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 400) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return response.status;
}

async function main() {
  const appUrl = required("SMOKE_APP_URL").replace(/\/$/, "");
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const smokeEmail = required("SMOKE_USER_EMAIL");
  const smokePassword = required("SMOKE_USER_PASSWORD");

  const publicChecks = [
    `${appUrl}/`,
    `${appUrl}/login`,
    `${appUrl}/signup`,
  ];

  for (const url of publicChecks) {
    const status = await fetchOk(url);
    console.log(`ok public ${status} ${url}`);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email: smokeEmail,
    password: smokePassword,
  });

  if (signInError || !signInData.user) {
    throw new Error(`Supabase sign-in failed: ${signInError?.message ?? "unknown"}`);
  }

  console.log(`ok auth signed in ${smokeEmail}`);

  const userId = signInData.user.id;
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(`Profile lookup failed: ${profileError?.message ?? "missing_profile"}`);
  }

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("id, name, config")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (companyError || !company) {
    throw new Error(`Company lookup failed: ${companyError?.message ?? "missing_company"}`);
  }

  const { count: conversationCount, error: conversationsError } = await adminClient
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.company_id);

  if (conversationsError) {
    throw new Error(`Conversation count failed: ${conversationsError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        profile,
        companyName: company.name,
        conversationCount: conversationCount ?? 0,
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
