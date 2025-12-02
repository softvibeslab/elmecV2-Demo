#!/usr/bin/env node

/**
 * Busca usuarios en Auth por email
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function findUserByEmail(email) {
  console.log(`\n🔍 Buscando: ${email}`);

  try {
    // Listar todos los usuarios y filtrar por email
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error:', error.message);
      return null;
    }

    const user = data.users.find(u => u.email === email);

    if (user) {
      console.log('✅ Encontrado en Auth:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}`);

      // Buscar en tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, nombre, apellido_paterno, rol')
        .eq('correo_electronico', email)
        .single();

      if (userData) {
        console.log('\n📋 En tabla users:');
        console.log(`   ID: ${userData.id}`);
        console.log(
          `   Nombre: ${userData.nombre} ${userData.apellido_paterno || ''}`
        );
        console.log(`   Rol: ${userData.rol}`);

        if (user.id !== userData.id) {
          console.log('\n⚠️  IDs NO COINCIDEN:');
          console.log(`   Auth ID:  ${user.id}`);
          console.log(`   Users ID: ${userData.id}`);
        } else {
          console.log('\n✅ IDs coinciden correctamente');
        }
      }

      return user;
    } else {
      console.log('❌ No encontrado en Auth');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║          BUSCAR USUARIOS EN SUPABASE AUTH                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const emails = [
    'i.pineda@elmec.com.mx',
    'j.gonzalez@elmec.com.mx',
    'c.rosales@elmec.com.mx',
    'alex.diaz@elmec.com.mx',
  ];

  for (const email of emails) {
    await findUserByEmail(email);
  }

  console.log('\n');
}

main().catch(e => {
  console.error('Error fatal:', e.message || e);
  process.exit(1);
});
