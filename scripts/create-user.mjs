import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Forge kullanıcı oluşturma scripti.
 *
 * 1) Aşağıdaki USER bloğunu doldur. Gerçek şifreleri commit etme.
 * 2) .env içine SUPABASE_SERVICE_ROLE_KEY ekle (Dashboard → Settings → API).
 * 3) Çalıştır: npm run create-user
 *
 * role: 'student' | 'trainer' | 'admin'
 * Öğrenciye hoca bağlamak için trainerEmail yaz.
 */
const USER = {
  email: '',
  password: '',
  fullName: '',
  role: 'student', // student | trainer | admin
  trainerEmail: '', // sadece student için
  isActive: true,
};

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const text = readFileSync(envPath, 'utf8');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(`\nHata: ${message}\n`);
  process.exit(1);
}

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  fail(
    '.env içinde EXPO_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY olmalı. Service role anahtarı Dashboard → Project Settings → API.',
  );
}

const email = String(USER.email || '')
  .trim()
  .toLowerCase();
const password = String(USER.password || '');
const fullName = String(USER.fullName || '').trim();
const role = String(USER.role || '').trim();
const trainerEmail = String(USER.trainerEmail || '')
  .trim()
  .toLowerCase();

if (!email || !email.includes('@')) fail('USER.email geçerli bir e-posta olmalı.');
if (password.length < 8) fail('USER.password en az 8 karakter olmalı.');
if (!fullName) fail('USER.fullName boş olamaz.');
if (!['student', 'trainer', 'admin'].includes(role)) {
  fail("USER.role 'student', 'trainer' veya 'admin' olmalı.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role },
  user_metadata: { full_name: fullName },
});

if (createError) {
  const alreadyExists = /already been registered|already exists|email_exists/i.test(
    createError.message,
  );
  if (!alreadyExists) {
    fail(createError.message);
  }

  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) fail(`Kullanıcı listelenemedi: ${listError.message}`);
  const existing = usersPage.users.find((user) => user.email === email);
  if (!existing) fail(`Kullanıcı zaten var ama listede bulunamadı: ${email}`);

  const nextUserMeta = { ...(existing.user_metadata ?? {}), full_name: fullName };
  delete nextUserMeta.role;

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...(existing.app_metadata ?? {}), role },
    user_metadata: nextUserMeta,
  });
  if (updateError) fail(`Mevcut kullanıcı güncellenemedi: ${updateError.message}`);
  userId = existing.id;
  console.log(`Mevcut kullanıcı güncellendi: ${email}`);
} else if (!created.user) {
  fail('Auth kullanıcısı oluşturulamadı.');
} else {
  userId = created.user.id;
}
let trainerId = null;

if (role === 'student' && trainerEmail) {
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) fail(`Hoca aranamadı: ${listError.message}`);
  const trainerUser = usersPage.users.find((user) => user.email === trainerEmail);
  if (!trainerUser) fail(`trainerEmail bulunamadı: ${trainerEmail}`);

  const { data: trainerProfile, error: trainerProfileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', trainerUser.id)
    .maybeSingle();

  if (trainerProfileError) fail(trainerProfileError.message);
  if (!trainerProfile || (trainerProfile.role !== 'trainer' && trainerProfile.role !== 'admin')) {
    fail(`${trainerEmail} bir trainer/admin profili değil.`);
  }
  trainerId = trainerProfile.id;
}

const profileRow = {
  id: userId,
  role,
  full_name: fullName,
  trainer_id: trainerId,
  is_active: USER.isActive !== false,
};

const { error: insertError } = await admin.from('profiles').insert(profileRow);

if (insertError) {
  if (insertError.code === '23505') {
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        role,
        full_name: fullName,
        trainer_id: trainerId,
        is_active: USER.isActive !== false,
      })
      .eq('id', userId);
    if (updateError) fail(`Profil güncellenemedi: ${updateError.message}`);
  } else {
    fail(`Profil yazılamadı: ${insertError.message}`);
  }
}

console.log('\nKullanıcı eklendi.');
console.log(`  id:      ${userId}`);
console.log(`  email:   ${email}`);
console.log(`  name:    ${fullName}`);
console.log(`  role:    ${role}`);
if (trainerId) console.log(`  trainer: ${trainerEmail} (${trainerId})`);
console.log('  Uygulamadan Sign In ile giriş yapabilir.\n');
