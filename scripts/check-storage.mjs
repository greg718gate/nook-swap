import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1];
const key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)?.[1];
const supabase = createClient(url, key);

const email = `storagetest_${Date.now()}@test.local`;
const password = `Zx9!kL2mQ${Date.now()}Wp#`;

const { data: auth, error: signErr } = await supabase.auth.signUp({ email, password });
if (signErr) {
  console.log('SIGNUP_ERR', signErr.message);
  process.exit(1);
}

const userId = auth.user?.id;
const results = [];

for (const bucket of ['product-images', 'digital-products']) {
  const blob = new Blob(['test-image-data'], { type: 'image/jpeg' });
  const path = `${userId}/test-${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob);
  if (upErr) {
    results.push(`${bucket}:FAIL:${upErr.message}`);
    continue;
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const { error: dlErr } = await supabase.storage.from(bucket).download(path);
  await supabase.storage.from(bucket).remove([path]);
  results.push(`${bucket}:OK:upload,download,public=${bucket === 'product-images' ? pub.publicUrl.length > 0 : 'n/a'}${dlErr ? ',dl_fail' : ''}`);
}

console.log(results.join('\n'));
