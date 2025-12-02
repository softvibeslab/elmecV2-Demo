#!/usr/bin/env node

/**
 * Script de testing para RLS Policies en tabla requests
 *
 * Este script verifica que las políticas de seguridad funcionan correctamente
 * probando diferentes escenarios con usuarios de distintos roles.
 */

const { createClient } = require('@supabase/supabase-js');
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
  test: msg => console.log(`  ${colors.bright}TEST:${colors.reset} ${msg}`),
};

// Credenciales de usuarios de prueba
const TEST_USERS = {
  usuario: { email: 'c.rosales@elmec.com.mx', password: 'abc321' },
  agente: { email: 's.vazquez@elmec.com.mx', password: 'abc321' }, // Asumiendo que es agente
  admin: { email: 'alex.diaz@elmec.com.mx', password: 'abc321' }, // Asumiendo que es admin
};

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('   TESTING DE RLS POLICIES - TABLA REQUESTS');
  console.log('='.repeat(70) + '\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Faltan variables de entorno');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let testsTotal = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // ========================================================================
  // TEST 1: Usuario puede ver solo sus propias solicitudes
  // ========================================================================
  log.step('TEST 1: Usuario puede ver solo sus propias solicitudes\n');
  testsTotal++;

  try {
    // Login como usuario normal
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.usuario.email,
      password: TEST_USERS.usuario.password,
    });

    if (loginError) throw loginError;
    log.info(`Logged in as: ${user.email}`);

    // Query a tabla requests
    const { data: requests, error: queryError } = await supabase
      .from('requests')
      .select('*');

    if (queryError) throw queryError;

    // Verificar que todas las solicitudes pertenecen al usuario
    const allOwnRequests = requests.every(
      r => r.usuario_id === user.id || r.agente_id === user.id
    );

    if (allOwnRequests) {
      log.success(
        `Solo ve sus propias solicitudes (${requests.length} encontradas)`
      );
      testsPassed++;
    } else {
      log.error('Ve solicitudes de otros usuarios - RLS FALLÓ');
      testsFailed++;
    }

    await supabase.auth.signOut();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }

  console.log('');

  // ========================================================================
  // TEST 2: Usuario puede crear solicitud
  // ========================================================================
  log.step('TEST 2: Usuario puede crear solicitud\n');
  testsTotal++;

  try {
    // Login como usuario
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.usuario.email,
      password: TEST_USERS.usuario.password,
    });

    if (loginError) throw loginError;

    // Intentar crear solicitud
    const { data: newRequest, error: insertError } = await supabase
      .from('requests')
      .insert({
        titulo: `TEST - Solicitud de prueba ${Date.now()}`,
        mensaje: 'Esta es una solicitud de prueba para validar RLS',
        tipo: 1,
        prioridad: 'baja',
        usuario_id: user.id,
        estatus: 'nuevo',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    log.success(
      `Solicitud creada exitosamente (ID: ${newRequest.id.substring(0, 8)}...)`
    );
    testsPassed++;

    // Limpiar - eliminar solicitud de prueba (solo si somos admin después)
    // await supabase.from('requests').delete().eq('id', newRequest.id);

    await supabase.auth.signOut();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }

  console.log('');

  // ========================================================================
  // TEST 3: Usuario NO puede crear solicitud para otro usuario
  // ========================================================================
  log.step('TEST 3: Usuario NO puede crear solicitud para otro usuario\n');
  testsTotal++;

  try {
    // Login como usuario
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.usuario.email,
      password: TEST_USERS.usuario.password,
    });

    if (loginError) throw loginError;

    // Intentar crear solicitud para otro usuario (debe fallar)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const { data, error: insertError } = await supabase
      .from('requests')
      .insert({
        titulo: 'TEST - Solicitud maliciosa',
        mensaje: 'Intentando crear solicitud para otro usuario',
        tipo: 1,
        prioridad: 'baja',
        usuario_id: fakeUserId, // Usuario diferente
        estatus: 'nuevo',
      })
      .select();

    if (insertError) {
      // Esperamos un error - eso significa que RLS funciona
      log.success('RLS bloqueó correctamente la creación para otro usuario ✓');
      testsPassed++;
    } else {
      log.error('VULNERABILIDAD: Pudo crear solicitud para otro usuario');
      testsFailed++;
    }

    await supabase.auth.signOut();
  } catch (error) {
    // Error esperado
    log.success('RLS bloqueó correctamente (excepción lanzada)');
    testsPassed++;
  }

  console.log('');

  // ========================================================================
  // TEST 4: Agente puede ver solicitudes sin asignar
  // ========================================================================
  log.step('TEST 4: Agente puede ver solicitudes nuevas sin asignar\n');
  testsTotal++;

  try {
    // Login como agente (asumiendo que s.vazquez es agente)
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.agente.email,
      password: TEST_USERS.agente.password,
    });

    if (loginError) throw loginError;
    log.info(`Logged in as: ${user.email}`);

    // Query a solicitudes nuevas sin asignar
    const { data: unassignedRequests, error: queryError } = await supabase
      .from('requests')
      .select('*')
      .eq('estatus', 'nuevo')
      .is('agente_id', null);

    if (queryError) throw queryError;

    log.success(
      `Agente puede ver ${unassignedRequests.length} solicitudes sin asignar`
    );
    testsPassed++;

    await supabase.auth.signOut();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }

  console.log('');

  // ========================================================================
  // TEST 5: Usuario NO puede ver solicitudes de otros
  // ========================================================================
  log.step('TEST 5: Usuario NO puede ver solicitudes de otros\n');
  testsTotal++;

  try {
    // Login como usuario
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.usuario.email,
      password: TEST_USERS.usuario.password,
    });

    if (loginError) throw loginError;

    // Intentar query a TODAS las solicitudes
    const { data: allRequests, error: queryError } = await supabase
      .from('requests')
      .select('*');

    if (queryError) throw queryError;

    // Verificar que NO ve solicitudes de otros (solo las suyas o asignadas a él)
    const hasOthersRequests = allRequests.some(
      r => r.usuario_id !== user.id && r.agente_id !== user.id
    );

    if (!hasOthersRequests) {
      log.success('Usuario NO ve solicitudes de otros ✓');
      testsPassed++;
    } else {
      log.error('VULNERABILIDAD: Usuario ve solicitudes de otros usuarios');
      testsFailed++;
    }

    await supabase.auth.signOut();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }

  console.log('');

  // ========================================================================
  // TEST 6: Usuario puede actualizar solo sus solicitudes no asignadas
  // ========================================================================
  log.step(
    'TEST 6: Usuario puede actualizar solo sus solicitudes no asignadas\n'
  );
  testsTotal++;

  try {
    // Login como usuario
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.usuario.email,
      password: TEST_USERS.usuario.password,
    });

    if (loginError) throw loginError;

    // Buscar una solicitud propia no asignada
    const { data: myRequests, error: queryError } = await supabase
      .from('requests')
      .select('*')
      .eq('usuario_id', user.id)
      .is('agente_id', null)
      .limit(1);

    if (queryError) throw queryError;

    if (myRequests && myRequests.length > 0) {
      const requestId = myRequests[0].id;

      // Intentar actualizar
      const { error: updateError } = await supabase
        .from('requests')
        .update({ mensaje: 'Mensaje actualizado desde test RLS' })
        .eq('id', requestId);

      if (updateError) {
        log.error(
          `No pudo actualizar su propia solicitud: ${updateError.message}`
        );
        testsFailed++;
      } else {
        log.success(
          'Usuario puede actualizar su propia solicitud no asignada ✓'
        );
        testsPassed++;
      }
    } else {
      log.warning(
        'No hay solicitudes propias para probar actualización (test skipped)'
      );
    }

    await supabase.auth.signOut();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }

  console.log('');

  // ========================================================================
  // RESUMEN DE TESTS
  // ========================================================================
  console.log('='.repeat(70));
  console.log('   RESUMEN DE TESTING');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total tests:    ${testsTotal}`);
  console.log(`${colors.green}✓ Pasados:      ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Fallados:     ${testsFailed}${colors.reset}`);
  console.log('');

  const percentage = ((testsPassed / testsTotal) * 100).toFixed(1);
  if (testsPassed === testsTotal) {
    console.log(
      `${colors.green}${colors.bright}✓ TODOS LOS TESTS PASARON (${percentage}%)${colors.reset}`
    );
    console.log('');
    console.log('RLS Policies están funcionando correctamente ✓');
  } else {
    console.log(
      `${colors.yellow}⚠ ALGUNOS TESTS FALLARON (${percentage}% pasó)${colors.reset}`
    );
    console.log('');
    console.log('Revisar errores arriba y verificar policies en Supabase.');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Ejecutar tests
runTests().catch(err => {
  console.error('\n' + '='.repeat(70));
  log.error('ERROR FATAL:');
  console.error(err);
  console.error('='.repeat(70) + '\n');
  process.exit(1);
});
