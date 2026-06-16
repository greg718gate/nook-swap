import { createClient } from "@supabase/supabase-js";

const url = "https://nmgiyvauguilbwtqlexj.supabase.co";
const anon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ2l5dmF1Z3VpbGJ3dHFsZXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc3NDgsImV4cCI6MjA3NzI1Mzc0OH0.pZ0Lv94aBkLwBUfhF-cw_XjQPH4Y-0gjAQi9yKZfKus";

const supabase = createClient(url, anon);

const email = `sdk${Date.now()}@mailinator.com`;
const password = "testpass123";

console.log("--- invoke auth-signup (like browser) ---");
const { data, error } = await supabase.functions.invoke("auth-signup", {
  body: { email, password, username: "sdkuser" },
});
console.log("data", data);
console.log("error", error);
if (error && error.context) {
  try {
    const text = await error.context.text();
    console.log("error body", text);
    console.log("error status", error.context.status);
  } catch {}
}

console.log("--- signInWithPassword ---");
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
console.log("login error", loginError?.message, loginError?.status);
console.log("login session", !!loginData.session);

// Test raw endpoints without bearer
console.log("--- signup no auth header ---");
const res1 = await fetch(`${url}/functions/v1/auth-signup`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email: `noauth${Date.now()}@mailinator.com`, password, username: "x" }),
});
console.log(res1.status, await res1.text());

// Test with invalid jwt
console.log("--- signup invalid jwt ---");
const res2 = await fetch(`${url}/functions/v1/auth-signup`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: "Bearer invalid",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: `badjwt${Date.now()}@mailinator.com`, password, username: "x" }),
});
console.log(res2.status, await res2.text());
