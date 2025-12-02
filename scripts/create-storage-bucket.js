/**
 * Script para crear el bucket de almacenamiento en Supabase
 *
 * Este script intenta crear el bucket 'request-files' automáticamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BUCKET_NAME = 'request-files';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function createStorageBucket() {
  console.log('🚀 Iniciando creación del bucket de almacenamiento...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas\n');

  // Usar service role key si está disponible (tiene más permisos)
  const apiKey = serviceRoleKey || supabaseKey;
  const supabase = createClient(supabaseUrl, apiKey);

  try {
    // Verificar si ya existe
    console.log('🔍 Verificando si el bucket ya existe...');
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error al verificar buckets:', listError.message);
      process.exit(1);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (bucketExists) {
      console.log(`✅ El bucket '${BUCKET_NAME}' ya existe\n`);
      console.log('✨ No es necesario crearlo de nuevo');
      process.exit(0);
    }

    // Crear el bucket
    console.log(`📦 Creando bucket '${BUCKET_NAME}'...`);

    const { data: bucket, error: createError } =
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
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
      console.error('❌ Error al crear bucket:', createError.message);
      console.log('\n⚠️  El bucket no se pudo crear automáticamente.');
      console.log(
        '   Esto puede deberse a que necesitas permisos de administrador.\n'
      );
      console.log('📋 Crea el bucket manualmente en el dashboard de Supabase:');
      console.log(
        `   ${supabaseUrl.replace('.supabase.co', '')}/project/default/storage/buckets\n`
      );
      console.log('Configuración del bucket:');
      console.log(`   • Name: ${BUCKET_NAME}`);
      console.log('   • Public: ✅ ACTIVADO');
      console.log('   • File size limit: 5242880 (5MB)');
      console.log('   • Allowed MIME types: image/*,application/pdf,text/*\n');
      process.exit(1);
    }

    console.log(`✅ Bucket '${BUCKET_NAME}' creado exitosamente!\n`);

    // Mostrar instrucciones para las políticas
    console.log(
      '📝 IMPORTANTE: Ahora debes configurar las políticas de seguridad\n'
    );
    console.log('Ve al dashboard de Supabase y configura estas políticas:\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('Política 1: Public read access');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. Ve a Storage → Policies');
    console.log('2. Haz clic en "New Policy" para storage.objects');
    console.log('3. Selecciona "SELECT" (lectura)');
    console.log('4. Pega este código SQL:\n');
    console.log(`CREATE POLICY "Public read access" ON storage.objects`);
    console.log(`FOR SELECT`);
    console.log(`TO public`);
    console.log(`USING (bucket_id = '${BUCKET_NAME}');\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('Política 2: Authenticated upload');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. Haz clic en "New Policy" nuevamente');
    console.log('2. Selecciona "INSERT" (subir)');
    console.log('3. Pega este código SQL:\n');
    console.log(
      `CREATE POLICY "Authenticated users can upload" ON storage.objects`
    );
    console.log(`FOR INSERT`);
    console.log(`TO authenticated`);
    console.log(`WITH CHECK (bucket_id = '${BUCKET_NAME}');\n`);

    console.log('═══════════════════════════════════════════════════════\n');
    console.log(
      '✨ Después de configurar las políticas, tu bucket estará listo!'
    );
    console.log(
      '   Ejecuta: node scripts/check-storage-bucket.js para verificar\n'
    );
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
createStorageBucket()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
