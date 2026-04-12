#!/usr/bin/env node

/**
 * Script para verificar usuarios específicos en Supabase
 * Verifica tanto en Auth como en la tabla users
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: faltan credenciales de Supabase');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error(
    '   SUPABASE_SERVICE_ROLE_KEY:',
    SERVICE_ROLE_KEY ? '✅' : '❌'
  );
  process.exit(1);
}

// Cliente con service role para acceder a auth.admin
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkUser(email) {
  console.log(`\n🔍 Verificando usuario: ${email}`);
  console.log('─'.repeat(60));

  try {
    // 1. Buscar en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('correo_electronico', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error buscando en tabla users:', userError.message);
    }

    if (userData) {
      console.log('✅ Usuario encontrado en tabla users:');
      console.log(`   ID: ${userData.id}`);
      console.log(
        `   Nombre: ${userData.nombre} ${userData.apellido_paterno || ''}`
      );
      console.log(`   Email: ${userData.correo_electronico}`);
      console.log(`   Rol: ${userData.rol}`);
      console.log(`   Empresa: ${userData.empresa}`);
      console.log(`   Activo: ${userData.activo ? 'Sí' : 'No'}`);

      // 2. Buscar en auth.users usando el ID
      const { data: authData, error: authError } =
        await supabase.auth.admin.getUserById(userData.id);

      if (authError) {
        console.log('⚠️  Usuario NO encontrado en Supabase Auth');
        console.log('   Necesita crear cuenta de auth primero');
        return { inUsers: true, inAuth: false, userData };
      }

      if (authData.user) {
        console.log('\n✅ Usuario encontrado en Supabase Auth:');
        console.log(`   Email: ${authData.user.email}`);
        console.log(
          `   Email confirmado: ${authData.user.email_confirmed_at ? 'Sí' : 'No'}`
        );
        console.log(
          `   Último login: ${authData.user.last_sign_in_at || 'Nunca'}`
        );
        console.log(`   Creado: ${authData.user.created_at}`);
        return {
          inUsers: true,
          inAuth: true,
          userData,
          authData: authData.user,
        };
      }
    } else {
      console.log('❌ Usuario NO encontrado en tabla users');
      return { inUsers: false, inAuth: false };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: error.message };
  }
}

async function main() {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║     VERIFICACIÓN DE USUARIOS ELMEC EN SUPABASE           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Lista de usuarios a verificar
  const usersToCheck = [
    'i.pineda@elmec.com.mx',
    'c.rosales@elmec.com.mx',
    'alex.diaz@elmec.com.mx',
    'j.gonzalez@elmec.com.mx',
    's.vazquez@elmec.com.mx',
    'o.salazar@elmec.com.mx',
  ];

  const results = [];

  for (const email of usersToCheck) {
    const result = await checkUser(email);
    results.push({ email, ...result });
  }

  // Resumen
  console.log(
    '\n\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║                        RESUMEN                             ║');
  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );

  const canLogin = results.filter(r => r.inUsers && r.inAuth);
  const needsAuth = results.filter(r => r.inUsers && !r.inAuth);
  const notFound = results.filter(r => !r.inUsers);

  if (canLogin.length > 0) {
    console.log('✅ USUARIOS QUE PUEDEN HACER LOGIN:');
    console.log('   Contraseña temporal: abc321\n');
    canLogin.forEach(r => {
      console.log(`   📧 ${r.email}`);
      console.log(
        `      Nombre: ${r.userData.nombre} ${r.userData.apellido_paterno || ''}`
      );
      console.log(`      Rol: ${r.userData.rol}`);
      console.log('');
    });
  }

  if (needsAuth.length > 0) {
    console.log('\n⚠️  USUARIOS QUE EXISTEN PERO NO TIENEN AUTH:');
    needsAuth.forEach(r => {
      console.log(`   📧 ${r.email} - Necesita crear cuenta en Auth`);
    });
  }

  if (notFound.length > 0) {
    console.log('\n❌ USUARIOS NO ENCONTRADOS:');
    notFound.forEach(r => {
      console.log(`   📧 ${r.email}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Total verificados: ${results.length}`);
  console.log(`✅ Pueden hacer login: ${canLogin.length}`);
  console.log(`⚠️  Necesitan auth: ${needsAuth.length}`);
  console.log(`❌ No encontrados: ${notFound.length}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(e => {
  console.error('Error fatal:', e.message || e);
  process.exit(1);
});
