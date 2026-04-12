/**
 * Script de Pruebas CRUD Completo para el Módulo de Solicitudes
 *
 * Este script prueba todas las operaciones del módulo de requests:
 * - CREATE: Crear solicitudes con/sin archivos adjuntos
 * - READ: Listar y obtener solicitudes con relaciones
 * - UPDATE: Actualizar estado, agregar comentarios, asignar agentes
 * - DELETE: Eliminar solicitudes (soft/hard delete)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Crear cliente de Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

// Resultados de las pruebas
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log('green', '✅', `${name} - PASSED ${message}`);
  } else {
    testResults.failed++;
    log('red', '❌', `${name} - FAILED ${message}`);
  }
  testResults.tests.push({ name, passed, message });
}

// Variables para almacenar IDs de prueba
let testUserId = null;
let testAgentId = null;
let testRequestId1 = null;
let testRequestId2 = null;
const testRequestId3 = null;

async function runTests() {
  console.log('\n' + '═'.repeat(60));
  log('cyan', '🧪', 'INICIANDO PRUEBAS CRUD DEL MÓDULO DE SOLICITUDES');
  console.log('═'.repeat(60) + '\n');

  try {
    // ============================================
    // PREPARACIÓN: Obtener usuarios de prueba
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔧', 'PREPARACIÓN: Obteniendo usuarios de prueba');
    console.log('─'.repeat(60));

    // Obtener un usuario customer
    const { data: customers, error: customerError } = await supabase
      .from('users')
      .select('id, nombre, apellido_paterno, rol')
      .eq('rol', 'customer')
      .eq('activo', true)
      .limit(1);

    if (customerError || !customers || customers.length === 0) {
      log('red', '❌', 'No se encontró usuario customer para pruebas');
      recordTest(
        'SETUP - Usuario customer',
        false,
        'No hay usuarios customer activos'
      );
      return;
    }

    testUserId = customers[0].id;
    log(
      'green',
      '✅',
      `Usuario customer encontrado: ${customers[0].nombre} ${customers[0].apellido_paterno}`
    );
    recordTest('SETUP - Usuario customer', true, `(${testUserId})`);

    // Obtener un agente
    const { data: agents, error: agentError } = await supabase
      .from('users')
      .select('id, nombre, apellido_paterno, rol')
      .eq('rol', 'agent')
      .eq('activo', true)
      .limit(1);

    if (agentError || !agents || agents.length === 0) {
      log('yellow', '⚠️', 'No se encontró agente para pruebas (opcional)');
      recordTest('SETUP - Usuario agente', false, 'No hay agentes activos');
    } else {
      testAgentId = agents[0].id;
      log(
        'green',
        '✅',
        `Agente encontrado: ${agents[0].nombre} ${agents[0].apellido_paterno}`
      );
      recordTest('SETUP - Usuario agente', true, `(${testAgentId})`);
    }

    // ============================================
    // TEST 1: CREATE - Solicitud simple sin archivos
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📝', 'TEST 1: CREATE - Solicitud simple sin archivos');
    console.log('─'.repeat(60));

    const request1Data = {
      titulo: 'Solicitud de prueba CRUD - Sin archivos',
      mensaje:
        'Esta es una solicitud de prueba automatizada sin archivos adjuntos',
      tipo: 1, // Ventas
      prioridad: 'media',
      estatus: 'nuevo',
      usuario_id: testUserId,
      agente_id: testAgentId,
      tags: ['test', 'automated'],
      metadata: {
        test: true,
        created_by: 'test-script',
        timestamp: new Date().toISOString(),
      },
    };

    const { data: request1, error: request1Error } = await supabase
      .from('requests')
      .insert(request1Data)
      .select(
        `
        *,
        usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno),
        agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno)
      `
      )
      .single();

    if (request1Error) {
      recordTest(
        'CREATE - Solicitud sin archivos',
        false,
        request1Error.message
      );
    } else {
      testRequestId1 = request1.id;
      recordTest(
        'CREATE - Solicitud sin archivos',
        true,
        `(ID: ${request1.id})`
      );
      console.log(`   Título: ${request1.titulo}`);
      console.log(`   Estado: ${request1.estatus}`);
      console.log(`   Prioridad: ${request1.prioridad}`);
    }

    // ============================================
    // TEST 2: CREATE - Solicitud con archivos simulados
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📝', 'TEST 2: CREATE - Solicitud con archivos simulados');
    console.log('─'.repeat(60));

    // Crear archivos de prueba en storage
    const testFiles = [];
    const testBlob = new Blob(['Contenido de prueba para solicitud'], {
      type: 'text/plain',
    });
    const testFileName = `test-crud/request-file-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('request-files')
      .upload(testFileName, testBlob, {
        contentType: 'text/plain',
        upsert: false,
      });

    let fileUrl = null;
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('request-files')
        .getPublicUrl(uploadData.path);

      fileUrl = urlData.publicUrl;
      testFiles.push(fileUrl);
    }

    const request2Data = {
      titulo: 'Solicitud de prueba CRUD - Con archivos',
      mensaje:
        'Esta es una solicitud de prueba automatizada con archivos adjuntos',
      tipo: 2, // Soporte
      prioridad: 'alta',
      estatus: 'nuevo',
      usuario_id: testUserId,
      agente_id: testAgentId,
      archivos: testFiles,
      tags: ['test', 'automated', 'with-files'],
      metadata: {
        test: true,
        created_by: 'test-script',
        timestamp: new Date().toISOString(),
        files: [
          {
            name: 'test-file.txt',
            url: fileUrl,
            type: 'text/plain',
            size: testBlob.size,
          },
        ],
      },
    };

    const { data: request2, error: request2Error } = await supabase
      .from('requests')
      .insert(request2Data)
      .select(
        `
        *,
        usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno),
        agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno)
      `
      )
      .single();

    if (request2Error) {
      recordTest(
        'CREATE - Solicitud con archivos',
        false,
        request2Error.message
      );
    } else {
      testRequestId2 = request2.id;
      recordTest(
        'CREATE - Solicitud con archivos',
        true,
        `(ID: ${request2.id})`
      );
      console.log(`   Título: ${request2.titulo}`);
      console.log(`   Archivos: ${request2.archivos?.length || 0}`);
      if (request2.archivos?.length > 0) {
        recordTest(
          'CREATE - Verificar archivos adjuntos',
          true,
          `(${request2.archivos.length} archivos)`
        );
      }
    }

    // ============================================
    // TEST 3: READ - Listar solicitudes
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 3: READ - Listar solicitudes');
    console.log('─'.repeat(60));

    const { data: requests, error: listError } = await supabase
      .from('requests')
      .select(
        `
        *,
        usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno),
        agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno)
      `
      )
      .eq('usuario_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (listError) {
      recordTest('READ - Listar solicitudes', false, listError.message);
    } else {
      recordTest(
        'READ - Listar solicitudes',
        true,
        `(${requests.length} solicitudes encontradas)`
      );
      console.log(`   Total de solicitudes del usuario: ${requests.length}`);

      // Verificar que nuestras solicitudes de prueba estén en la lista
      const testRequests = requests.filter(
        r => r.id === testRequestId1 || r.id === testRequestId2
      );

      if (testRequests.length === 2) {
        recordTest(
          'READ - Verificar solicitudes de prueba',
          true,
          '(2 solicitudes encontradas)'
        );
      } else {
        recordTest(
          'READ - Verificar solicitudes de prueba',
          false,
          `(Solo ${testRequests.length} encontradas)`
        );
      }
    }

    // ============================================
    // TEST 4: READ - Obtener solicitud específica
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 4: READ - Obtener solicitud específica');
    console.log('─'.repeat(60));

    if (testRequestId1) {
      const { data: singleRequest, error: getError } = await supabase
        .from('requests')
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(id, nombre, apellido_paterno, apellido_materno, empresa),
          agente:users!requests_agente_id_fkey(id, nombre, apellido_paterno, apellido_materno, categoria)
        `
        )
        .eq('id', testRequestId1)
        .single();

      if (getError) {
        recordTest(
          'READ - Obtener solicitud específica',
          false,
          getError.message
        );
      } else {
        recordTest(
          'READ - Obtener solicitud específica',
          true,
          `(ID: ${singleRequest.id})`
        );
        console.log(`   Título: ${singleRequest.titulo}`);
        console.log(
          `   Usuario: ${singleRequest.usuario?.nombre} ${singleRequest.usuario?.apellido_paterno}`
        );
        if (singleRequest.agente) {
          console.log(
            `   Agente: ${singleRequest.agente.nombre} ${singleRequest.agente.apellido_paterno}`
          );
        }
      }
    } else {
      recordTest(
        'READ - Obtener solicitud específica',
        false,
        'No hay solicitud de prueba'
      );
    }

    // ============================================
    // TEST 5: UPDATE - Cambiar estado
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔄', 'TEST 5: UPDATE - Cambiar estado de solicitud');
    console.log('─'.repeat(60));

    if (testRequestId1) {
      const { data: updatedStatus, error: statusError } = await supabase
        .from('requests')
        .update({
          estatus: 'asignado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testRequestId1)
        .select()
        .single();

      if (statusError) {
        recordTest('UPDATE - Cambiar estado', false, statusError.message);
      } else {
        const correctStatus = updatedStatus.estatus === 'asignado';
        recordTest(
          'UPDATE - Cambiar estado',
          correctStatus,
          correctStatus
            ? `(${updatedStatus.estatus})`
            : `(esperado: asignado, obtenido: ${updatedStatus.estatus})`
        );
      }
    } else {
      recordTest(
        'UPDATE - Cambiar estado',
        false,
        'No hay solicitud de prueba'
      );
    }

    // ============================================
    // TEST 6: UPDATE - Cambiar prioridad
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔄', 'TEST 6: UPDATE - Cambiar prioridad');
    console.log('─'.repeat(60));

    if (testRequestId2) {
      const { data: updatedPriority, error: priorityError } = await supabase
        .from('requests')
        .update({
          prioridad: 'urgente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testRequestId2)
        .select()
        .single();

      if (priorityError) {
        recordTest('UPDATE - Cambiar prioridad', false, priorityError.message);
      } else {
        const correctPriority = updatedPriority.prioridad === 'urgente';
        recordTest(
          'UPDATE - Cambiar prioridad',
          correctPriority,
          correctPriority
            ? `(${updatedPriority.prioridad})`
            : `(esperado: urgente, obtenido: ${updatedPriority.prioridad})`
        );
      }
    } else {
      recordTest(
        'UPDATE - Cambiar prioridad',
        false,
        'No hay solicitud de prueba'
      );
    }

    // ============================================
    // TEST 7: UPDATE - Agregar feedback
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔄', 'TEST 7: UPDATE - Agregar feedback y rating');
    console.log('─'.repeat(60));

    if (testRequestId1) {
      const { data: updatedFeedback, error: feedbackError } = await supabase
        .from('requests')
        .update({
          estatus: 'resuelto',
          feedback: 'Excelente servicio, problema resuelto rápidamente',
          rating: 5,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testRequestId1)
        .select()
        .single();

      if (feedbackError) {
        recordTest('UPDATE - Agregar feedback', false, feedbackError.message);
      } else {
        const hasFeedback =
          updatedFeedback.feedback && updatedFeedback.rating === 5;
        recordTest(
          'UPDATE - Agregar feedback',
          hasFeedback,
          hasFeedback
            ? `(rating: ${updatedFeedback.rating}/5)`
            : '(feedback no guardado)'
        );
      }
    } else {
      recordTest(
        'UPDATE - Agregar feedback',
        false,
        'No hay solicitud de prueba'
      );
    }

    // ============================================
    // TEST 8: READ - Filtrar por estado
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 8: READ - Filtrar solicitudes por estado');
    console.log('─'.repeat(60));

    const { data: resolvedRequests, error: filterError } = await supabase
      .from('requests')
      .select('id, titulo, estatus')
      .eq('estatus', 'resuelto')
      .eq('usuario_id', testUserId);

    if (filterError) {
      recordTest('READ - Filtrar por estado', false, filterError.message);
    } else {
      recordTest(
        'READ - Filtrar por estado',
        true,
        `(${resolvedRequests.length} resueltas)`
      );
      const hasTestRequest = resolvedRequests.some(
        r => r.id === testRequestId1
      );
      if (hasTestRequest) {
        recordTest(
          'READ - Verificar solicitud resuelto',
          true,
          '(solicitud de prueba encontrada)'
        );
      }
    }

    // ============================================
    // TEST 9: READ - Filtrar por prioridad
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 9: READ - Filtrar solicitudes por prioridad');
    console.log('─'.repeat(60));

    const { data: urgentRequests, error: urgentError } = await supabase
      .from('requests')
      .select('id, titulo, prioridad')
      .eq('prioridad', 'urgente')
      .eq('usuario_id', testUserId);

    if (urgentError) {
      recordTest('READ - Filtrar por prioridad', false, urgentError.message);
    } else {
      recordTest(
        'READ - Filtrar por prioridad',
        true,
        `(${urgentRequests.length} urgentes)`
      );
    }

    // ============================================
    // TEST 10: DELETE - Eliminar solicitudes de prueba
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🗑️', 'TEST 10: DELETE - Eliminar solicitudes de prueba');
    console.log('─'.repeat(60));

    const requestsToDelete = [testRequestId1, testRequestId2].filter(Boolean);

    if (requestsToDelete.length > 0) {
      const { data: deletedRequests, error: deleteError } = await supabase
        .from('requests')
        .delete()
        .in('id', requestsToDelete)
        .select();

      if (deleteError) {
        recordTest('DELETE - Eliminar solicitudes', false, deleteError.message);
      } else {
        recordTest(
          'DELETE - Eliminar solicitudes',
          true,
          `(${deletedRequests.length} eliminadas)`
        );

        // Verificar que se eliminaron
        const { data: verifyDeleted, error: verifyError } = await supabase
          .from('requests')
          .select('id')
          .in('id', requestsToDelete);

        if (!verifyError) {
          const stillExist = verifyDeleted.length;
          recordTest(
            'DELETE - Verificar eliminación',
            stillExist === 0,
            stillExist === 0
              ? '(solicitudes eliminadas correctamente)'
              : `(${stillExist} aún existen)`
          );
        }
      }

      // Limpiar archivo de prueba en storage
      if (testFileName) {
        await supabase.storage.from('request-files').remove([testFileName]);
        log('green', '🧹', 'Archivo de prueba eliminado del storage');
      }
    } else {
      recordTest(
        'DELETE - Eliminar solicitudes',
        false,
        'No hay solicitudes para eliminar'
      );
    }
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    recordTest('ERROR GENERAL', false, error.message);
  }

  // ============================================
  // REPORTE FINAL
  // ============================================
  console.log('\n' + '═'.repeat(60));
  log('cyan', '📊', 'REPORTE FINAL DE PRUEBAS - MÓDULO DE SOLICITUDES');
  console.log('═'.repeat(60) + '\n');

  console.log(`Total de pruebas:      ${testResults.total}`);
  log('green', '✅', `Pruebas exitosas:     ${testResults.passed}`);
  log('red', '❌', `Pruebas fallidas:     ${testResults.failed}`);

  const successRate =
    testResults.total > 0
      ? ((testResults.passed / testResults.total) * 100).toFixed(1)
      : 0;

  console.log(`\nTasa de éxito:         ${successRate}%\n`);

  if (testResults.failed > 0) {
    console.log('Pruebas fallidas:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log('red', '  ❌', `${t.name} - ${t.message}`);
      });
    console.log('');
  }

  console.log('═'.repeat(60));

  if (testResults.failed === 0) {
    log('green', '🎉', '¡TODAS LAS PRUEBAS DEL MÓDULO DE SOLICITUDES PASARON!');
  } else {
    log('yellow', '⚠️', 'Algunas pruebas fallaron. Revisa la configuración.');
  }

  console.log('═'.repeat(60) + '\n');

  // Retornar código de salida
  return testResults.failed === 0 ? 0 : 1;
}

// Ejecutar pruebas
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
