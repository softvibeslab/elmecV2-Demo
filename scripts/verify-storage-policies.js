/**
 * Script para verificar las políticas de seguridad del bucket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BUCKET_NAME = 'request-files';

async function verifyPolicies() {
  console.log('🔐 Verificando políticas de seguridad de Supabase Storage...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: EXPO_PUBLIC_SUPABASE_URL no configurada');
    process.exit(1);
  }

  // Usar service role key si está disponible para verificar políticas
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

  try {
    // Paso 1: Verificar que el bucket existe
    console.log('📦 Paso 1: Verificando bucket...');
    const { data: buckets, error: bucketsError } =
      await adminSupabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error al verificar buckets:', bucketsError.message);
      process.exit(1);
    }

    const bucket = buckets.find(b => b.name === BUCKET_NAME);
    if (!bucket) {
      console.log(`❌ El bucket '${BUCKET_NAME}' no existe`);
      console.log('\n📋 Ejecuta este comando para crearlo:');
      console.log('   node scripts/create-storage-bucket.js\n');
      process.exit(1);
    }

    console.log(`✅ Bucket '${BUCKET_NAME}' encontrado`);
    console.log(`   - Público: ${bucket.public ? 'Sí ✅' : 'No ❌'}`);
    console.log(`   - ID: ${bucket.id}`);

    if (!bucket.public) {
      console.log('\n⚠️  ADVERTENCIA: El bucket debe ser público');
      console.log('   Ve al dashboard de Supabase y marca como público\n');
    }

    // Paso 2: Probar acceso de lectura (política pública)
    console.log('\n🔍 Paso 2: Probando lectura pública...');
    const publicSupabase = createClient(supabaseUrl, anonKey);

    const { data: files, error: listError } = await publicSupabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (listError) {
      console.log('⚠️  No se puede listar archivos públicamente');
      console.log(`   Error: ${listError.message}`);
      console.log('   Posible causa: Falta política de SELECT (lectura)\n');
    } else {
      console.log('✅ Lectura pública funcional');
    }

    // Paso 3: Verificar permisos de upload (necesita autenticación)
    console.log('\n📤 Paso 3: Verificando permisos de upload...');

    // Crear un archivo de prueba pequeño
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(`test/${testFileName}`, testBlob, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.log('⚠️  No se puede subir archivos');
      console.log(`   Error: ${uploadError.message}`);
      console.log('   Posible causa: Falta política de INSERT (upload)\n');
    } else {
      console.log('✅ Upload funcional');

      // Limpiar archivo de prueba
      await adminSupabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
      console.log('   (Archivo de prueba eliminado)');
    }

    // Paso 4: Resumen
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CONFIGURACIÓN');
    console.log('═══════════════════════════════════════════════════════\n');

    const bucketOk = bucket.public;
    const readOk = !listError;
    const uploadOk = !uploadError;

    console.log(`Bucket público:        ${bucketOk ? '✅' : '❌'}`);
    console.log(`Lectura pública:       ${readOk ? '✅' : '⚠️ '}`);
    console.log(`Upload autenticado:    ${uploadOk ? '✅' : '⚠️ '}\n`);

    if (bucketOk && readOk && uploadOk) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🎉 ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE!');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('✅ El módulo de carga de archivos está listo para usar\n');
      console.log('📝 Siguiente paso:');
      console.log('   npx expo start --clear\n');
    } else {
      console.log('═══════════════════════════════════════════════════════');
      console.log('⚠️  CONFIGURACIÓN INCOMPLETA');
      console.log('═══════════════════════════════════════════════════════\n');

      if (!bucketOk) {
        console.log('❌ El bucket debe ser público');
        console.log('   Ve a: Storage → Buckets → request-files → Settings');
        console.log('   Activa: "Public bucket"\n');
      }

      if (!readOk) {
        console.log('❌ Falta política de lectura pública');
        console.log('   Ve a: Storage → Policies → New Policy');
        console.log('   Nombre: Public read access');
        console.log('   Operación: SELECT');
        console.log('   Target: public');
        console.log(`   USING: bucket_id = '${BUCKET_NAME}'\n`);
      }

      if (!uploadOk) {
        console.log('❌ Falta política de upload');
        console.log('   Ve a: Storage → Policies → New Policy');
        console.log('   Nombre: Authenticated users can upload');
        console.log('   Operación: INSERT');
        console.log('   Target: authenticated');
        console.log(`   WITH CHECK: bucket_id = '${BUCKET_NAME}'\n`);
      }

      console.log('📖 Para más detalles, consulta:');
      console.log('   CONFIGURACION_SUPABASE.md\n');
    }
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
verifyPolicies()
  .then(() => {
    console.log('✅ Verificación completada\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
