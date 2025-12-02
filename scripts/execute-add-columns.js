/**
 * Script para ejecutar la migración de agregar columnas faltantes
 * a la tabla requests en Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeMigration() {
  console.log('🚀 Iniciando migración de base de datos...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.log(
      '   Se requiere EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ============================================
    // 1. Agregar columna archivos
    // ============================================
    console.log('📝 Paso 1: Agregando columna "archivos"...');

    const { error: archivosError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS archivos TEXT[] DEFAULT NULL;
      `,
    });

    if (archivosError && !archivosError.message.includes('already exists')) {
      console.log(
        '⚠️  Método RPC no disponible, intentando método alternativo...'
      );
      // Si RPC no funciona, intentamos crear directamente (esto puede fallar)
    } else {
      console.log('✅ Columna "archivos" agregada');
    }

    // ============================================
    // 2. Agregar columnas feedback y rating
    // ============================================
    console.log('\n📝 Paso 2: Agregando columnas "feedback" y "rating"...');

    const { error: feedbackError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT NULL;
      `,
    });

    if (feedbackError && !feedbackError.message.includes('already exists')) {
      console.log(
        '⚠️  Método RPC no disponible, intentando método alternativo...'
      );
    } else {
      console.log('✅ Columnas "feedback" y "rating" agregadas');
    }

    // ============================================
    // 3. Verificar columnas agregadas
    // ============================================
    console.log('\n🔍 Paso 3: Verificando columnas agregadas...');

    const { data: testRequest, error: testError } = await supabase
      .from('requests')
      .select('*')
      .limit(1)
      .single();

    if (testError) {
      console.error('❌ Error al verificar:', testError.message);
      process.exit(1);
    }

    const columns = Object.keys(testRequest);
    const hasArchivos = columns.includes('archivos');
    const hasFeedback = columns.includes('feedback');
    const hasRating = columns.includes('rating');

    console.log('\nColumnas verificadas:');
    console.log(`  archivos: ${hasArchivos ? '✅' : '❌'}`);
    console.log(`  feedback: ${hasFeedback ? '✅' : '❌'}`);
    console.log(`  rating: ${hasRating ? '✅' : '❌'}`);

    if (!hasArchivos || !hasFeedback || !hasRating) {
      console.log(
        '\n⚠️  Algunas columnas no se pudieron agregar automáticamente.'
      );
      console.log(
        '\n📋 Por favor, ejecuta este SQL manualmente en Supabase Dashboard:'
      );
      console.log('\n' + '═'.repeat(70));
      console.log(
        fs.readFileSync(path.join(__dirname, 'add-missing-columns.sql'), 'utf8')
      );
      console.log('═'.repeat(70));
      console.log('\nPasos:');
      console.log('1. Ve a https://app.supabase.com');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a SQL Editor');
      console.log('4. Copia el SQL de arriba');
      console.log('5. Ejecuta');
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('═'.repeat(70));
    console.log('\n✅ Todas las columnas se agregaron correctamente');
    console.log('\n📝 Siguiente paso:');
    console.log('   node scripts/test-requests-crud.js');
    console.log('\nDeberías ver 14/14 tests pasando (100% de éxito)');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.log('\n📋 Ejecuta el SQL manualmente en Supabase Dashboard:');
    console.log('   scripts/add-missing-columns.sql');
    process.exit(1);
  }
}

// Ejecutar migración
executeMigration()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
