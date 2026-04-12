#!/usr/bin/env node

/**
 * Script para limpiar agentes inválidos de la base de datos
 * Según QA PDF página 7:
 * - Eliminar: Ana García Morales, Carlos Mendoza Silva, Luis Ramírez Torres
 * - Quitar palabra "nulo" de nombres de agentes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Agentes a eliminar según PDF QA
const AGENTS_TO_DELETE = [
  'Ana García Morales',
  'Carlos Mendoza Silva',
  'Luis Ramírez Torres',
];

async function cleanupInvalidAgents() {
  console.log('🧹 Iniciando limpieza de agentes inválidos...\n');

  try {
    // 1. Obtener todos los usuarios
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('nombre');

    if (fetchError) {
      throw new Error(`Error al obtener usuarios: ${fetchError.message}`);
    }

    console.log(`📊 Total de usuarios en la BD: ${allUsers.length}\n`);

    // 2. Identificar agentes a eliminar
    const agentsToDelete = allUsers.filter(user => {
      const fullName =
        `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`.trim();
      return AGENTS_TO_DELETE.some(agentName =>
        fullName.toLowerCase().includes(agentName.toLowerCase())
      );
    });

    console.log('🔍 Agentes encontrados para eliminar:');
    if (agentsToDelete.length === 0) {
      console.log('   ✅ No se encontraron agentes para eliminar\n');
    } else {
      agentsToDelete.forEach(agent => {
        const fullName = `${agent.nombre} ${agent.apellido_paterno} ${agent.apellido_materno}`;
        console.log(`   - ${fullName} (${agent.correo_electronico})`);
      });
      console.log('');
    }

    // 3. Identificar usuarios con "nulo" en el nombre
    const usersWithNulo = allUsers.filter(
      user =>
        user.nombre?.toLowerCase().includes('nulo') ||
        user.apellido_paterno?.toLowerCase().includes('nulo') ||
        user.apellido_materno?.toLowerCase().includes('nulo')
    );

    console.log('🔍 Usuarios con palabra "nulo":');
    if (usersWithNulo.length === 0) {
      console.log('   ✅ No se encontraron usuarios con "nulo"\n');
    } else {
      usersWithNulo.forEach(user => {
        const fullName = `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`;
        console.log(`   - ${fullName} (${user.correo_electronico})`);
      });
      console.log('');
    }

    // 4. Eliminar agentes específicos
    if (agentsToDelete.length > 0) {
      console.log('🗑️  Eliminando agentes...');
      for (const agent of agentsToDelete) {
        const fullName = `${agent.nombre} ${agent.apellido_paterno} ${agent.apellido_materno}`;

        // Marcar como inactivo en lugar de eliminar (para mantener integridad referencial)
        const { error: updateError } = await supabase
          .from('users')
          .update({ activo: false })
          .eq('id', agent.id);

        if (updateError) {
          console.error(
            `   ❌ Error al desactivar ${fullName}: ${updateError.message}`
          );
        } else {
          console.log(`   ✅ Desactivado: ${fullName}`);
        }
      }
      console.log('');
    }

    // 5. Limpiar palabra "nulo"
    if (usersWithNulo.length > 0) {
      console.log('🧹 Limpiando palabra "nulo"...');
      for (const user of usersWithNulo) {
        const updates = {
          nombre: user.nombre?.replace(/nulo\s*/gi, '').trim() || user.nombre,
          apellido_paterno:
            user.apellido_paterno?.replace(/nulo\s*/gi, '').trim() ||
            user.apellido_paterno,
          apellido_materno:
            user.apellido_materno?.replace(/nulo\s*/gi, '').trim() ||
            user.apellido_materno,
        };

        const oldName = `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`;
        const newName = `${updates.nombre} ${updates.apellido_paterno} ${updates.apellido_materno}`;

        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error(
            `   ❌ Error al limpiar ${oldName}: ${updateError.message}`
          );
        } else {
          console.log(`   ✅ ${oldName} → ${newName}`);
        }
      }
      console.log('');
    }

    // 6. Resumen final
    console.log('📋 Resumen de limpieza:');
    console.log(`   - Agentes desactivados: ${agentsToDelete.length}`);
    console.log(`   - Nombres limpiados: ${usersWithNulo.length}`);
    console.log('\n✅ Limpieza completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar script
cleanupInvalidAgents();
