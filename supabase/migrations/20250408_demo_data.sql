-- =====================================================
-- DEMO DATA MIGRATION
-- =====================================================
-- Insert sample data for development and testing
-- Includes: users, requests, chat rooms, messages, compliance data
-- =====================================================

-- =====================================================
-- 1. DEMO USERS
-- =====================================================

-- Insert demo users (if they don't exist)
INSERT INTO users (id, email, full_name, role, zona, status_aprobacion, phone, created_at)
VALUES
  ('demo-user-1', 'juan.perez@elmectest.com', 'Juan Pérez', 'tecnico', 'Norte', 'aprobado', '+5491112345678', NOW()),
  ('demo-user-2', 'maria.gonzalez@elmectest.com', 'María González', 'supervisor', 'Sur', 'aprobado', '+5491123456789', NOW()),
  ('demo-user-3', 'carlos.rodriguez@elmectest.com', 'Carlos Rodríguez', 'admin', 'Centro', 'aprobado', '+5491134567890', NOW()),
  ('demo-user-4', 'ana.martinez@elmectest.com', 'Ana Martínez', 'tecnico', 'Este', 'pendiente', '+5491145678901', NOW()),
  ('demo-user-5', 'luis.sanchez@elmectest.com', 'Luis Sánchez', 'tecnico', 'Oeste', 'aprobado', '+5491156789012', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. DEMO REQUESTS
-- =====================================================

-- Insert demo requests
INSERT INTO requests (
  id, title, description, priority, status, zona, created_by, assigned_to,
  service_type, location, scheduled_date, created_at, updated_at
)
VALUES
  (
    'demo-req-1',
    'Mantenimiento Preventivo HVAC - Edificio Central',
    'Realizar mantenimiento preventivo completo del sistema de aire acondicionado central. Incluye limpieza de filtros, revisión de compresores y verificación de niveles de refrigerante.',
    'high',
    'in_progress',
    'Centro',
    'demo-user-1',
    'demo-user-5',
    'HVAC',
    'Edificio Central, Piso 12',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    'demo-req-2',
    'Reparación de Sistema Eléctrico - Planta Norte',
    'Fallo en el sistema de distribución eléctrica. Se detectó cortocircuito en el panel principal. Necesario revisar y reemplazar componentes dañados.',
    'urgent',
    'pending',
    'Norte',
    'demo-user-4',
    'demo-user-2',
    'Electrical',
    'Planta Norte, Sala de Máquinas',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '3 hours',
    NOW()
  ),
  (
    'demo-req-3',
    'Instalación de Nuevos Servidores - Data Center',
    'Instalación y configuración de 5 servidores nuevos en el rack principal. Incluye cableado, configuración de red y pruebas de funcionamiento.',
    'normal',
    'approved',
    'Sur',
    'demo-user-5',
    'demo-user-1',
    'IT',
    'Data Center, Rack A-15',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    'demo-req-4',
    'Mantenimiento de Ascensores - Torre Este',
    'Mantenimiento semanal de los 4 ascensores. Revisión de cables, puertas, y sistema de frenado de emergencia.',
    'normal',
    'completed',
    'Este',
    'demo-user-1',
    'demo-user-5',
    'Elevators',
    'Torre Este, Shaft A-B',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  (
    'demo-req-5',
    'Reparación de Fugas en Sistema de Agua - Planta Oeste',
    'Se detectaron fugas en las tuberías principales del sistema de agua potable. Necesaria inspección y reparación urgente.',
    'urgent',
    'in_progress',
    'Oeste',
    'demo-user-4',
    'demo-user-2',
    'Plumbing',
    'Planta Oeste, Área de Tanques',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '5 hours',
    NOW()
  ),
  (
    'demo-req-6',
    'Instalación de Sistema de Seguridad - Perímetro',
    'Instalación de cámaras de seguridad y sensores de movimiento en todo el perímetro de la planta.',
    'high',
    'pending',
    'Norte',
    'demo-user-5',
    'demo-user-3',
    'Security',
    'Planta Norte, Perímetro',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    'demo-req-7',
    'Calibración de Instrumentos Industriales - Línea 3',
    'Calibración anual de todos los instrumentos de medición de la línea de producción 3. Incluye manómetros, termómetros y transductores.',
    'normal',
    'completed',
    'Centro',
    'demo-user-1',
    'demo-user-5',
    'Calibration',
    'Línea de Producción 3',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '10 days',
    NOW()
  ),
  (
    'demo-req-8',
    'Reemplazo de Transformador Principal - Subestación',
    'El transformador principal ha alcanzado el fin de su vida útil. Necesario reemplazo completo y pruebas de integración.',
    'high',
    'approved',
    'Sur',
    'demo-user-4',
    'demo-user-2',
    'Electrical',
    'Subestación Principal',
    NOW() + INTERVAL '10 days',
    NOW() - INTERVAL '12 hours',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. DEMO COMPLIANCE FLOW DATA
-- =====================================================

-- Insert request flow compliance data
INSERT INTO request_flow_compliance (
  request_id, current_status, pending_at, approved_at, in_progress_at,
  completed_at, approved_by, executed_by, completed_by,
  pending_duration, approval_duration, execution_duration, total_duration,
  sla_met, sla_breach_reason
)
VALUES
  -- Request 1: In progress
  (
    'demo-req-1', 'in_progress',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours',
    NOW() - INTERVAL '2 hours',
    NULL,
    'demo-user-2', 'demo-user-5', NULL,
    14400, 64800, 7200, NULL,
    true, NULL
  ),
  -- Request 2: Pending
  (
    'demo-req-2', 'pending',
    NOW() - INTERVAL '3 hours',
    NULL, NULL, NULL,
    NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL
  ),
  -- Request 3: Approved
  (
    'demo-req-3', 'approved',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '4 hours',
    NULL, NULL,
    'demo-user-2', NULL, NULL,
    144000, NULL, NULL, NULL,
    true, NULL
  ),
  -- Request 4: Completed
  (
    'demo-req-4', 'completed',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    'demo-user-2', 'demo-user-5', 'demo-user-2',
    86400, 86400, 86400, 259200,
    true, NULL
  ),
  -- Request 5: In progress with SLA breach
  (
    'demo-req-5', 'in_progress',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '2 hours',
    NULL,
    'demo-user-2', 'demo-user-2', NULL,
    3600, 7200, 7200, NULL,
    false, 'Tiempo de aprobación excedido para urgencia'
  ),
  -- Request 6: Pending
  (
    'demo-req-6', 'pending',
    NOW() - INTERVAL '1 day',
    NULL, NULL, NULL,
    NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL
  ),
  -- Request 7: Completed
  (
    'demo-req-7', 'completed',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days',
    'demo-user-2', 'demo-user-5', 'demo-user-2',
    86400, 86400, 86400, 259200,
    true, NULL
  ),
  -- Request 8: Approved
  (
    'demo-req-8', 'approved',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '2 hours',
    NULL, NULL,
    'demo-user-3', NULL, NULL,
    36000, NULL, NULL, NULL,
    true, NULL
  )
ON CONFLICT (request_id) DO NOTHING;

-- =====================================================
-- 4. DEMO SLA MAPPINGS
-- =====================================================

-- Map SLAs to requests
INSERT INTO request_sla_mapping (request_id, sla_id)
VALUES
  ('demo-req-1', (SELECT id FROM sla_definitions WHERE priority_level = 'high' LIMIT 1)),
  ('demo-req-2', (SELECT id FROM sla_definitions WHERE priority_level = 'urgent' LIMIT 1)),
  ('demo-req-3', (SELECT id FROM sla_definitions WHERE priority_level = 'normal' LIMIT 1)),
  ('demo-req-4', (SELECT id FROM sla_definitions WHERE priority_level = 'normal' LIMIT 1)),
  ('demo-req-5', (SELECT id FROM sla_definitions WHERE priority_level = 'urgent' LIMIT 1)),
  ('demo-req-6', (SELECT id FROM sla_definitions WHERE priority_level = 'high' LIMIT 1)),
  ('demo-req-7', (SELECT id FROM sla_definitions WHERE priority_level = 'normal' LIMIT 1)),
  ('demo-req-8', (SELECT id FROM sla_definitions WHERE priority_level = 'high' LIMIT 1))
ON CONFLICT (request_id) DO NOTHING;

-- =====================================================
-- 5. DEMO USER ACTIVITY LOGS
-- =====================================================

-- Insert recent activity logs
INSERT INTO user_activity_log (
  user_id, activity_type, request_id, chat_room_id, metadata, platform
)
VALUES
  -- Login activities
  ('demo-user-1', 'login', NULL, NULL, '{"ip": "192.168.1.100"}', 'android'),
  ('demo-user-2', 'login', NULL, NULL, '{"ip": "192.168.1.101"}', 'ios'),
  ('demo-user-3', 'login', NULL, NULL, '{"ip": "192.168.1.102"}', 'web'),

  -- Request activities
  ('demo-user-1', 'request_created', 'demo-req-1', NULL, '{"title": "Mantenimiento Preventivo HVAC"}', 'android'),
  ('demo-user-2', 'request_approved', 'demo-req-1', NULL, '{"notes": "Aprobado por prioridad alta"}', 'ios'),
  ('demo-user-5', 'request_completed', 'demo-req-4', NULL, '{"duration": "3 días"}', 'android'),

  -- Evidence activities
  ('demo-user-2', 'evidence_added', 'demo-req-1', NULL, '{"evidenceType": "checklist"}', 'ios'),
  ('demo-user-5', 'evidence_added', 'demo-req-4', NULL, '{"evidenceType": "file"}', 'android'),

  -- Message activities
  ('demo-user-1', 'message_sent', NULL, NULL, '{"chatRoom": "demo-chat-1"}', 'android'),
  ('demo-user-2', 'message_sent', NULL, NULL, '{"chatRoom": "demo-chat-1"}', 'ios'),

  -- Checklist activities
  ('demo-user-1', 'checklist_completed', NULL, NULL, '{"checklistId": "basic-onboarding"}', 'android'),

  -- Signature activities
  ('demo-user-2', 'signature_added', 'demo-req-1', NULL, '{"entityType": "request"}', 'ios')
ON CONFLICT DO NOTHING;

-- Insert more historical activities (last 30 days)
INSERT INTO user_activity_log (
  user_id, activity_type, request_id, metadata, platform, created_at
)
SELECT
  'demo-user-1',
  (ARRAY['login', 'file_upload', 'message_sent', 'request_created'])[floor(random() * 4) + 1],
  (ARRAY['demo-req-1', 'demo-req-4', 'demo-req-7'])[floor(random() * 3) + 1],
  '{"action": "historical activity"}',
  (ARRAY['android', 'ios', 'web'])[floor(random() * 3) + 1],
  NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 20);

-- =====================================================
-- 6. DEMO CHAT ROOMS
-- =====================================================

-- Insert demo chat rooms
INSERT INTO chat_rooms (
  id, name, description, is_group, created_by, metadata, created_at
)
VALUES
  (
    'demo-chat-1',
    'Coordinación Mantenimiento HVAC',
    'Chat para coordinar el mantenimiento del sistema de aire acondicionado del edificio central',
    true,
    'demo-user-2',
    '{"zona": "Centro", "request_title": "Mantenimiento Preventivo HVAC", "request_id": "demo-req-1"}',
    NOW() - INTERVAL '1 day'
  ),
  (
    'demo-chat-2',
    'Soporte Técnico - Planta Norte',
    'Canal de soporte para incidencias en la planta norte',
    true,
    'demo-user-2',
    '{"zona": "Norte", "request_title": "Reparación Sistema Eléctrico"}',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'demo-chat-3',
    'Consulta General',
    'Chat directo para consultas generales',
    false,
    'demo-user-1',
    '{"direct": true}',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Add participants to group chats
INSERT INTO chat_room_members (chat_room_id, user_id, role)
VALUES
  -- Chat 1 participants
  ('demo-chat-1', 'demo-user-1', 'member'),
  ('demo-chat-1', 'demo-user-2', 'admin'),
  ('demo-chat-1', 'demo-user-5', 'member'),

  -- Chat 2 participants
  ('demo-chat-2', 'demo-user-4', 'member'),
  ('demo-chat-2', 'demo-user-2', 'admin'),
  ('demo-chat-2', 'demo-user-3', 'moderator'),

  -- Chat 3 participants (direct chat)
  ('demo-chat-3', 'demo-user-1', 'member'),
  ('demo-chat-3', 'demo-user-2', 'member')
ON CONFLICT (chat_room_id, user_id) DO NOTHING;

-- =====================================================
-- 7. DEMO MESSAGES
-- =====================================================

-- Insert demo messages
INSERT INTO messages (
  id, chat_room_id, sender_id, content, message_type, created_at, updated_at
)
VALUES
  -- Chat 1 messages
  (
    'demo-msg-1', 'demo-chat-1', 'demo-user-1',
    'Hola equipo, estoy listo para iniciar el mantenimiento del HVAC. ¿Alguna novedad?',
    'text',
    NOW() - INTERVAL '23 hours',
    NOW() - INTERVAL '23 hours'
  ),
  (
    'demo-msg-2', 'demo-chat-1', 'demo-user-2',
    'Perfecto Juan. Ya tienes autorización para acceder al piso 12. Recuerda seguir todos los protocolos de seguridad.',
    'text',
    NOW() - INTERVAL '22 hours',
    NOW() - INTERVAL '22 hours'
  ),
  (
    'demo-msg-3', 'demo-chat-1', 'demo-user-5',
    'Yo te acompaño en la parte de refrigerante. Necesitamos revisar los niveles primero.',
    'text',
    NOW() - INTERVAL '21 hours',
    NOW() - INTERVAL '21 hours'
  ),
  (
    'demo-msg-4', 'demo-chat-1', 'demo-user-1',
    'Entendido. Ya tengo los equipos de medición. Nos vemos allá.',
    'text',
    NOW() - INTERVAL '20 hours',
    NOW() - INTERVAL '20 hours'
  ),

  -- Chat 2 messages
  (
    'demo-msg-5', 'demo-chat-2', 'demo-user-4',
    'Urgente: Tenemos un cortocircuito en el panel principal de la planta norte.',
    'text',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'demo-msg-6', 'demo-chat-2', 'demo-user-2',
    'Entendido Ana. Ya estamos enviando a Carlos para evaluar la situación.',
    'text',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'demo-msg-7', 'demo-chat-2', 'demo-user-3',
    'Ana, por favor evacua el área afectada y corta la energía principal hasta que llegue el equipo.',
    'text',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),

  -- Chat 3 messages
  (
    'demo-msg-8', 'demo-chat-3', 'demo-user-1',
    'Hola María, ¿podrías ayudarme con una duda sobre el proceso de aprobación?',
    'text',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'demo-msg-9', 'demo-chat-3', 'demo-user-2',
    'Claro que sí Juan. ¿Qué necesitas saber?',
    'text',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. DEMO COMPLIANCE EVIDENCE
-- =====================================================

-- Insert demo evidence
INSERT INTO compliance_evidence (
  request_id, submitted_by, evidence_type, note_text, verified, verified_by, verified_at
)
VALUES
  (
    'demo-req-1', 'demo-user-5', 'checklist',
    'Checklist de mantenimiento completado: Filtros limpios, compresores revisados, niveles de refrigerante OK',
    true, 'demo-user-2', NOW() - INTERVAL '1 hour'
  ),
  (
    'demo-req-4', 'demo-user-5', 'file',
    'Fotografías del mantenimiento realizado y reporte técnico firmado',
    true, 'demo-user-2', NOW() - INTERVAL '3 days'
  ),
  (
    'demo-req-7', 'demo-user-5', 'checklist',
    'Certificados de calibración de todos los instrumentos de la línea 3',
    true, 'demo-user-2', NOW() - INTERVAL '1 week'
  ),
  (
    'demo-req-5', 'demo-user-2', 'note',
    'Inspección inicial realizada. Se detectaron 3 puntos de fuga que requieren soldadura',
    false, NULL, NULL
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. DEMO ONBOARDING PROGRESS
-- =====================================================

-- Insert onboarding progress for demo users
INSERT INTO user_onboarding_progress (
  user_id, template_id, status, started_at, completed_at, last_accessed_at
)
VALUES
  -- Completed onboarding
  (
    'demo-user-1',
    (SELECT id FROM onboarding_templates WHERE tier = 'basic' LIMIT 1),
    'completed',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'demo-user-2',
    (SELECT id FROM onboarding_templates WHERE tier = 'supervisor' LIMIT 1),
    'completed',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'demo-user-3',
    (SELECT id FROM onboarding_templates WHERE tier = 'admin' LIMIT 1),
    'completed',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '1 day'
  ),
  -- In progress onboarding
  (
    'demo-user-4',
    (SELECT id FROM onboarding_templates WHERE tier = 'basic' LIMIT 1),
    'in_progress',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'demo-user-5',
    (SELECT id FROM onboarding_templates WHERE tier = 'basic' LIMIT 1),
    'in_progress',
    NOW() - INTERVAL '5 days',
    NULL,
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT (user_id) DO NOTHING;

-- Insert onboarding responses for in-progress users
INSERT INTO user_onboarding_responses (progress_id, item_id, response_value, is_complete)
SELECT
  uop.id,
  (SELECT id FROM compliance_checklist_items WHERE template_id = uop.template_id ORDER BY item_order LIMIT 1),
  '{"checked": true, "timestamp": "2025-01-08T10:00:00Z"}',
  true
FROM user_onboarding_progress uop
WHERE uop.status = 'in_progress'
ON CONFLICT (progress_id, item_id) DO NOTHING;

-- =====================================================
-- 10. DEMO DIGITAL SIGNATURES
-- =====================================================

-- Insert demo signatures
INSERT INTO digital_signatures (
  user_id, entity_type, entity_id, signature_base64, signature_timestamp, legal_text, agreed_to_terms
)
VALUES
  (
    'demo-user-2', 'request', 'demo-req-1',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMTAgODAgUTMwIDYwIDUwIDcwIFc5MCIgc3Ryb2tlPSJibGFjayIvPjwvc3ZnPg==',
    NOW() - INTERVAL '1 day',
    'Confirmo que he revisado y validado la solicitud de mantenimiento HVAC',
    true
  ),
  (
    'demo-user-5', 'request', 'demo-req-4',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMTAgNzAgUTQwIDUwIDcwIDYwIFc5MCIgc3Ryb2tlPSJibHVlIi8+PC9zdmc+',
    NOW() - INTERVAL '3 days',
    'Confirmo que he completado el mantenimiento de ascensores según los procedimientos establecidos',
    true
  ),
  (
    'demo-user-1', 'onboarding', 'basic-onboarding',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMTAgNjAgUTMwIDQwIDUwIDUwIFw5MCIgc3Ryb2tlPSJncmVlbiIvPjwvc3ZnPg==',
    NOW() - INTERVAL '10 days',
    'Confirmo que he completado el onboarding básico y acepto los términos y condiciones',
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. CREATE DEMO LOGIN CREDENTIALS
-- =====================================================

-- Note: These users need to be created in Supabase Auth
-- Run this in Supabase SQL Editor to create auth users:

/*
-- Create auth users (you'll need to set passwords in Supabase Auth)
-- For demo purposes, create these users manually in Supabase Dashboard → Authentication → Users

-- Email: demo@elmectest.com | Password: Demo123456 | Role: admin (demo-user-3)
-- Email: juan.perez@elmectest.com | Password: Demo123456 | Role: tecnico (demo-user-1)
-- Email: maria.gonzalez@elmectest.com | Password: Demo123456 | Role: supervisor (demo-user-2)
-- Email: ana.martinez@elmectest.com | Password: Demo123456 | Role: tecnico (demo-user-4)
-- Email: luis.sanchez@elmectest.com | Password: Demo123456 | Role: tecnico (demo-user-5)
*/

-- =====================================================
-- 12. UPDATE USER METADATA
-- =====================================================

-- Update user metadata with role information
UPDATE users
SET user_metadata = jsonb_build_object(
  'role', role,
  'zona', zona,
  'full_name', full_name,
  'status', status_aprobacion
)
WHERE id LIKE 'demo-user-%';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Demo data migration completed successfully!';
  RAISE NOTICE 'Demo users created: 5 (3 tecnico, 1 supervisor, 1 admin)';
  RAISE NOTICE 'Demo requests created: 8 (various statuses and priorities)';
  RAISE NOTICE 'Demo compliance data: Flow tracking, SLA mappings, activity logs';
  RAISE NOTICE 'Demo chat rooms: 3 (2 group chats, 1 direct)';
  RAISE NOTICE 'Demo messages: 9 messages across 3 chats';
  RAISE NOTICE 'Demo evidence: 4 evidence entries';
  RAISE NOTICE 'Demo onboarding: 3 completed, 2 in progress';
  RAISE NOTICE 'Demo signatures: 3 digital signatures';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials (create in Supabase Auth):';
  RAISE NOTICE 'Email: demo@elmectest.com | Password: Demo123456 | Role: admin';
  RAISE NOTICE 'Email: juan.perez@elmectest.com | Password: Demo123456 | Role: tecnico';
  RAISE NOTICE 'Email: maria.gonzalez@elmectest.com | Password: Demo123456 | Role: supervisor';
END $$;
