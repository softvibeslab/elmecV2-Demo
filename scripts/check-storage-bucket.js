/**
 * Script para verificar el bucket de almacenamiento en Supabase
 *
 * Este script verifica si el bucket 'request-files' existe
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BUCKET_NAME = 'request-files';

async function checkStorageBucket() {
  console.log('🔍 Verificando configuración de Supabase Storage...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.log('   Verifica que .env contenga:');
    console.log('   - EXPO_PUBLIC_SUPABASE_URL');
    console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);

  // Crear cliente de Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Listar todos los buckets
    console.log('\n📦 Listando buckets disponibles...');
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error al listar buckets:', listError.message);
      console.log('\n⚠️  Esto puede significar:');
      console.log('   1. Problema de conexión con Supabase');
      console.log('   2. Las credenciales no son válidas');
      console.log('   3. El proyecto de Supabase no está activo');
      process.exit(1);
    }

    if (!buckets || buckets.length === 0) {
      console.log('⚠️  No hay buckets creados en este proyecto');
    } else {
      console.log(`✅ Se encontraron ${buckets.length} bucket(s):`);
      buckets.forEach(bucket => {
        console.log(
          `   - ${bucket.name} ${bucket.public ? '(público)' : '(privado)'}`
        );
      });
    }

    // Verificar si existe el bucket request-files
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    console.log(`\n🎯 Verificando bucket '${BUCKET_NAME}'...`);

    if (bucketExists) {
      console.log(`✅ El bucket '${BUCKET_NAME}' EXISTE`);

      // Intentar listar archivos para verificar acceso
      const { data: files, error: filesError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1 });

      if (filesError) {
        console.log('⚠️  Advertencia: No se pudo acceder al bucket');
        console.log(`   Error: ${filesError.message}`);
      } else {
        console.log('✅ El bucket es accesible');
      }

      console.log('\n✨ Todo está configurado correctamente!');
      console.log('\n📝 Siguiente paso:');
      console.log('   Ejecuta: npx expo start --clear');
    } else {
      console.log(`❌ El bucket '${BUCKET_NAME}' NO EXISTE`);
      console.log('\n📋 Para crear el bucket, sigue estos pasos:');
      console.log('\n1. Ve al dashboard de Supabase:');
      console.log(
        `   ${supabaseUrl.replace('.supabase.co', '')}/project/default/storage/buckets`
      );
      console.log('\n2. Haz clic en "New bucket"');
      console.log('\n3. Configura el bucket:');
      console.log(`   • Name: ${BUCKET_NAME}`);
      console.log('   • Public: ✅ ACTIVADO (importante)');
      console.log('   • File size limit: 5242880 (5MB)');
      console.log('   • Allowed MIME types: image/*,application/pdf,text/*');
      console.log('\n4. Configura las políticas de seguridad:');
      console.log('\n   Política 1: "Public read access"');
      console.log('   • Operación: SELECT');
      console.log('   • SQL:');
      console.log(`   CREATE POLICY "Public read access" ON storage.objects`);
      console.log(`   FOR SELECT TO public`);
      console.log(`   USING (bucket_id = '${BUCKET_NAME}');`);
      console.log('\n   Política 2: "Authenticated users can upload"');
      console.log('   • Operación: INSERT');
      console.log('   • SQL:');
      console.log(
        `   CREATE POLICY "Authenticated users can upload" ON storage.objects`
      );
      console.log(`   FOR INSERT TO authenticated`);
      console.log(`   WITH CHECK (bucket_id = '${BUCKET_NAME}');`);
      console.log(
        '\n5. Después de crear el bucket, ejecuta este script de nuevo:'
      );
      console.log('   node scripts/check-storage-bucket.js');
    }
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
checkStorageBucket()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
