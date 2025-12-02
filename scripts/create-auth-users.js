// Crear cuentas en Supabase Auth para usuarios del directorio y vincular perfiles
// Requisitos:
// - .env con SUPABASE_SERVICE_ROLE_KEY y EXPO_PUBLIC_SUPABASE_URL
// - Opcional: DEFAULT_TEMP_PASSWORD para asignar una contraseña temporal

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_TEMP_PASSWORD = process.env.DEFAULT_TEMP_PASSWORD;

if (!SUPABASE_URL) {
  console.error('ERROR: Falta EXPO_PUBLIC_SUPABASE_URL o SUPABASE_URL en .env');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    'ERROR: Falta SUPABASE_SERVICE_ROLE_KEY en .env (necesario para admin)'
  );
  process.exit(1);
}
if (!DEFAULT_TEMP_PASSWORD) {
  console.warn(
    'ADVERTENCIA: No se definió DEFAULT_TEMP_PASSWORD. Se intentará crear usuarios sin contraseña y puede fallar.'
  );
  console.warn(
    'Recomendación: añade DEFAULT_TEMP_PASSWORD="TuContraseñaTemporal123" al .env y vuelve a ejecutar.'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listUsersPage(page = 1, perPage = 200) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    return data?.users || [];
  } catch (err) {
    console.error('Error listUsers:', err?.message || err);
    return [];
  }
}

async function findAuthUserByEmail(email) {
  const users = await listUsersPage(1, 200);
  return users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
}

async function createOrGetAuthUser(email, metadata) {
  // Intenta crear; si ya existe, lo obtiene por listUsers
  try {
    const payload = {
      email,
      user_metadata: metadata || {},
    };
    if (DEFAULT_TEMP_PASSWORD) {
      payload.password = DEFAULT_TEMP_PASSWORD;
      payload.email_confirm = true; // Confirmamos para que puedan iniciar sesión directamente
    }

    const { data, error } = await supabase.auth.admin.createUser(payload);
    if (error) {
      // Si el usuario ya existe, lo buscamos
      if (
        String(error.message).toLowerCase().includes('already') ||
        String(error.message).toLowerCase().includes('exists')
      ) {
        const existing = await findAuthUserByEmail(email);
        if (existing) return existing;
      }
      throw error;
    }
    return data.user;
  } catch (err) {
    // Último intento: buscar por email
    const existing = await findAuthUserByEmail(email);
    if (existing) return existing;
    throw err;
  }
}

async function linkProfileIdToAuthId(email, authUserId) {
  // Actualiza el id del perfil para que coincida con el id del usuario de Auth
  // Nota: Esto modifica la PK. Asegúrate de que no haya FKs que referencien el id previo.
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('users')
    .update({ id: authUserId, updated_at: now })
    .eq('correo_electronico', email);
  if (error) throw error;
  return data;
}

async function main() {
  console.log('=== Creación de cuentas Auth y vinculación de perfiles ===');
  // Obtiene los perfiles de ELMEC ya insertados
  const { data: profiles, error } = await supabase
    .from('users')
    .select('*')
    .eq('empresa', 'ELMEC');
  if (error) {
    console.error('Error leyendo perfiles:', error.message);
    process.exit(1);
  }
  if (!profiles || profiles.length === 0) {
    console.error(
      'No se encontraron perfiles de empresa ELMEC en public.users. Ejecuta primero la migración de inserción.'
    );
    process.exit(1);
  }

  let createdCount = 0;
  let linkedCount = 0;

  for (const p of profiles) {
    const email = p?.correo_electronico || p?.email;
    if (!email) {
      console.warn('Perfil sin email, se omite:', p?.nombre);
      continue;
    }
    const metadata = {
      empresa: p.empresa,
      nombre: p.nombre,
      apellido_paterno: p.apellido_paterno,
      apellido_materno: p.apellido_materno,
      celular: p.celular,
      ciudad: p.ciudad,
      estado: p.estado,
      rol: p.rol,
      categoria: p.categoria,
      zona: p.zona,
    };

    try {
      const authUser = await createOrGetAuthUser(email, metadata);
      if (authUser) {
        createdCount += 1;
        await linkProfileIdToAuthId(email, authUser.id);
        linkedCount += 1;
        console.log(`✔ Vinculado: ${email} → ${authUser.id}`);
      } else {
        console.warn(`No se obtuvo usuario Auth para: ${email}`);
      }
    } catch (err) {
      console.error(`Error procesando ${email}:`, err?.message || err);
    }
  }

  console.log(
    `Proceso finalizado. Creados/Vinculados: ${createdCount}/${linkedCount}`
  );
  if (!DEFAULT_TEMP_PASSWORD) {
    console.log(
      'Nota: Define DEFAULT_TEMP_PASSWORD en .env para asignar una contraseña temporal a cada cuenta.'
    );
  }
}

main().catch(e => {
  console.error('Error general:', e?.message || e);
  process.exit(1);
});
