/**
 * Script para configurar las políticas de seguridad del bucket
 *
 * Este script configura las políticas RLS para el bucket 'request-files'
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BUCKET_NAME = 'request-files';

async function setupStoragePolicies() {
  console.log('🔐 Configurando políticas de seguridad...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '❌ Error: Se necesita SUPABASE_SERVICE_ROLE_KEY para crear políticas'
    );
    console.log(
      '   Esta clave se encuentra en: Settings → API → service_role (secret)\n'
    );
    console.log(
      '⚠️  Las políticas deben configurarse manualmente en el dashboard.\n'
    );
    showManualInstructions(supabaseUrl);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('📋 Intentando crear políticas automáticamente...\n');

    // Política 1: Lectura pública
    console.log('1. Creando política de lectura pública...');
    const policy1 = `
      CREATE POLICY IF NOT EXISTS "Public read access"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = '${BUCKET_NAME}');
    `;

    const { error: error1 } = await supabase.rpc('exec_sql', { sql: policy1 });

    if (error1) {
      console.log('   ⚠️  No se pudo crear automáticamente');
      console.log(`   Error: ${error1.message}\n`);
    } else {
      console.log('   ✅ Política de lectura creada\n');
    }

    // Política 2: Upload para autenticados
    console.log('2. Creando política de upload...');
    const policy2 = `
      CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = '${BUCKET_NAME}');
    `;

    const { error: error2 } = await supabase.rpc('exec_sql', { sql: policy2 });

    if (error2) {
      console.log('   ⚠️  No se pudo crear automáticamente');
      console.log(`   Error: ${error2.message}\n`);
    } else {
      console.log('   ✅ Política de upload creada\n');
    }

    // Política 3: Actualizar propios archivos
    console.log('3. Creando política de actualización...');
    const policy3 = `
      CREATE POLICY IF NOT EXISTS "Users can update own files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner)
      WITH CHECK (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner);
    `;

    const { error: error3 } = await supabase.rpc('exec_sql', { sql: policy3 });

    if (error3) {
      console.log('   ⚠️  No se pudo crear automáticamente');
      console.log(`   Error: ${error3.message}\n`);
    } else {
      console.log('   ✅ Política de actualización creada\n');
    }

    // Política 4: Eliminar propios archivos
    console.log('4. Creando política de eliminación...');
    const policy4 = `
      CREATE POLICY IF NOT EXISTS "Users can delete own files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner);
    `;

    const { error: error4 } = await supabase.rpc('exec_sql', { sql: policy4 });

    if (error4) {
      console.log('   ⚠️  No se pudo crear automáticamente');
      console.log(`   Error: ${error4.message}\n`);
    } else {
      console.log('   ✅ Política de eliminación creada\n');
    }

    if (error1 || error2 || error3 || error4) {
      console.log(
        '⚠️  Algunas políticas no se pudieron crear automáticamente.\n'
      );
      showManualInstructions(supabaseUrl);
    } else {
      console.log('✨ ¡Todas las políticas se configuraron exitosamente!\n');
      console.log(
        '✅ El bucket está completamente configurado y listo para usar\n'
      );
      console.log('📝 Siguiente paso:');
      console.log('   npx expo start --clear\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Las políticas deben configurarse manualmente.\n');
    showManualInstructions(supabaseUrl);
    process.exit(1);
  }
}

function showManualInstructions(supabaseUrl) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 INSTRUCCIONES PARA CONFIGURAR POLÍTICAS MANUALMENTE');
  console.log('═══════════════════════════════════════════════════════\n');

  const dashboardUrl = supabaseUrl
    ? `${supabaseUrl.replace('.supabase.co', '')}/project/default/storage/policies`
    : 'Dashboard de Supabase → Storage → Policies';

  console.log(`1. Ve a: ${dashboardUrl}\n`);
  console.log('2. Haz clic en "New Policy" en la tabla storage.objects\n');
  console.log('3. Crea estas 4 políticas:\n');

  console.log('───────────────────────────────────────────────────────');
  console.log('POLÍTICA 1: Lectura pública');
  console.log('───────────────────────────────────────────────────────');
  console.log('Nombre: Public read access');
  console.log('Operación: SELECT');
  console.log('Target roles: public\n');
  console.log('SQL:');
  console.log(`bucket_id = '${BUCKET_NAME}'\n`);

  console.log('───────────────────────────────────────────────────────');
  console.log('POLÍTICA 2: Upload para autenticados');
  console.log('───────────────────────────────────────────────────────');
  console.log('Nombre: Authenticated users can upload');
  console.log('Operación: INSERT');
  console.log('Target roles: authenticated\n');
  console.log('SQL (WITH CHECK):');
  console.log(`bucket_id = '${BUCKET_NAME}'\n`);

  console.log('───────────────────────────────────────────────────────');
  console.log('POLÍTICA 3: Actualizar propios archivos');
  console.log('───────────────────────────────────────────────────────');
  console.log('Nombre: Users can update own files');
  console.log('Operación: UPDATE');
  console.log('Target roles: authenticated\n');
  console.log('SQL (USING):');
  console.log(`bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner\n`);
  console.log('SQL (WITH CHECK):');
  console.log(`bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner\n`);

  console.log('───────────────────────────────────────────────────────');
  console.log('POLÍTICA 4: Eliminar propios archivos');
  console.log('───────────────────────────────────────────────────────');
  console.log('Nombre: Users can delete own files');
  console.log('Operación: DELETE');
  console.log('Target roles: authenticated\n');
  console.log('SQL (USING):');
  console.log(`bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = owner\n`);

  console.log('═══════════════════════════════════════════════════════\n');
}

// Ejecutar el script
setupStoragePolicies()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
