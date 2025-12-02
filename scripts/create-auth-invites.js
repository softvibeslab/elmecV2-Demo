// Generar enlaces de invitación (sin enviar correo) para los perfiles de ELMEC
// Requisitos:
// - .env con SUPABASE_SERVICE_ROLE_KEY y EXPO_PUBLIC_SUPABASE_URL
// - NO envía correos; solo genera los links y los guarda en archivos CSV/JSON

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function ensureAuthUser(email, metadata) {
  // Crea el usuario si no existe, SIN confirmar email ni asignar contraseña
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      user_metadata: metadata || {},
      email_confirm: false,
    });
    if (error) {
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
    const existing = await findAuthUserByEmail(email);
    if (existing) return existing;
    throw err;
  }
}

async function main() {
  console.log('=== Generación de enlaces de invitación (sin envío) ===');
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

  const results = [];
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
      const user = await ensureAuthUser(email, metadata);
      const { data, error: genError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
      });
      if (genError) throw genError;
      results.push({
        email,
        name: `${p.nombre} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim(),
        action_link: data?.action_link,
        email_otp: data?.email_otp,
        hashed_token: data?.hashed_token,
        user_id: user?.id || data?.user?.id,
      });
      console.log(`✔ Link generado para ${email}`);
    } catch (err) {
      console.error(`Error generando link para ${email}:`, err?.message || err);
    }
  }

  // Guardar en archivos
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `invites-elmec-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');

  const csvPath = path.join(outDir, `invites-elmec-${ts}.csv`);
  const header = 'email,name,action_link,user_id';
  const lines = results.map(
    r => `${r.email},"${r.name}",${r.action_link},${r.user_id}`
  );
  fs.writeFileSync(csvPath, [header, ...lines].join('\n'), 'utf-8');

  console.log(`\nArchivos generados:\n- ${jsonPath}\n- ${csvPath}`);
  console.log(
    'Listo: los enlaces NO se han enviado por correo. Puedes distribuirlos manualmente cuando lo decidas.'
  );
}

main().catch(e => {
  console.error('Error general:', e?.message || e);
  process.exit(1);
});
