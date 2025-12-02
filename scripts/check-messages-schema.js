const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSchema() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔍 Verificando esquema de la tabla messages...\n');

  // Obtener un mensaje de ejemplo
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('Error:', error.message);
    console.log('\n💡 La tabla messages podría estar vacía o no existir.');
    console.log('   Ejecuta primero: node scripts/test-chat-module.js');
    process.exit(1);
  }

  console.log('Columnas disponibles en la tabla messages:');
  console.log('='.repeat(50));

  Object.keys(data)
    .sort()
    .forEach(key => {
      const value = data[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(
        '  ' + key + ' '.repeat(Math.max(1, 25 - key.length)) + '(' + type + ')'
      );
    });

  console.log('\n' + '='.repeat(50));
  console.log('Total de columnas: ' + Object.keys(data).length);

  console.log('\n📋 Columnas esperadas pero no encontradas:');
  const expectedColumns = [
    'reply_to',
    'file_url',
    'file_name',
    'file_size',
    'audio_duration',
    'edited_at',
  ];
  const missingColumns = expectedColumns.filter(
    col => !Object.keys(data).includes(col)
  );

  if (missingColumns.length === 0) {
    console.log('   ✅ Todas las columnas esperadas están presentes');
  } else {
    missingColumns.forEach(col => console.log(`   ❌ ${col}`));
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
