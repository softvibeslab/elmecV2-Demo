const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Variables de entorno:');
  console.log('✅ SUPABASE_URL:', supabaseUrl ? 'Configurada' : '❌ Faltante');
  console.log('✅ ANON_KEY:', supabaseKey ? 'Configurada' : '❌ Faltante');
  console.log(
    '✅ SERVICE_ROLE_KEY:',
    serviceRoleKey ? 'Configurada' : '❌ Faltante'
  );
  console.log('');

  // Probar con service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

  try {
    // Test 1: Listar buckets
    console.log('Test 1: Listando buckets...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('❌ Error:', bucketsError.message);
      console.log('   Código:', bucketsError.code || 'N/A');
      console.log('   Detalles:', bucketsError.details || 'N/A');
    } else {
      console.log('✅ Conexión exitosa!');
      console.log('   Buckets encontrados:', buckets.length);
      if (buckets.length > 0) {
        buckets.forEach(b => {
          const isPublic = b.public ? 'público' : 'privado';
          console.log('   - ' + b.name + ' (' + isPublic + ')');
        });
      } else {
        console.log('   ⚠️  No hay buckets en este proyecto');
      }
    }

    // Test 2: Probar query a la base de datos
    console.log('\nTest 2: Probando conexión a base de datos...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.log('❌ Error:', usersError.message);
    } else {
      console.log('✅ Base de datos accesible');
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
