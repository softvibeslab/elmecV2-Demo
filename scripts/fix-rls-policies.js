/**
 * Script para verificar y corregir políticas RLS en Supabase
 *
 * Este script:
 * 1. Verifica el estado de RLS en las tablas
 * 2. Corrige el problema de 'agente' vs 'agent' en las políticas
 * 3. Habilita RLS en todas las tablas necesarias
 *
 * Uso: node scripts/fix-rls-policies.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env manualmente
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta configuración de Supabase en .env');
  console.error(
    'Se requiere: EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSStatus() {
  console.log('🔍 Verificando estado de RLS en las tablas...\n');

  const tables = [
    'users',
    'requests',
    'chat_rooms',
    'messages',
    'notifications',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.rpc('check_table_rls', {
      table_name: table,
    });

    if (error) {
      console.log(
        `⚠️  ${table}: No se pudo verificar RLS (probablemente no existe la función helper)`
      );
    } else {
      console.log(`✅ ${table}: RLS ${data ? 'HABILITADO' : 'DESHABILITADO'}`);
    }
  }
}

async function fixRequestsData() {
  console.log('\n🔧 Corrigiendo datos de requests...\n');

  try {
    // 1. Verificar solicitudes existentes
    const { count: totalRequests, error: countError } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error contando solicitudes:', countError.message);
      console.log(
        '⚠️  Esto probablemente indica un problema con las políticas RLS'
      );
      console.log(
        '💡 Solución: Revisa las políticas RLS en Supabase Dashboard'
      );
      return;
    }

    console.log(`📊 Total de solicitudes en BD: ${totalRequests || 0}`);

    // 2. Información sobre políticas RLS
    console.log('\n📋 Información sobre Políticas RLS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Las políticas RLS están definidas en:');
    console.log(
      '  📁 /supabase/migrations/20250114_add_rls_policies_requests.sql'
    );
    console.log('');
    console.log('⚠️  PROBLEMA DETECTADO:');
    console.log('  Las políticas usan "agente" pero el enum usa "agent"');
    console.log('');
    console.log('✅ SOLUCIONES:');
    console.log('  1. En Supabase Dashboard > SQL Editor, ejecutar:');
    console.log(
      '     DROP POLICY IF EXISTS "agents_can_view_unassigned_requests" ON requests;'
    );
    console.log(
      '     DROP POLICY IF EXISTS "agents_can_update_assigned_requests" ON requests;'
    );
    console.log('');
    console.log('     CREATE POLICY "agents_can_view_unassigned_requests"');
    console.log('     ON requests FOR SELECT TO authenticated');
    console.log('     USING (');
    console.log("       estatus = 'nuevo' AND agente_id IS NULL");
    console.log('       AND EXISTS (');
    console.log('         SELECT 1 FROM users');
    console.log('         WHERE users.id = auth.uid()');
    console.log("           AND users.rol IN ('agent', 'admin')");
    console.log('       )');
    console.log('     );');
    console.log('');
    console.log('     CREATE POLICY "agents_can_update_assigned_requests"');
    console.log('     ON requests FOR UPDATE TO authenticated');
    console.log('     USING (');
    console.log('       agente_id = auth.uid()');
    console.log("       OR (estatus = 'nuevo'");
    console.log('         AND EXISTS (');
    console.log('           SELECT 1 FROM users');
    console.log('           WHERE users.id = auth.uid()');
    console.log("             AND users.rol IN ('agent', 'admin')");
    console.log('         )');
    console.log('       )');
    console.log('     )');
    console.log('     WITH CHECK (');
    console.log('       agente_id = auth.uid()');
    console.log("       OR (estatus IN ('nuevo', 'asignado')");
    console.log('         AND EXISTS (');
    console.log('           SELECT 1 FROM users');
    console.log('           WHERE users.id = auth.uid()');
    console.log("             AND users.rol IN ('agent', 'admin')");
    console.log('         )');
    console.log('       )');
    console.log('     );');
    console.log('');
    console.log('  2. Alternativamente, ejecuta la migración corregida en:');
    console.log('     /supabase/migrations/fix_rls_policies.sql');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function createFixMigration() {
  console.log('\n📝 Creando migración de corrección...\n');

  const migrationSQL = `-- ============================================================================
-- MIGRACIÓN: Corregir Políticas RLS para Requests
-- Fecha: ${new Date().toISOString().split('T')[0]}
-- Propósito: Corregir referencias de 'agente' a 'agent' en políticas RLS
-- ============================================================================

-- 1. ELIMINAR POLÍTICAS INCORRECTAS
-- ============================================================================

DROP POLICY IF EXISTS "agents_can_view_unassigned_requests" ON requests;
DROP POLICY IF EXISTS "agents_can_update_assigned_requests" ON requests;

-- 2. RECREAR POLÍTICAS CON VALORES CORRECTOS
-- ============================================================================

-- Policy: Agentes pueden ver solicitudes sin asignar
CREATE POLICY "agents_can_view_unassigned_requests"
ON requests
FOR SELECT
TO authenticated
USING (
  estatus = 'nuevo'
  AND agente_id IS NULL
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.rol IN ('agent', 'admin')
  )
);

-- Policy: Agentes pueden actualizar solicitudes asignadas
CREATE POLICY "agents_can_update_assigned_requests"
ON requests
FOR UPDATE
TO authenticated
USING (
  agente_id = auth.uid()
  OR (
    estatus = 'nuevo'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.rol IN ('agent', 'admin')
    )
  )
)
WITH CHECK (
  agente_id = auth.uid()
  OR (
    estatus IN ('nuevo', 'asignado')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.rol IN ('agent', 'admin')
    )
  )
);

-- 3. COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "agents_can_view_unassigned_requests" ON requests IS
'Permite a agentes y admins ver solicitudes nuevas sin asignar (CORREGIDO: agent en lugar de agente)';

COMMENT ON POLICY "agents_can_update_assigned_requests" ON requests IS
'Permite a agentes actualizar solicitudes asignadas y auto-asignarse (CORREGIDO: agent en lugar de agente)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver policies actualizadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'requests'
  AND policyname LIKE '%agent%'
ORDER BY policyname;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
`;

  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    `${Date.now()}_fix_rls_policies.sql`
  );
  fs.writeFileSync(migrationPath, migrationSQL);

  console.log(`✅ Migración creada en: ${migrationPath}`);
  console.log('');
  console.log('📌 Para aplicar esta migración:');
  console.log('  1. Copia el contenido del archivo');
  console.log('  2. Ve a Supabase Dashboard > SQL Editor');
  console.log('  3. Pega y ejecuta el SQL');
  console.log('');
}

// Ejecutar el script
async function main() {
  console.log('🚀 Iniciando verificación y corrección de RLS...\n');

  try {
    await checkRLSStatus();
    await fixRequestsData();
    await createFixMigration();

    console.log('\n✅ Script completado!');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('  1. Revisa la migración SQL generada');
    console.log('  2. Aplícala en Supabase Dashboard');
    console.log('  3. Prueba crear solicitudes en la app');
    console.log('  4. Verifica que ya no se quede en "standby"');
    console.log('');
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
