import { createClient } from "@supabase/supabase-js";

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

async function findOrCreateCompany(adminClient, desiredName) {
  const { data: existingCompany, error: companyLookupError } = await adminClient
    .from("companies")
    .select("id, name")
    .eq("name", desiredName)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (companyLookupError) {
    throw new Error(`Company lookup failed: ${companyLookupError.message}`);
  }

  if (existingCompany) {
    return existingCompany;
  }

  const { data: company, error: companyCreateError } = await adminClient
    .from("companies")
    .insert({ name: desiredName })
    .select("id, name")
    .single();

  if (companyCreateError || !company) {
    throw new Error(`Company create failed: ${companyCreateError?.message ?? "unknown"}`);
  }

  return company;
}

async function main() {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const smokeEmail = required("SMOKE_USER_EMAIL").trim().toLowerCase();
  const smokePassword = required("SMOKE_USER_PASSWORD");
  const smokeCompanyName = (process.env.SMOKE_COMPANY_NAME ?? "Smoke Test Workspace").trim();
  const smokeFullName = (process.env.SMOKE_USER_FULL_NAME ?? "Smoke Test Owner").trim();

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const allUsers = await listAllUsers(adminClient);
  const existingUser = allUsers.find((user) => (user.email ?? "").toLowerCase() === smokeEmail) ?? null;

  let userId = existingUser?.id ?? null;
  if (!existingUser) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: smokeEmail,
      password: smokePassword,
      email_confirm: true,
      user_metadata: {
        full_name: smokeFullName,
        company_name: smokeCompanyName,
        role: "owner",
      },
    });

    if (error || !data.user) {
      throw new Error(`Smoke user create failed: ${error?.message ?? "unknown"}`);
    }

    userId = data.user.id;
  } else {
    const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      password: smokePassword,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: smokeFullName,
        company_name: smokeCompanyName,
        role: "owner",
      },
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Smoke user update failed: ${error.message}`);
    }

    userId = existingUser.id;
  }

  if (!userId) {
    throw new Error("Smoke user id missing after create/update");
  }

  const company = await findOrCreateCompany(adminClient, smokeCompanyName);

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: userId,
      company_id: company.id,
      full_name: smokeFullName,
      role: "owner",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Smoke profile upsert failed: ${profileError.message}`);
  }

  const { data: profile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError || !profile) {
    throw new Error(`Smoke profile verify failed: ${profileLookupError?.message ?? "missing_profile"}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        smokeEmail,
        smokeFullName,
        company,
        profile,
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
