const url = "https://kwyegfqyjfuvxtdkgldb.supabase.co";
const anon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ2l5dmF1Z3VpbGJ3dHFsZXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc3NDgsImV4cCI6MjA3NzI1Mzc0OH0.pZ0Lv94aBkLwBUfhF-cw_XjQPH4Y-0gjAQi9yKZfKus";

const email = `testvb${Date.now()}@mailinator.com`;
const password = "testpass123";

const headers = {
  apikey: anon,
  Authorization: `Bearer ${anon}`,
  "Content-Type": "application/json",
};

async function testSignup() {
  const res = await fetch(`${url}/functions/v1/auth-signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, username: "testuser" }),
  });
  const text = await res.text();
  console.log("SIGNUP", res.status, text);
  return res.ok;
}

async function testLogin(loginEmail, loginPassword) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: loginEmail, password: loginPassword }),
  });
  const text = await res.text();
  console.log("LOGIN", res.status, text.slice(0, 300));
  return res.ok;
}

const signupOk = await testSignup();
if (signupOk) {
  await testLogin(email, password);
}
