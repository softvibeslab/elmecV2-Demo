#!/usr/bin/env node

/**
 * Corrige IDs en la tabla users para que coincidan con Auth
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

async function fixUserId(email, oldId, newId) {
  console.log(`\n🔧 Corrigiendo ID para: ${email}`);
  console.log(`   Old ID: ${oldId}`);
  console.log(`   New ID: ${newId}`);

  try {
    // 1. Leer datos actuales del usuario
    const { data: userData, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('id', oldId)
      .single();

    if (readError) {
      console.error('❌ Error leyendo usuario:', readError.message);
      return false;
    }

    console.log('   ✓ Datos leídos');

    // 2. Eliminar registro viejo
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldId);

    if (deleteError) {
      console.error('❌ Error eliminando registro viejo:', deleteError.message);
      return false;
    }

    console.log('   ✓ Registro viejo eliminado');

    // 3. Insertar con nuevo ID
    const newUserData = {
      ...userData,
      id: newId,
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(newUserData);

    if (insertError) {
      console.error('❌ Error insertando con nuevo ID:', insertError.message);
      // Intentar restaurar el viejo
      await supabase.from('users').insert(userData);
      return false;
    }

    console.log('✅ ID corregido exitosamente');
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
  console.log('║           CORREGIR IDs EN TABLA USERS                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const fixes = [
    {
      email: 'i.pineda@elmec.com.mx',
      oldId: '8d4be740-a5ee-45d9-abb6-a5801cc9da6e',
      newId: '29998833-4e1a-4874-bd92-e1225e0455b4',
    },
    {
      email: 'j.gonzalez@elmec.com.mx',
      oldId: 'c7c81f4e-21a8-4dbb-8613-a6b31f8e3e68',
      newId: '68d30e15-c182-4b59-8d41-9adaa25f842d',
    },
  ];

  let success = 0;
  let failed = 0;

  for (const fix of fixes) {
    const result = await fixUserId(fix.email, fix.oldId, fix.newId);
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
  console.log(`Total procesados: ${fixes.length}`);
  console.log(`✅ Corregidos exitosamente: ${success}`);
  console.log(`❌ Fallidos: ${failed}`);

  if (success > 0) {
    console.log('\n🎉 Los usuarios ahora pueden hacer login!');
    console.log('   Contraseña: abc321');
  }

  console.log('\n');
}

main().catch(e => {
  console.error('Error fatal:', e.message || e);
  process.exit(1);
});
