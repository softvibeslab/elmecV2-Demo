/**
 * Script para actualizar los cargos/posiciones del personal
 * en la tabla users de Supabase
 *
 * Fecha: 2026-01-20
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function updateEmployeePositions() {
  console.log('🚀 Actualizando cargos de personal...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.log('   Se requiere EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ============================================
    // 1. Actualizar agente Javier González como "Gerente de Ventas"
    // ============================================
    console.log('📝 Actualizando cargo de Javier González...');

    const { data: javierData, error: javierError } = await supabase
      .from('users')
      .update({ categoria: 'Gerente de Ventas' })
      .eq('email', 'j.gonzalez@elmec.com.mx')
      .eq('rol', 'agent')
      .select();

    if (javierError) {
      console.error('❌ Error actualizando Javier:', javierError.message);
    } else if (javierData && javierData.length > 0) {
      console.log('✅ Javier González actualizado a "Gerente de Ventas"');
    } else {
      console.log('⚠️  No se encontró al usuario Javier González');
    }

    // ============================================
    // 2. Actualizar admin Ivan Pineda como "Director General"
    // ============================================
    console.log('📝 Actualizando cargo de Ivan Pineda...');

    const { data: ivanData, error: ivanError } = await supabase
      .from('users')
      .update({ categoria: 'Director General' })
      .eq('email', 'i.pineda@elmec.com.mx')
      .eq('rol', 'admin')
      .select();

    if (ivanError) {
      console.error('❌ Error actualizando Ivan:', ivanError.message);
    } else if (ivanData && ivanData.length > 0) {
      console.log('✅ Ivan Pineda actualizado a "Director General"');
    } else {
      console.log('⚠️  No se encontró al usuario Ivan Pineda');
    }

    // ============================================
    // 3. Mostrar todos los agentes y sus cargos actuales
    // ============================================
    console.log('\n📊 Cargos actuales del personal:\n');

    const { data: staffData, error: staffError } = await supabase
      .from('users')
      .select('nombre, apellido_paterno, email, rol, categoria, zona')
      .in('rol', ['agent', 'admin'])
      .order('rol')
      .order('categoria');

    if (staffError) {
      console.error('❌ Error consultando personal:', staffError.message);
    } else if (staffData) {
      console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
      console.log('│ NOMBRE               │ EMAIL                        │ ROL    │ CARGO           │');
      console.log('├─────────────────────────────────────────────────────────────────────────────────┤');

      staffData.forEach(user => {
        const nombre = `${user.nombre || ''} ${user.apellido_paterno || ''}`.trim().padEnd(20);
        const email = (user.email || '').padEnd(28);
        const rol = (user.rol || '').padEnd(6);
        const cargo = (user.categoria || 'Sin cargo').padEnd(15);
        console.log(`│ ${nombre} │ ${email} │ ${rol} │ ${cargo} │`);
      });

      console.log('└─────────────────────────────────────────────────────────────────────────────────┘');
    }

    console.log('\n✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

// Ejecutar
updateEmployeePositions();
