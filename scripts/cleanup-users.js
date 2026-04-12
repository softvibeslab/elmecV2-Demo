/**
 * Script para limpiar datos de usuarios en Supabase
 *
 * Este script:
 * 1. Desactiva usuarios específicos (Ana García Morales, Carlos Mendoza Silva, Luis Ramírez Torres)
 * 2. Limpia la palabra "nulo" de los nombres de agentes
 *
 * Uso: node scripts/cleanup-users.js
 */

const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno desde .env manualmente
const fs = require('fs');
const path = require('path');

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
  console.error('Error: Falta configuración de Supabase en .env');
  console.error(
    'Se requiere: EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupUsers() {
  console.log('🔄 Iniciando limpieza de usuarios...\n');

  try {
    // 1. Desactivar usuarios específicos
    console.log('📋 Paso 1: Desactivando usuarios específicos...');
    const usersToDeactivate = [
      'Ana García Morales',
      'Carlos Mendoza Silva',
      'Luis Ramírez Torres',
    ];

    for (const fullName of usersToDeactivate) {
      const nameParts = fullName.split(' ');
      const nombre = nameParts[0];
      const apellidoPaterno = nameParts[1];
      const apellidoMaterno = nameParts.slice(2).join(' ');

      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('id, nombre, apellido_paterno, apellido_materno, activo')
        .ilike('nombre', nombre)
        .ilike('apellido_paterno', apellidoPaterno);

      if (searchError) {
        console.error(`❌ Error buscando ${fullName}:`, searchError.message);
        continue;
      }

      if (users && users.length > 0) {
        for (const user of users) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ activo: false })
            .eq('id', user.id);

          if (updateError) {
            console.error(
              `❌ Error desactivando ${fullName}:`,
              updateError.message
            );
          } else {
            console.log(`✅ Desactivado: ${fullName} (ID: ${user.id})`);
          }
        }
      } else {
        console.log(`⚠️  No se encontró: ${fullName}`);
      }
    }

    // 2. Limpiar la palabra "nulo" de los nombres
    console.log('\n📋 Paso 2: Limpiando palabra "nulo" de los nombres...');

    const { data: usersWithNulo, error: searchNuloError } = await supabase
      .from('users')
      .select('id, nombre, apellido_paterno, apellido_materno')
      .or(
        'nombre.ilike.%nulo%,apellido_paterno.ilike.%nulo%,apellido_materno.ilike.%nulo%'
      );

    if (searchNuloError) {
      console.error(
        '❌ Error buscando usuarios con "nulo":',
        searchNuloError.message
      );
    } else if (usersWithNulo && usersWithNulo.length > 0) {
      console.log(
        `Encontrados ${usersWithNulo.length} usuarios con "nulo" en el nombre`
      );

      for (const user of usersWithNulo) {
        const cleanedNombre = user.nombre.replace(/\s*nulo\s*/gi, '').trim();
        const cleanedApellidoPaterno = user.apellido_paterno
          .replace(/\s*nulo\s*/gi, '')
          .trim();
        const cleanedApellidoMaterno = user.apellido_materno
          ? user.apellido_materno.replace(/\s*nulo\s*/gi, '').trim()
          : '';

        const { error: updateError } = await supabase
          .from('users')
          .update({
            nombre: cleanedNombre || user.nombre,
            apellido_paterno: cleanedApellidoPaterno || user.apellido_paterno,
            apellido_materno: cleanedApellidoMaterno || user.apellido_materno,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(
            `❌ Error limpiando usuario ID ${user.id}:`,
            updateError.message
          );
        } else {
          console.log(
            `✅ Limpiado: ${user.nombre} ${user.apellido_paterno} → ${cleanedNombre} ${cleanedApellidoPaterno}`
          );
        }
      }
    } else {
      console.log('✅ No se encontraron usuarios con "nulo" en el nombre');
    }

    // 3. Verificar cantidad de usuarios activos
    console.log('\n📋 Paso 3: Verificando cantidad de usuarios activos...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    if (countError) {
      console.error('❌ Error contando usuarios:', countError.message);
    } else {
      console.log(`✅ Total de usuarios activos: ${count}`);
      if (count > 15) {
        console.log(
          `⚠️  Hay ${count} usuarios activos, se esperaban máximo 15`
        );
      }
    }

    console.log('\n✅ Limpieza completada exitosamente!');
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
cleanupUsers()
  .then(() => {
    console.log('\n🎉 Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
