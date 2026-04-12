/**
 * Script de Pruebas CRUD Completo para Supabase Storage
 *
 * Este script prueba todas las operaciones:
 * - CREATE: Subir archivos
 * - READ: Listar y obtener archivos
 * - UPDATE: Actualizar archivos existentes
 * - DELETE: Eliminar archivos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BUCKET_NAME = 'request-files';
const TEST_FOLDER = 'test-crud';

// Crear clientes de Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey || anonKey);
const publicClient = createClient(supabaseUrl, anonKey);

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

async function runTests() {
  console.log('\n' + '═'.repeat(60));
  log('cyan', '🧪', 'INICIANDO PRUEBAS CRUD DE STORAGE');
  console.log('═'.repeat(60) + '\n');

  let testFile1Path = null;
  let testFile2Path = null;
  let testFile3Path = null;

  try {
    // ============================================
    // TEST 1: CREATE - Subir archivo de texto
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📝', 'TEST 1: CREATE - Subir archivo de texto');
    console.log('─'.repeat(60));

    const textContent = 'Este es un archivo de prueba para CRUD operations';
    const textBlob = new Blob([textContent], { type: 'text/plain' });
    const fileName1 = `${TEST_FOLDER}/test-${Date.now()}.txt`;

    const { data: upload1, error: uploadError1 } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(fileName1, textBlob, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError1) {
      recordTest('CREATE - Upload texto', false, uploadError1.message);
    } else {
      testFile1Path = upload1.path;
      recordTest('CREATE - Upload texto', true, `(${upload1.path})`);
    }

    // ============================================
    // TEST 2: CREATE - Subir archivo JSON
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📝', 'TEST 2: CREATE - Subir archivo JSON');
    console.log('─'.repeat(60));

    const jsonContent = JSON.stringify(
      {
        test: true,
        timestamp: Date.now(),
        description: 'Test CRUD file',
      },
      null,
      2
    );
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    const fileName2 = `${TEST_FOLDER}/test-${Date.now()}.json`;

    const { data: upload2, error: uploadError2 } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(fileName2, jsonBlob, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError2) {
      recordTest('CREATE - Upload JSON', false, uploadError2.message);
    } else {
      testFile2Path = upload2.path;
      recordTest('CREATE - Upload JSON', true, `(${upload2.path})`);
    }

    // ============================================
    // TEST 3: CREATE - Subir archivo CSV
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📝', 'TEST 3: CREATE - Subir archivo CSV');
    console.log('─'.repeat(60));

    const csvContent = 'id,nombre,valor\n1,Test1,100\n2,Test2,200';
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const fileName3 = `${TEST_FOLDER}/test-${Date.now()}.csv`;

    const { data: upload3, error: uploadError3 } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(fileName3, csvBlob, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (uploadError3) {
      recordTest('CREATE - Upload CSV', false, uploadError3.message);
    } else {
      testFile3Path = upload3.path;
      recordTest('CREATE - Upload CSV', true, `(${upload3.path})`);
    }

    // ============================================
    // TEST 4: READ - Listar archivos en carpeta
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 4: READ - Listar archivos en carpeta');
    console.log('─'.repeat(60));

    const { data: files, error: listError } = await publicClient.storage
      .from(BUCKET_NAME)
      .list(TEST_FOLDER, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      recordTest('READ - Listar archivos', false, listError.message);
    } else {
      const fileCount = files.length;
      recordTest(
        'READ - Listar archivos',
        true,
        `(${fileCount} archivos encontrados)`
      );

      if (fileCount > 0) {
        console.log('   Archivos encontrados:');
        files.slice(0, 5).forEach(f => {
          console.log(`   - ${f.name} (${f.metadata?.size || 0} bytes)`);
        });
        if (fileCount > 5) {
          console.log(`   ... y ${fileCount - 5} más`);
        }
      }
    }

    // ============================================
    // TEST 5: READ - Obtener URL pública
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 5: READ - Obtener URL pública');
    console.log('─'.repeat(60));

    if (testFile1Path) {
      const { data: urlData } = publicClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testFile1Path);

      if (urlData && urlData.publicUrl) {
        recordTest('READ - URL pública', true, '');
        console.log(`   URL: ${urlData.publicUrl.substring(0, 80)}...`);
      } else {
        recordTest('READ - URL pública', false, 'No se pudo obtener URL');
      }
    } else {
      recordTest('READ - URL pública', false, 'No hay archivo para probar');
    }

    // ============================================
    // TEST 6: READ - Descargar archivo
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '📖', 'TEST 6: READ - Descargar archivo');
    console.log('─'.repeat(60));

    if (testFile1Path) {
      const { data: downloadData, error: downloadError } =
        await publicClient.storage.from(BUCKET_NAME).download(testFile1Path);

      if (downloadError) {
        recordTest('READ - Descargar archivo', false, downloadError.message);
      } else {
        const text = await downloadData.text();
        const matches = text === textContent;
        recordTest(
          'READ - Descargar archivo',
          matches,
          matches ? '(contenido verificado)' : '(contenido no coincide)'
        );
      }
    } else {
      recordTest(
        'READ - Descargar archivo',
        false,
        'No hay archivo para probar'
      );
    }

    // ============================================
    // TEST 7: UPDATE - Actualizar archivo (upsert)
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔄', 'TEST 7: UPDATE - Actualizar archivo existente');
    console.log('─'.repeat(60));

    if (testFile1Path) {
      const updatedContent =
        'CONTENIDO ACTUALIZADO - ' + new Date().toISOString();
      const updatedBlob = new Blob([updatedContent], { type: 'text/plain' });

      const { data: updateData, error: updateError } = await adminClient.storage
        .from(BUCKET_NAME)
        .update(testFile1Path, updatedBlob, {
          contentType: 'text/plain',
          upsert: true,
        });

      if (updateError) {
        recordTest('UPDATE - Actualizar archivo', false, updateError.message);
      } else {
        recordTest('UPDATE - Actualizar archivo', true, '');

        // Verificar que se actualizó
        const { data: verifyData, error: verifyError } =
          await publicClient.storage.from(BUCKET_NAME).download(testFile1Path);

        if (!verifyError) {
          const newText = await verifyData.text();
          const updated = newText === updatedContent;
          recordTest(
            'UPDATE - Verificar actualización',
            updated,
            updated
              ? '(contenido actualizado correctamente)'
              : '(contenido no cambió)'
          );
        }
      }
    } else {
      recordTest(
        'UPDATE - Actualizar archivo',
        false,
        'No hay archivo para probar'
      );
    }

    // ============================================
    // TEST 8: UPDATE - Mover/Renombrar archivo
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🔄', 'TEST 8: UPDATE - Mover/Renombrar archivo');
    console.log('─'.repeat(60));

    if (testFile2Path) {
      const newPath = `${TEST_FOLDER}/renamed-${Date.now()}.json`;

      const { data: moveData, error: moveError } = await adminClient.storage
        .from(BUCKET_NAME)
        .move(testFile2Path, newPath);

      if (moveError) {
        recordTest('UPDATE - Mover archivo', false, moveError.message);
      } else {
        recordTest(
          'UPDATE - Mover archivo',
          true,
          `(${testFile2Path} → ${newPath})`
        );
        testFile2Path = newPath; // Actualizar referencia
      }
    } else {
      recordTest('UPDATE - Mover archivo', false, 'No hay archivo para probar');
    }

    // ============================================
    // TEST 9: DELETE - Eliminar archivo individual
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🗑️ ', 'TEST 9: DELETE - Eliminar archivo individual');
    console.log('─'.repeat(60));

    if (testFile1Path) {
      const { data: deleteData, error: deleteError } = await adminClient.storage
        .from(BUCKET_NAME)
        .remove([testFile1Path]);

      if (deleteError) {
        recordTest('DELETE - Eliminar archivo', false, deleteError.message);
      } else {
        recordTest('DELETE - Eliminar archivo', true, `(${testFile1Path})`);

        // Verificar que se eliminó
        const { data: checkData, error: checkError } =
          await publicClient.storage.from(BUCKET_NAME).download(testFile1Path);

        const isDeleted = checkError !== null;
        recordTest(
          'DELETE - Verificar eliminación',
          isDeleted,
          isDeleted ? '(archivo ya no existe)' : '(archivo aún existe)'
        );

        testFile1Path = null; // Marcar como eliminado
      }
    } else {
      recordTest(
        'DELETE - Eliminar archivo',
        false,
        'No hay archivo para probar'
      );
    }

    // ============================================
    // TEST 10: DELETE - Eliminar múltiples archivos
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🗑️ ', 'TEST 10: DELETE - Eliminar múltiples archivos');
    console.log('─'.repeat(60));

    const filesToDelete = [testFile2Path, testFile3Path].filter(Boolean);

    if (filesToDelete.length > 0) {
      const { data: deleteMultiData, error: deleteMultiError } =
        await adminClient.storage.from(BUCKET_NAME).remove(filesToDelete);

      if (deleteMultiError) {
        recordTest(
          'DELETE - Eliminar múltiples',
          false,
          deleteMultiError.message
        );
      } else {
        recordTest(
          'DELETE - Eliminar múltiples',
          true,
          `(${filesToDelete.length} archivos)`
        );
      }
    } else {
      recordTest(
        'DELETE - Eliminar múltiples',
        false,
        'No hay archivos para probar'
      );
    }

    // ============================================
    // TEST 11: Limpiar carpeta de pruebas
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('blue', '🧹', 'TEST 11: Limpieza - Eliminar carpeta de pruebas');
    console.log('─'.repeat(60));

    const { data: remainingFiles, error: listRemainingError } =
      await adminClient.storage.from(BUCKET_NAME).list(TEST_FOLDER);

    if (!listRemainingError && remainingFiles && remainingFiles.length > 0) {
      const pathsToDelete = remainingFiles.map(f => `${TEST_FOLDER}/${f.name}`);

      const { data: cleanupData, error: cleanupError } =
        await adminClient.storage.from(BUCKET_NAME).remove(pathsToDelete);

      if (cleanupError) {
        recordTest('CLEANUP - Limpiar carpeta', false, cleanupError.message);
      } else {
        recordTest(
          'CLEANUP - Limpiar carpeta',
          true,
          `(${pathsToDelete.length} archivos eliminados)`
        );
      }
    } else {
      recordTest('CLEANUP - Limpiar carpeta', true, '(carpeta ya limpia)');
    }
  } catch (error) {
    console.error('\n❌ Error inesperado:', error.message);
    recordTest('ERROR GENERAL', false, error.message);
  }

  // ============================================
  // REPORTE FINAL
  // ============================================
  console.log('\n' + '═'.repeat(60));
  log('cyan', '📊', 'REPORTE FINAL DE PRUEBAS');
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
    log('green', '🎉', '¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  } else {
    log('yellow', '⚠️ ', 'Algunas pruebas fallaron. Revisa la configuración.');
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
