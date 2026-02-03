const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pdpqkgrqlubyzkcivifk.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwOTczOCwiZXhwIjoyMDc0Nzg1NzM4fQ.RoKKip2x8WQdQhmHenlOOilOmSgTat5ZxtSXvbkm7g8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStoragePolicies() {
  console.log('🔧 Configurando Storage RLS para bucket request-files...\n');

  // Test 1: Verificar bucket existe
  console.log('1. Verificando bucket...');
  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();

  if (bucketsError) {
    console.log('❌ Error listando buckets:', bucketsError.message);
    return;
  }

  const bucket = buckets.find(b => b.name === 'request-files');
  if (!bucket) {
    console.log('⚠️  Bucket request-files no existe. Creándolo...');
    const { error: createError } = await supabase.storage.createBucket(
      'request-files',
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      }
    );
    if (createError) {
      console.log('❌ Error creando bucket:', createError.message);
      return;
    }
    console.log('✅ Bucket creado exitosamente');
  } else {
    console.log(
      '✅ Bucket existe:',
      bucket.name,
      bucket.public ? '(público)' : '(privado)'
    );
  }

  // Test 2: Probar upload con service role
  console.log('\n2. Probando permisos de Storage...');
  const testContent = new Blob(['test'], { type: 'text/plain' });
  const testPath = `test/connection-test-${Date.now()}.txt`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('request-files')
    .upload(testPath, testContent, { upsert: true });

  if (uploadError) {
    console.log('❌ Error en upload:', uploadError.message);
    console.log(
      '   Esto puede indicar que RLS está bloqueando. Necesitas configurar políticas manualmente.'
    );
  } else {
    console.log('✅ Upload exitoso:', uploadData.path);

    // Limpiar archivo de prueba
    await supabase.storage.from('request-files').remove([testPath]);
    console.log('✅ Archivo de prueba eliminado');
  }

  // Test 3: Verificar URL pública
  console.log('\n3. Verificando acceso público...');
  const { data: urlData } = supabase.storage
    .from('request-files')
    .getPublicUrl('test.txt');
  console.log('   URL base:', urlData.publicUrl.replace('/test.txt', '/'));

  console.log('\n' + '='.repeat(60));
  console.log('📋 INSTRUCCIONES PARA CONFIGURAR RLS:');
  console.log('='.repeat(60));
  console.log(`
1. Ve a: https://supabase.com/dashboard/project/pdpqkgrqlubyzkcivifk/storage/policies

2. Selecciona el bucket "request-files"

3. Crea las siguientes políticas:

   POLÍTICA 1 - Lectura Pública:
   - Name: Public Read Access
   - Allowed operation: SELECT
   - Target roles: (dejar vacío para público)
   - USING expression: bucket_id = 'request-files'

   POLÍTICA 2 - Upload Autenticado:
   - Name: Authenticated Upload
   - Allowed operation: INSERT
   - Target roles: authenticated
   - WITH CHECK expression: bucket_id = 'request-files'

   POLÍTICA 3 - Update Propio:
   - Name: Owner Update
   - Allowed operation: UPDATE
   - Target roles: authenticated
   - USING expression: bucket_id = 'request-files'

   POLÍTICA 4 - Delete Propio:
   - Name: Owner Delete
   - Allowed operation: DELETE
   - Target roles: authenticated
   - USING expression: bucket_id = 'request-files'

4. Guarda cada política
`);
}

setupStoragePolicies()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
