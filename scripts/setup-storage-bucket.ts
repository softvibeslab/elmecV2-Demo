/**
 * Script para configurar el bucket de almacenamiento en Supabase
 *
 * Este script verifica si el bucket 'request-files' existe y lo crea si es necesario
 * con las políticas de seguridad apropiadas.
 *
 * Uso:
 * npx ts-node scripts/setup-storage-bucket.ts
 */

import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'request-files';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function setupStorageBucket() {
  console.log('🔍 Verificando bucket de almacenamiento...');

  try {
    // 1. Verificar si el bucket existe
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error al listar buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (bucketExists) {
      console.log(`✅ El bucket '${BUCKET_NAME}' ya existe`);
      return;
    }

    console.log(`📦 Creando bucket '${BUCKET_NAME}'...`);

    // 2. Crear el bucket
    const { data: bucket, error: createError } =
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Archivos son públicamente accesibles
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });

    if (createError) {
      console.error('❌ Error al crear bucket:', createError);
      console.log(
        '\n⚠️  Por favor, crea el bucket manualmente en el dashboard de Supabase:'
      );
      console.log(`   1. Ve a Storage en tu proyecto de Supabase`);
      console.log(`   2. Crea un nuevo bucket llamado "${BUCKET_NAME}"`);
      console.log(`   3. Marca como público`);
      console.log(
        `   4. Establece límite de tamaño a ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
      return;
    }

    console.log(`✅ Bucket '${BUCKET_NAME}' creado exitosamente`);

    // 3. Configurar políticas de seguridad
    console.log('🔐 Configurando políticas de seguridad...');
    console.log(
      '\n⚠️  Debes configurar las siguientes políticas en el dashboard de Supabase:'
    );
    console.log('\nPolítica 1: Permitir lectura pública');
    console.log('Tipo: SELECT');
    console.log('Target roles: public');
    console.log('Policy definition: true');

    console.log('\nPolítica 2: Permitir subida para usuarios autenticados');
    console.log('Tipo: INSERT');
    console.log('Target roles: authenticated');
    console.log('Policy definition: auth.uid() IS NOT NULL');

    console.log('\nPolítica 3: Permitir actualización para el dueño');
    console.log('Tipo: UPDATE');
    console.log('Target roles: authenticated');
    console.log('Policy definition: auth.uid() = owner');

    console.log('\nPolítica 4: Permitir eliminación para el dueño');
    console.log('Tipo: DELETE');
    console.log('Target roles: authenticated');
    console.log('Policy definition: auth.uid() = owner');

    console.log('\n✅ Configuración completada');
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  }
}

// Ejecutar el script
setupStorageBucket()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
