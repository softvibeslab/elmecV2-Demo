#!/usr/bin/env node

/**
 * Script para aplicar migración de RLS policies a tabla requests
 *
 * Este script lee el archivo SQL de migración y lo ejecuta en Supabase
 * usando el service_role_key para tener permisos completos.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: msg => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
};

async function applyMigration() {
  console.log('\n' + '='.repeat(70));
  console.log('   APLICAR MIGRACIÓN RLS - TABLA REQUESTS');
  console.log('='.repeat(70) + '\n');

  // 1. Verificar variables de entorno
  log.step('Verificando variables de entorno...');
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    log.error('Faltan variables de entorno:');
    if (!supabaseUrl) log.error('  - EXPO_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) log.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  log.success('Variables de entorno OK');

  // 2. Crear cliente Supabase con service_role
  log.step('Conectando a Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  log.success('Conexión establecida');

  // 3. Leer archivo de migración
  log.step('Leyendo archivo de migración...');
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20250114_add_rls_policies_requests.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    log.error(`No se encontró el archivo: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  log.success(`Archivo leído: ${migrationSQL.length} caracteres`);

  // 4. Extraer statements ejecutables (remover comentarios y sección de testing)
  log.step('Procesando SQL...');
  const statements = migrationSQL
    .split('\n')
    .filter(line => {
      // Remover líneas vacías y comentarios
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('--');
    })
    .join('\n')
    // Remover bloques de comentarios /* */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  // Dividir en statements individuales (por punto y coma)
  const sqlStatements = statements
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  log.success(`${sqlStatements.length} statements SQL procesados`);

  // 5. Ejecutar cada statement
  log.step('Ejecutando migración...\n');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    process.stdout.write(`  [${i + 1}/${sqlStatements.length}] ${preview}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Si el error es porque la policy ya existe, lo tratamos como warning
        if (error.message && error.message.includes('already exists')) {
          console.log(` ${colors.yellow}⚠ Ya existe${colors.reset}`);
        } else {
          throw error;
        }
      } else {
        console.log(` ${colors.green}✓${colors.reset}`);
        successCount++;
      }
    } catch (err) {
      console.log(` ${colors.red}✗${colors.reset}`);
      log.error(`   Error: ${err.message}`);
      errorCount++;

      // Si es un error crítico, detener
      if (
        err.message.includes('does not exist') ||
        err.message.includes('syntax error')
      ) {
        log.error('\n   Error crítico detectado. Deteniendo migración.');
        break;
      }
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(
    `Exitosos: ${colors.green}${successCount}${colors.reset} | Errores: ${colors.red}${errorCount}${colors.reset}`
  );
  console.log('='.repeat(70) + '\n');

  // 6. Verificar que RLS está habilitado
  log.step('Verificando RLS habilitado...');
  const { data: rlsCheck, error: rlsError } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'requests')
    .single();

  if (rlsError) {
    log.warning('No se pudo verificar RLS (puede ser restricción de permisos)');
  } else if (rlsCheck?.rowsecurity) {
    log.success('RLS está HABILITADO en tabla requests ✓');
  } else {
    log.error('RLS NO está habilitado en tabla requests');
  }

  // 7. Listar policies creadas
  log.step('Verificando policies creadas...');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('policyname, cmd')
    .eq('schemaname', 'public')
    .eq('tablename', 'requests')
    .order('policyname');

  if (policiesError) {
    log.warning(
      'No se pudieron listar policies (puede ser restricción de permisos)'
    );
  } else if (policies && policies.length > 0) {
    log.success(`${policies.length} policies encontradas:`);
    policies.forEach(p => {
      console.log(`    - ${p.policyname} (${p.cmd})`);
    });
  } else {
    log.warning(
      'No se encontraron policies (puede ser restricción de permisos)'
    );
  }

  console.log('\n' + '='.repeat(70));
  if (errorCount === 0) {
    log.success('MIGRACIÓN COMPLETADA EXITOSAMENTE ✓');
    console.log('\n  Próximos pasos:');
    console.log('  1. Ejecutar testing: npm run test:rls');
    console.log('  2. Verificar en Supabase Dashboard');
    console.log('  3. Probar desde la app con diferentes roles\n');
  } else {
    log.warning('MIGRACIÓN COMPLETADA CON ERRORES');
    console.log(
      '\n  Revisar errores arriba y verificar manualmente en Supabase.\n'
    );
  }
  console.log('='.repeat(70) + '\n');
}

// Ejecutar
applyMigration().catch(err => {
  console.error('\n' + '='.repeat(70));
  log.error('ERROR FATAL:');
  console.error(err);
  console.error('='.repeat(70) + '\n');
  process.exit(1);
});
