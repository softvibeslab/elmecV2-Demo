#!/usr/bin/env node

/**
 * Crea cuentas de Auth para usuarios que existen en la tabla users
 * pero no tienen cuenta en Supabase Auth
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = 'abc321';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAuthForUser(email, userId) {
  console.log(`\n🔧 Creando cuenta Auth para: ${email}`);

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        created_by: 'migration_script',
      },
    });

    if (error) {
      console.error('❌ Error:', error.message);
      return false;
    }

    console.log('✅ Cuenta creada exitosamente');
    console.log(`   ID Auth: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║      CREAR CUENTAS AUTH PARA USUARIOS FALTANTES          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nContraseña temporal: ${DEFAULT_PASSWORD}\n`);

  // Usuarios que necesitan cuenta de auth
  const usersToCreate = [
    {
      email: 'i.pineda@elmec.com.mx',
      id: '8d4be740-a5ee-45d9-abb6-a5801cc9da6e',
    },
    {
      email: 'j.gonzalez@elmec.com.mx',
      id: 'c7c81f4e-21a8-4dbb-8613-a6b31f8e3e68',
    },
  ];

  let success = 0;
  let failed = 0;

  for (const user of usersToCreate) {
    const result = await createAuthForUser(user.email, user.id);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║                        RESUMEN                             ║');
  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );
  console.log(`Total procesados: ${usersToCreate.length}`);
  console.log(`✅ Creados exitosamente: ${success}`);
  console.log(`❌ Fallidos: ${failed}`);

  if (success > 0) {
    console.log('\n🎉 Los usuarios ahora pueden hacer login con:');
    console.log(`   Contraseña: ${DEFAULT_PASSWORD}`);
  }

  console.log('\n');
}

main().catch(e => {
  console.error('Error fatal:', e.message || e);
  process.exit(1);
});
