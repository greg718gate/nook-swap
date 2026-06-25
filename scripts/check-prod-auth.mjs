const html = await fetch("https://velvetbazzar.co.uk").then((r) => r.text());
const assets = [...html.matchAll(/\/assets\/[^"']+\.js/g)].map((m) => m[0]);
console.log("assets:", assets);

for (const asset of assets) {
  const js = await fetch("https://velvetbazzar.co.uk" + asset).then((r) => r.text());
  const supabase = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/g);
  const project = js.includes("kwyegfqyjfuvxtdkgldb");
  const authSignup = js.includes("auth-signup");
  if (supabase || project || authSignup) {
    console.log(asset, { supabase: supabase?.[0], project, authSignup });
  }
}

// simulate browser invoke
const anon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ2l5dmF1Z3VpbGJ3dHFsZXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc3NDgsImV4cCI6MjA3NzI1Mzc0OH0.pZ0Lv94aBkLwBUfhF-cw_XjQPH4Y-0gjAQi9yKZfKus";
const email = `browser${Date.now()}@mailinator.com`;
const res = await fetch("https://kwyegfqyjfuvxtdkgldb.supabase.co/functions/v1/auth-signup", {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
    Origin: "https://velvetbazzar.co.uk",
  },
  body: JSON.stringify({ email, password: "testpass123", username: "browser" }),
});
console.log("browser-like signup", res.status, await res.text());

const loginRes = await fetch(
  "https://kwyegfqyjfuvxtdkgldb.supabase.co/auth/v1/token?grant_type=password",
  {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
      Origin: "https://velvetbazzar.co.uk",
    },
    body: JSON.stringify({ email, password: "testpass123" }),
  },
);
console.log("browser-like login", loginRes.status, (await loginRes.text()).slice(0, 120));
