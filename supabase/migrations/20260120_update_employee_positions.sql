/*
  # Actualización de Cargos de Personal

  Este script actualiza los cargos/categorías de los empleados (agentes)
  con los puestos reales según el requerimiento:
  - Cotizaciones
  - Gerente de Ventas
  - Soporte Técnico
  - Etc.

  Fecha: 2026-01-20
*/

-- ============================================================================
-- ACTUALIZACIÓN DE CARGOS DE AGENTES
-- ============================================================================

-- Actualizar el agente Javier González como "Gerente de Ventas"
UPDATE users SET
  categoria = 'Gerente de Ventas'
WHERE email = 'j.gonzalez@elmec.com.mx' AND rol = 'agent';

-- Actualizar el admin Ivan Pineda como "Director General"
UPDATE users SET
  categoria = 'Director General'
WHERE email = 'i.pineda@elmec.com.mx' AND rol = 'admin';

-- ============================================================================
-- NOTA: Para agregar más agentes con cargos específicos,
-- ejecutar los siguientes comandos en Supabase Dashboard:
--
-- Ejemplo para agregar un agente de Cotizaciones:
-- INSERT INTO users (id, email, nombre, apellido_paterno, rol, categoria, zona, activo)
-- VALUES (
--   gen_random_uuid(),
--   'cotizaciones@elmec.com.mx',
--   'Nombre',
--   'Apellido',
--   'agent',
--   'Cotizaciones',
--   'Centro',
--   true
-- );
--
-- Cargos disponibles sugeridos:
-- - Cotizaciones
-- - Gerente de Ventas
-- - Soporte Técnico
-- - Ejecutivo de Cuentas
-- - Coordinador de Operaciones
-- - Analista de Servicio
-- ============================================================================

-- Verificar los cambios
-- SELECT id, nombre, apellido_paterno, email, rol, categoria, zona
-- FROM users
-- WHERE rol IN ('agent', 'admin')
-- ORDER BY rol, categoria;
