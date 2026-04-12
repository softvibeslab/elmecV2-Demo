# scripts/output

Este directorio contiene archivos generados por los scripts de autenticación:

- Enlaces de invitación (sin envío de correo) para usuarios de ELMEC.
- Exportaciones auxiliares en formatos JSON/CSV.

Cómo generar enlaces de invitación

- Requisitos en .env:
  - EXPO_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
- Ejecuta:
  - npm run create-auth-invites
- Salida:
  - invites-elmec-YYYY-MM-DDTHH-MM-SS.json
  - invites-elmec-YYYY-MM-DDTHH-MM-SS.csv

Contenido de los archivos

- email: correo del usuario
- name: nombre completo
- action_link: enlace de invitación (sensibles, no compartir públicamente)
- user_id: id del usuario en Auth

Buenas prácticas de seguridad

- NO comitees los archivos .json/.csv generados (están ignorados en .gitignore).
- Comparte los links solo por canales seguros.

Alternativa: cuentas con contraseña temporal

- Configura DEFAULT_TEMP_PASSWORD en .env
- Ejecuta npm run create-auth-users para crear y confirmar cuentas con contraseña temporal y vincular el perfil (public.users) al id de Auth.

Notas

- Si un usuario ya existe en Auth, los scripts lo detectan y generan/vinculan sin duplicar.
- Puedes revocar accesos desde el Dashboard (Auth > Users) o regenerar invitaciones.
