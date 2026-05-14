#!/usr/bin/env node

/**
 * Script para crear un usuario cliente demo en ELMEC
 * Crea un usuario tipo 'customer' con información de prueba
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Configuración de Supabase incompleta');
  console.log(
    'Asegúrate de tener EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Datos del usuario cliente demo
const demoCustomer = {
  id: uuidv4(),
  email: 'cliente.demo@elmec.com',
  empresa: 'Empresa Demo S.A. de C.V.',
  nombre: 'Juan',
  apellido_paterno: 'Pérez',
  apellido_materno: 'García',
  correo_electronico: 'cliente.demo@elmec.com',
  celular: '5512345678',
  ciudad: 'Ciudad de México',
  estado: 'Ciudad de México',
  rol: 'customer',
  status_aprobacion: 'aprobado',
  categoria: null,
  zona: 'Norte',
  activo: true,
  foto: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: null,
  is_online: false,
  last_seen: new Date().toISOString(),
};

// Contraseña para el usuario en Supabase Auth
const tempPassword = 'Demo123456!';

async function createDemoCustomer() {
  console.log('=== Creando Usuario Cliente Demo ===\n');

  try {
    // 1. Verificar si el usuario ya existe
    console.log('1. Verificando si el usuario ya existe...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', demoCustomer.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(
        'Error al verificar usuario existente:',
        checkError.message
      );
      return;
    }

    if (existingUser) {
      console.log(
        `El usuario ${demoCustomer.email} ya existe con ID: ${existingUser.id}`
      );
      console.log('¿Deseas actualizarlo? (y/n)');
      return;
    }

    // 2. Crear usuario en Supabase Auth
    console.log('2. Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: demoCustomer.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: `${demoCustomer.nombre} ${demoCustomer.apellido_paterno} ${demoCustomer.apellido_materno}`,
          role: demoCustomer.rol,
          company: demoCustomer.empresa,
        },
      });

    if (authError) {
      console.error('Error al crear usuario en Auth:', authError.message);
      return;
    }

    console.log(`Usuario Auth creado con ID: ${authData.user.id}`);

    // 3. Crear perfil en la tabla users
    console.log('3. Creando perfil en tabla users...');
    const userProfile = {
      ...demoCustomer,
      id: authData.user.id, // Usar el mismo ID que generó Auth
    };

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([userProfile])
      .select()
      .single();

    if (profileError) {
      console.error('Error al crear perfil en users:', profileError.message);
      // Intentar eliminar el usuario de Auth si falló el perfil
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('Perfil creado exitosamente');

    // 4. Mostrar información del usuario creado
    console.log('\n=== Usuario Cliente Demo Creado Exitosamente ===');
    console.log(`Email: ${demoCustomer.email}`);
    console.log(`Contraseña: ${tempPassword}`);
    console.log(
      `Nombre: ${demoCustomer.nombre} ${demoCustomer.apellido_paterno} ${demoCustomer.apellido_materno}`
    );
    console.log(`Empresa: ${demoCustomer.empresa}`);
    console.log(`Rol: ${demoCustomer.rol}`);
    console.log(`Teléfono: ${demoCustomer.celular}`);
    console.log(`Ciudad: ${demoCustomer.ciudad}, ${demoCustomer.estado}`);
    console.log(`Zona: ${demoCustomer.zona}`);
    console.log(`ID: ${authData.user.id}`);

    console.log('\n=== Información de Login ===');
    console.log('Puedes iniciar sesión con estas credenciales en la app:');
    console.log(`Usuario: ${demoCustomer.email}`);
    console.log(`Contraseña: ${tempPassword}`);
    console.log(
      '\nEste usuario verá "Agente: [nombre]" en la actividad reciente.'
    );
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

// Ejecutar el script
createDemoCustomer()
  .then(() => {
    console.log('\nScript finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
