const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSchema() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔍 Verificando esquema de la tabla requests...\n');

  // Obtener una solicitud de ejemplo
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }

  console.log('Columnas disponibles en la tabla requests:');
  console.log('='.repeat(50));

  Object.keys(data)
    .sort()
    .forEach(key => {
      const value = data[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(
        '  ' + key + ' '.repeat(Math.max(1, 20 - key.length)) + '(' + type + ')'
      );
    });

  console.log('\n' + '='.repeat(50));
  console.log('Total de columnas: ' + Object.keys(data).length);
}

checkSchema()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
