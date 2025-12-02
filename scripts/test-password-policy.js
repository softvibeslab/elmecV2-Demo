// Prueba si una contraseña dada es aceptada por Supabase Auth y valida el inicio de sesión
// Además, realiza una verificación básica de complejidad (no vinculante) para recomendaciones.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Puedes cambiar la contraseña a probar vía env TEST_PASSWORD
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'abc321';

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    'ERROR: Falta EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en .env'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const client = createClient(SUPABASE_URL, ANON_KEY);

function analyzePasswordComplexity(pw) {
  const lengthOk = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const isCommonPattern =
    /^(123456|password|qwerty|abc123|abc321|letmein|welcome)$/i.test(pw) ||
    (/abc/i.test(pw) && /123|321/.test(pw));
  return {
    lengthOk,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial,
    isCommonPattern,
    recommended:
      lengthOk &&
      hasUpper &&
      hasLower &&
      hasDigit &&
      hasSpecial &&
      !isCommonPattern,
  };
}

async function main() {
  const email = `password.test+${Date.now()}@elmec.com.mx`;
  console.log('=== Prueba de contraseña ===');
  console.log('Email de prueba:', email);
  console.log('Contraseña a probar:', TEST_PASSWORD);

  const analysis = analyzePasswordComplexity(TEST_PASSWORD);
  console.log('Análisis básico de complejidad:', analysis);

  // Crear usuario con la contraseña de prueba
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { test: true },
    }
  );
  if (createErr) {
    console.error('Error al crear usuario de prueba:', createErr.message);
    process.exit(1);
  }
  const userId = created?.user?.id;
  console.log('Usuario creado:', userId);

  // Intentar login con anon key
  const { data: signInData, error: signInErr } =
    await client.auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    });
  if (signInErr) {
    console.error(
      'Error al iniciar sesión con la contraseña dada:',
      signInErr.message
    );
  } else {
    console.log('Inicio de sesión OK. Session:', Boolean(signInData?.session));
  }

  // Limpieza: eliminar el usuario de prueba
  if (userId) {
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error(
        'No se pudo eliminar el usuario de prueba:',
        delErr.message
      );
    } else {
      console.log('Usuario de prueba eliminado.');
    }
  }

  console.log('\nConclusión:');
  if (signInErr) {
    console.log(
      '- La contraseña NO permitió inicio de sesión en este proyecto.'
    );
  } else {
    console.log('- La contraseña permitió inicio de sesión.');
  }
  if (!analysis.recommended) {
    console.log(
      '- Recomendación: usar una contraseña más fuerte (>=8 chars, mayúscula/minúscula, número y símbolo, evitar patrones comunes).'
    );
  } else {
    console.log(
      '- La contraseña cumple recomendaciones básicas de complejidad.'
    );
  }
}

main().catch(e => {
  console.error('Error general:', e?.message || e);
  process.exit(1);
});
