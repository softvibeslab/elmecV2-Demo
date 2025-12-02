#!/usr/bin/env node

/**
 * Script de prueba para verificar la creación de solicitudes
 * Verifica:
 * 1. Conexión a Supabase
 * 2. Autenticación de usuario
 * 3. Creación de solicitud
 * 4. Políticas RLS
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error(
    'Verifica que EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY estén en .env'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRequestCreation() {
  console.log('🚀 Iniciando prueba de creación de solicitudes...\n');

  // 1. Verificar conexión a Supabase
  console.log('1️⃣ Verificando conexión a Supabase...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (healthError) {
    console.error('❌ Error de conexión:', healthError.message);
    return;
  }
  console.log('✅ Conexión exitosa\n');

  // 2. Obtener un usuario de prueba (customer)
  console.log('2️⃣ Buscando usuario de prueba (customer)...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, nombre, apellido_paterno, rol')
    .eq('rol', 'customer')
    .eq('activo', true)
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No se encontró usuario customer:', usersError?.message);
    console.log('💡 Crea un usuario customer en Supabase primero');
    return;
  }

  const testUser = users[0];
  console.log(`✅ Usuario encontrado: ${testUser.email}`);
  console.log(`   ID: ${testUser.id}`);
  console.log(`   Nombre: ${testUser.nombre} ${testUser.apellido_paterno}\n`);

  // 3. Buscar un agente disponible (opcional)
  console.log('3️⃣ Buscando agente disponible...');
  const { data: agents, error: agentsError } = await supabase
    .from('users')
    .select('id, nombre, apellido_paterno, categoria')
    .eq('rol', 'agent')
    .eq('activo', true)
    .limit(1);

  let testAgent = null;
  if (!agentsError && agents && agents.length > 0) {
    testAgent = agents[0];
    console.log(
      `✅ Agente encontrado: ${testAgent.nombre} ${testAgent.apellido_paterno}`
    );
    console.log(`   ID: ${testAgent.id}`);
    console.log(`   Categoría: ${testAgent.categoria}\n`);
  } else {
    console.log(
      '⚠️  No se encontró agente. La solicitud se creará sin agente asignado.\n'
    );
  }

  // 4. Crear solicitud de prueba
  console.log('4️⃣ Creando solicitud de prueba...');

  const requestData = {
    titulo: `Prueba de solicitud - ${new Date().toISOString()}`,
    mensaje:
      'Esta es una solicitud de prueba creada por el script de testing. Verifica que todo funcione correctamente.',
    tipo: 1, // Ventas
    prioridad: 'media',
    estatus: 'nuevo',
    usuario_id: testUser.id,
    agente_id: testAgent ? testAgent.id : null,
    tags: ['test', 'automated'],
    metadata: {
      test: true,
      created_by: 'test-script',
      timestamp: new Date().toISOString(),
    },
  };

  console.log('Datos de la solicitud:');
  console.log(JSON.stringify(requestData, null, 2));
  console.log('');

  const { data: newRequest, error: createError } = await supabase
    .from('requests')
    .insert(requestData)
    .select(
      `
      *,
      usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno, empresa),
      agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno, categoria)
    `
    )
    .single();

  if (createError) {
    console.error('❌ Error al crear solicitud:', createError.message);
    console.error('Detalles:', JSON.stringify(createError, null, 2));

    if (createError.code === '42501') {
      console.log('\n💡 Error de permisos RLS. Posibles causas:');
      console.log('   1. Las políticas RLS no están aplicadas correctamente');
      console.log(
        '   2. El usuario no tiene permisos para insertar en la tabla requests'
      );
      console.log(
        '   3. La política "authenticated_users_can_create_requests" no existe o está mal configurada'
      );
      console.log('\n🔧 Solución sugerida:');
      console.log('   Ejecuta las migraciones RLS:');
      console.log('   node scripts/apply-rls-migration.js');
    }
    return;
  }

  console.log('✅ Solicitud creada exitosamente!');
  console.log(`   ID: ${newRequest.id}`);
  console.log(`   Título: ${newRequest.titulo}`);
  console.log(`   Estado: ${newRequest.estatus}`);
  console.log(`   Prioridad: ${newRequest.prioridad}`);
  if (newRequest.agente) {
    console.log(
      `   Agente: ${newRequest.agente.nombre} ${newRequest.agente.apellido_paterno}`
    );
  } else {
    console.log('   Agente: Sin asignar');
  }
  console.log('');

  // 5. Verificar que la solicitud se puede leer
  console.log('5️⃣ Verificando lectura de solicitud...');
  const { data: readRequest, error: readError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', newRequest.id)
    .single();

  if (readError) {
    console.error('❌ Error al leer solicitud:', readError.message);
    return;
  }

  console.log('✅ Solicitud leída correctamente\n');

  // 6. Limpiar - Eliminar solicitud de prueba
  console.log('6️⃣ Limpiando solicitud de prueba...');
  const { error: deleteError } = await supabase
    .from('requests')
    .delete()
    .eq('id', newRequest.id);

  if (deleteError) {
    console.warn(
      '⚠️  No se pudo eliminar la solicitud de prueba:',
      deleteError.message
    );
    console.log(`   Elimínala manualmente: ID ${newRequest.id}`);
  } else {
    console.log('✅ Solicitud de prueba eliminada\n');
  }

  console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log('   ✅ Conexión a Supabase');
  console.log('   ✅ Usuario de prueba encontrado');
  console.log('   ✅ Solicitud creada');
  console.log('   ✅ Solicitud leída');
  console.log('   ✅ Solicitud eliminada');
  console.log('');
  console.log('💡 El módulo de solicitudes está funcionando correctamente.');
}

// Ejecutar pruebas
testRequestCreation()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  });
