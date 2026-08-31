/**
 * Provision or verify a student account using the public anon key only.
 * Creates the account via sign-up when missing; completes onboarding on the profile.
 *
 *   PROVISION_EMAIL=... PROVISION_PASSWORD=... node scripts/provision-user.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(relativePath) {
  let text;
  try {
    text = readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const email = process.env.PROVISION_EMAIL?.trim();
const password = process.env.PROVISION_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!email || !password) {
  console.error("provision-user: set PROVISION_EMAIL and PROVISION_PASSWORD");
  process.exit(1);
}
if (!url || !anonKey) {
  console.error("provision-user: NEXT_PUBLIC_SUPABASE_URL and anon key required in .env.local");
  process.exit(1);
}

function authHeaders(accessToken) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken ?? anonKey}`,
    "Content-Type": "application/json",
  };
}

async function signIn() {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, body };
}

async function signUp() {
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, body };
}

async function completeProfile(accessToken, userId) {
  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      display_name: "EdMar Admin",
      territory: "JM",
      age_confirmed_13_plus: true,
      onboarding_completed_at: new Date().toISOString(),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? response.statusText);
  }
  return body;
}

let session = await signIn();

if (!session.ok) {
  const message = session.body.error_description ?? session.body.msg ?? session.body.error ?? "";
  if (/invalid login credentials/i.test(message)) {
    const created = await signUp();
    if (!created.ok) {
      const createMessage =
        created.body.error_description ?? created.body.msg ?? created.body.error ?? "sign-up failed";
      if (/already registered|already exists/i.test(createMessage)) {
        console.error(
          "provision-user: account exists but password sign-in failed. Reset the password in the Supabase dashboard, then try again.",
        );
        process.exit(1);
      }
      console.error("provision-user: sign-up failed:", createMessage);
      process.exit(1);
    }
    session = { ok: true, body: created.body };
    console.log("provision-user: created account via sign-up");
  } else {
    console.error("provision-user: sign-in failed:", message);
    process.exit(1);
  }
} else {
  console.log("provision-user: sign-in ok");
}

const accessToken = session.body.access_token;
const userId = session.body.user?.id;
if (!accessToken || !userId) {
  console.error("provision-user: no session returned — check whether email confirmation is required on the project");
  process.exit(1);
}

await completeProfile(accessToken, userId);
console.log("provision-user: onboarding marked complete");
console.log("provision-user: ok");
