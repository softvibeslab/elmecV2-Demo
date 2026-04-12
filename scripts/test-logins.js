#!/usr/bin/env node

/**
 * Prueba de login para usuarios de ELMEC usando la contraseña temporal
 * Usa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY del .env
 * Contraseña: TEST_LOGIN_PASSWORD (si no, DEFAULT_TEMP_PASSWORD, si no, 'abc321')
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const DEFAULT_TEMP_PASSWORD = process.env.DEFAULT_TEMP_PASSWORD;
const TEST_LOGIN_PASSWORD =
  process.env.TEST_LOGIN_PASSWORD || DEFAULT_TEMP_PASSWORD || 'abc321';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    '❌ Error: faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY en .env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fetchElmecUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, correo_electronico, email, nombre, apellido_paterno, rol, empresa, activo'
    )
    .eq('empresa', 'ELMEC');
  if (error) throw new Error(error.message);
  return (data || [])
    .map(u => ({
      id: u.id,
      email: u.correo_electronico || u.email,
      name: `${u.nombre || ''} ${u.apellido_paterno || ''}`.trim(),
      role: u.rol,
      active: u.activo,
    }))
    .filter(u => !!u.email);
}

async function tryLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: !!data?.session, userId: data?.user?.id };
}

async function main() {
  console.log('=== Prueba de login de usuarios ELMEC ===');
  console.log('Password usada para la prueba:', TEST_LOGIN_PASSWORD);

  let users = [];
  try {
    users = await fetchElmecUsers();
  } catch (e) {
    console.error('Error al obtener usuarios ELMEC:', e.message);
    process.exit(1);
  }

  if (users.length === 0) {
    console.log('No se encontraron usuarios ELMEC en public.users');
    process.exit(0);
  }

  let okCount = 0;
  let failCount = 0;
  for (const u of users) {
    const res = await tryLogin(u.email, TEST_LOGIN_PASSWORD);
    if (res.ok) {
      okCount++;
      console.log(`✔ Login OK: ${u.email} (${u.role}) → ${res.userId}`);
    } else {
      failCount++;
      console.log(`✖ Login FAIL: ${u.email} (${u.role}) → ${res.error}`);
    }
  }

  console.log('\nResumen login:');
  console.log(`✔ OK: ${okCount}`);
  console.log(`✖ Fallidos: ${failCount}`);

  if (failCount > 0) {
    console.log('\nSugerencias:');
    console.log(
      '- Verifica que DEFAULT_TEMP_PASSWORD estuviera definido al crear las cuentas'
    );
    console.log(
      '- Si los usuarios ya existían, puede que no se les haya asignado la contraseña temporal'
    );
    console.log(
      '- Puedes usar enlaces de recuperación para forzar cambio de contraseña al entrar'
    );
  }
}

main().catch(e => {
  console.error('Error en test-logins:', e.message || e);
  process.exit(1);
});
