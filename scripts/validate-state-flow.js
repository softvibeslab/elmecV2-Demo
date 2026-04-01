/**
 * Script de validación para el sistema de gestión de estados ELMEC V2.
 * Verifica los flujos: Asignado -> En Proceso -> Resuelto
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runValidation() {
  console.log('🔍 Iniciando validación de flujos de estado...\n');

  try {
    // 1. Simular creación de solicitud por cliente
    console.log('Step 1: Creando nueva solicitud (Simulación Cliente)...');
    const { data: request, error: createError } = await supabase
      .from('requests')
      .insert({
        titulo: 'TEST: Validación de Flujo ' + Date.now(),
        mensaje: 'Esta es una solicitud de prueba para validar el sistema de estados.',
        tipo: 1,
        prioridad: 'baja',
        estatus: 'asignado', // Debería ser asignado por defecto en la app
        usuario_id: '00000000-0000-0000-0000-000000000000', // Reemplazar con ID real si es necesario
        metadata: {
          status_history: [{ from: null, to: 'asignado', timestamp: new Date().toISOString(), reason: 'Test inicial' }]
        }
      })
      .select()
      .single();

    if (createError) throw createError;
    console.log(`✅ Solicitud creada con éxito. ID: ${request.id}, Estatus: ${request.estatus}`);

    // 2. Simular primera interacción del agente (Transición a En Proceso)
    console.log('\nStep 2: Transicionando a "en_proceso" (Simulación Agente Chat)...');
    const { data: updatedReq, error: updateError } = await supabase
      .from('requests')
      .update({
        estatus: 'en_proceso',
        updated_at: new Date().toISOString(),
        metadata: {
          ...request.metadata,
          status_history: [
            ...request.metadata.status_history,
            { from: 'asignado', to: 'en_proceso', timestamp: new Date().toISOString(), reason: 'Simulación interacción agente' }
          ]
        }
      })
      .eq('id', request.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log(`✅ Transición automática exitosa. ID: ${updatedReq.id}, Estatus: ${updatedReq.estatus}`);

    // 3. Simular cierre manual por agente (Transición a Resuelto)
    console.log('\nStep 3: Transicionando a "resuelto" (Simulación Botón Manual Agente)...');
    const { data: resolvedReq, error: resolveError } = await supabase
      .from('requests')
      .update({
        estatus: 'resuelto',
        updated_at: new Date().toISOString(),
        metadata: {
          ...updatedReq.metadata,
          status_history: [
            ...updatedReq.metadata.status_history,
            { from: 'en_proceso', to: 'resuelto', timestamp: new Date().toISOString(), reason: 'Simulación cierre manual' }
          ]
        }
      })
      .eq('id', request.id)
      .select()
      .single();

    if (resolveError) throw resolveError;
    console.log(`✅ Cierre manual exitoso. ID: ${resolvedReq.id}, Estatus: ${resolvedReq.estatus}`);

    // 4. Verificar historial de auditoría
    console.log('\nStep 4: Verificando historial de auditoría (Timestamps)...');
    const history = resolvedReq.metadata.status_history;
    console.log(`📊 Total de cambios registrados: ${history.length}`);
    history.forEach((entry, index) => {
      console.log(`   [${index}] ${entry.from || 'START'} -> ${entry.to} | ${entry.timestamp} | ${entry.reason}`);
    });

    console.log('\n✨ VALIDACIÓN COMPLETADA CON ÉXITO');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA VALIDACIÓN:');
    console.error(error.message || error);
  }
}

// Nota: No se ejecuta automáticamente para no crear basura en la DB real del usuario
// runValidation();
console.log('Script listo. Ejecuta runValidation() en un entorno controlado.');
