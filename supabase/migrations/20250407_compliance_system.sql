-- =====================================================
-- COMPLIANCE SYSTEM MIGRATION
-- =====================================================
-- Comprehensive compliance tracking for requests, evidence,
-- onboarding, and SLA monitoring with tiered access control
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REQUEST FLOW COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS request_flow_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  current_status TEXT NOT NULL CHECK (current_status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),

  -- Stage timestamps
  pending_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  in_progress_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Duration tracking (in seconds)
  pending_duration INTEGER,
  approval_duration INTEGER,
  execution_duration INTEGER,
  total_duration INTEGER,

  -- SLA compliance
  sla_met BOOLEAN DEFAULT true,
  sla_breach_reason TEXT,

  -- User assignments
  approved_by UUID REFERENCES users(id),
  executed_by UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT valid_status_transition CHECK (
    (current_status = 'pending' AND approved_at IS NULL) OR
    (current_status = 'approved' AND approved_at IS NOT NULL) OR
    (current_status = 'in_progress' AND in_progress_at IS NOT NULL) OR
    (current_status = 'completed' AND completed_at IS NOT NULL) OR
    (current_status = 'rejected' AND rejected_at IS NOT NULL)
  )
);

-- Index for fast lookups
CREATE INDEX idx_request_flow_compliance_request_id ON request_flow_compliance(request_id);
CREATE INDEX idx_request_flow_compliance_status ON request_flow_compliance(current_status);
CREATE INDEX idx_request_flow_compliance_sla ON request_flow_compliance(sla_met);

-- =====================================================
-- 2. USER ACTIVITY TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout', 'file_upload', 'message_sent',
    'request_created', 'request_approved', 'request_completed',
    'evidence_added', 'checklist_completed', 'signature_added'
  )),

  -- Context
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',

  -- Session info
  ip_address INET,
  user_agent TEXT,
  platform TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(created_at DESC);

-- =====================================================
-- 3. COMPLIANCE EVIDENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),

  -- Evidence types
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('file', 'signature', 'checklist', 'note')),

  -- File evidence (if type = 'file')
  file_path TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,

  -- Signature evidence (if type = 'signature')
  signature_data JSONB,
  signature_ip INET,
  signature_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Checklist evidence (if type = 'checklist')
  checklist_id UUID REFERENCES compliance_checklist_items(id),
  checklist_response JSONB,

  -- Note evidence (if type = 'note')
  note_text TEXT,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_compliance_evidence_request_id ON compliance_evidence(request_id);
CREATE INDEX idx_compliance_evidence_type ON compliance_evidence(evidence_type);
CREATE INDEX idx_compliance_evidence_submitted_by ON compliance_evidence(submitted_by);

-- =====================================================
-- 4. ONBOARDING CHECKLISTS (TIERED SYSTEM)
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Tier assignment
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'supervisor', 'admin')),

  -- Checklist items (JSON structure for flexibility)
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Settings
  is_required BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  created_by UUID REFERENCES users(id)
);

-- Individual checklist items reference table
CREATE TABLE IF NOT EXISTS compliance_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE CASCADE,

  -- Item details
  title TEXT NOT NULL,
  description TEXT,
  item_order INTEGER NOT NULL,

  -- Validation rules
  is_required BOOLEAN DEFAULT true,
  evidence_required BOOLEAN DEFAULT false,

  -- Item type
  item_type TEXT NOT NULL CHECK (item_type IN ('checkbox', 'file_upload', 'signature', 'text_input')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User onboarding progress
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id),

  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,

  -- Status
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual item completions
CREATE TABLE IF NOT EXISTS user_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  progress_id UUID NOT NULL REFERENCES user_onboarding_progress(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES compliance_checklist_items(id) ON DELETE CASCADE,

  -- Response data
  response_value JSONB,
  is_complete BOOLEAN DEFAULT false,

  -- Evidence linkage
  evidence_id UUID REFERENCES compliance_evidence(id),

  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_response UNIQUE(progress_id, item_id)
);

-- Indexes for onboarding
CREATE INDEX idx_onboarding_templates_tier ON onboarding_templates(tier);
CREATE INDEX idx_onboarding_progress_user_id ON user_onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_status ON user_onboarding_progress(status);
CREATE INDEX idx_onboarding_responses_progress_id ON user_onboarding_responses(progress_id);

-- =====================================================
-- 5. DIGITAL SIGNATURES
-- =====================================================

CREATE TABLE IF NOT EXISTS digital_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Signature context
  entity_type TEXT NOT NULL CHECK (entity_type IN ('request', 'onboarding', 'evidence')),
  entity_id UUID NOT NULL,

  -- Signature data
  signature_base64 TEXT NOT NULL,
  signature_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Verification
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,

  -- Legal context
  legal_text TEXT,
  agreed_to_terms BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digital_signatures_user ON digital_signatures(user_id);
CREATE INDEX idx_digital_signatures_entity ON digital_signatures(entity_type, entity_id);

-- =====================================================
-- 6. SLA DEFINITIONS AND MONITORING
-- =====================================================

CREATE TABLE IF NOT EXISTS sla_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Time thresholds (in hours)
  approval_threshold_hours INTEGER NOT NULL DEFAULT 24,
  execution_threshold_hours INTEGER NOT NULL DEFAULT 72,
  total_threshold_hours INTEGER NOT NULL DEFAULT 96,

  -- Priority levels
  priority_level TEXT NOT NULL DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),

  -- Active status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link requests to SLA definitions
CREATE TABLE IF NOT EXISTS request_sla_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  sla_id UUID NOT NULL REFERENCES sla_definitions(id),

  -- Override thresholds for specific requests
  custom_approval_threshold INTEGER,
  custom_execution_threshold INTEGER,
  custom_total_threshold INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_thresholds CHECK (
    (custom_approval_threshold IS NULL OR custom_approval_threshold > 0) AND
    (custom_execution_threshold IS NULL OR custom_execution_threshold > 0) AND
    (custom_total_threshold IS NULL OR custom_total_threshold > 0)
  )
);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE request_flow_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_sla_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for request_flow_compliance
CREATE POLICY "Users can view compliance for their requests"
  ON request_flow_compliance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM requests WHERE requests.id = request_flow_compliance.request_id
    AND (requests.created_by = auth.uid() OR requests.assigned_to = auth.uid())
  ));

CREATE POLICY "Admins can view all compliance"
  ON request_flow_compliance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON user_activity_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for compliance_evidence
CREATE POLICY "Users can view evidence for their requests"
  ON compliance_evidence FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM requests WHERE requests.id = compliance_evidence.request_id
    AND (requests.created_by = auth.uid() OR requests.assigned_to = auth.uid())
  ));

CREATE POLICY "Users can insert evidence for their requests"
  ON compliance_evidence FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- RLS Policies for onboarding_templates
CREATE POLICY "All authenticated users can view templates"
  ON onboarding_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage templates"
  ON onboarding_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for user_onboarding_progress
CREATE POLICY "Users can view own progress"
  ON user_onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
  ON user_onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_onboarding_responses
CREATE POLICY "Users can manage own responses"
  ON user_onboarding_responses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_onboarding_progress
    WHERE user_onboarding_progress.id = user_onboarding_responses.progress_id
    AND user_onboarding_progress.user_id = auth.uid()
  ));

-- RLS Policies for digital_signatures
CREATE POLICY "Users can view own signatures"
  ON digital_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signatures"
  ON digital_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sla_definitions
CREATE POLICY "All authenticated users can view SLA definitions"
  ON sla_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to update request flow compliance status
CREATE OR REPLACE FUNCTION update_request_flow_status(
  p_request_id UUID,
  p_new_status TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_flow_id UUID;
  v_sla_id UUID;
  v_approval_threshold INTEGER;
  v_execution_threshold INTEGER;
  v_total_threshold INTEGER;
  v_sla_breach BOOLEAN;
  v_breach_reason TEXT;
BEGIN
  -- Get or create flow record
  SELECT id INTO v_flow_id
  FROM request_flow_compliance
  WHERE request_id = p_request_id;

  IF v_flow_id IS NULL THEN
    INSERT INTO request_flow_compliance (request_id, current_status)
    VALUES (p_request_id, p_new_status)
    RETURNING id INTO v_flow_id;
  END IF;

  -- Update timestamps based on status
  IF p_new_status = 'approved' THEN
    UPDATE request_flow_compliance
    SET approved_at = NOW(),
        approved_by = p_user_id,
        current_status = p_new_status,
        updated_at = NOW()
    WHERE id = v_flow_id;

  ELSIF p_new_status = 'in_progress' THEN
    UPDATE request_flow_compliance
    SET in_progress_at = NOW(),
        executed_by = p_user_id,
        current_status = p_new_status,
        updated_at = NOW()
    WHERE id = v_flow_id;

  ELSIF p_new_status = 'completed' THEN
    -- Calculate durations
    UPDATE request_flow_compliance
    SET completed_at = NOW(),
        completed_by = p_user_id,
        current_status = p_new_status,
        pending_duration = EXTRACT(EPOCH FROM (approved_at - pending_at)),
        approval_duration = EXTRACT(EPOCH FROM (in_progress_at - approved_at)),
        execution_duration = EXTRACT(EPOCH FROM (completed_at - in_progress_at)),
        total_duration = EXTRACT(EPOCH FROM (completed_at - pending_at)),
        updated_at = NOW()
    WHERE id = v_flow_id;

    -- Check SLA compliance
    SELECT sla_id INTO v_sla_id
    FROM request_sla_mapping
    WHERE request_id = p_request_id;

    IF v_sla_id IS NOT NULL THEN
      SELECT
        COALESCE(custom_approval_threshold, approval_threshold_hours),
        COALESCE(custom_execution_threshold, execution_threshold_hours),
        COALESCE(custom_total_threshold, total_threshold_hours)
      INTO v_approval_threshold, v_execution_threshold, v_total_threshold
      FROM sla_definitions
      WHERE id = v_sla_id;

      -- Check if thresholds exceeded (convert hours to seconds)
      SELECT
        (total_duration > (v_total_threshold * 3600)) OR
        (approval_duration > (v_approval_threshold * 3600)) OR
        (execution_duration > (v_execution_threshold * 3600)),
        'Total time exceeded SLA threshold'
      INTO v_sla_breach, v_breach_reason;

      UPDATE request_flow_compliance
      SET sla_met = NOT v_sla_breach,
          sla_breach_reason = CASE WHEN v_sla_breach THEN v_breach_reason ELSE NULL END
      WHERE id = v_flow_id;
    END IF;

  ELSIF p_new_status = 'rejected' THEN
    UPDATE request_flow_compliance
    SET rejected_at = NOW(),
        current_status = p_new_status,
        updated_at = NOW()
    WHERE id = v_flow_id;
  END IF;

  RETURN v_flow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_request_id UUID DEFAULT NULL,
  p_chat_room_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id, activity_type, request_id, chat_room_id, metadata
  )
  VALUES (
    p_user_id, p_activity_type, p_request_id, p_chat_room_id, p_metadata
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_user_id UUID,
  p_item_id UUID,
  p_response JSONB,
  p_evidence_id UUID DEFAULT NULL
)
RETURNS TABLE(progress_id UUID, percentage DECIMAL) AS $$
DECLARE
  v_progress_id UUID;
  v_total INTEGER;
  v_completed INTEGER;
  v_percentage DECIMAL;
BEGIN
  -- Get or create progress record
  SELECT id INTO v_progress_id
  FROM user_onboarding_progress
  WHERE user_id = p_user_id;

  IF v_progress_id IS NULL THEN
    -- Create new progress record
    INSERT INTO user_onboarding_progress (user_id, status, started_at)
    VALUES (p_user_id, 'in_progress', NOW())
    RETURNING id INTO v_progress_id;
  END IF;

  -- Insert or update response
  INSERT INTO user_onboarding_responses (progress_id, item_id, response_value, evidence_id, is_complete)
  VALUES (v_progress_id, p_item_id, p_response, p_evidence_id, true)
  ON CONFLICT (progress_id, item_id)
  DO UPDATE SET
    response_value = EXCLUDED.response_value,
    evidence_id = EXCLUDED.evidence_id,
    is_complete = EXCLUDED.is_complete,
    completed_at = NOW();

  -- Calculate progress
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE is_complete = true)::INTEGER
  INTO v_total, v_completed
  FROM user_onboarding_responses
  WHERE progress_id = v_progress_id;

  v_percentage := CASE
    WHEN v_total > 0 THEN ROUND((v_completed::DECIMAL / v_total::DECIMAL) * 100, 2)
    ELSE 0
  END;

  -- Update progress record
  UPDATE user_onboarding_progress
  SET total_items = v_total,
      completed_items = v_completed,
      progress_percentage = v_percentage,
      status = CASE
        WHEN v_percentage >= 100 THEN 'completed'
        ELSE 'in_progress'
      END,
      completed_at = CASE
        WHEN v_percentage >= 100 THEN NOW()
        ELSE completed_at
      END,
      last_accessed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_progress_id;

  RETURN QUERY SELECT v_progress_id, v_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INITIAL DATA - DEFAULT TEMPLATES
-- =====================================================

-- Insert default onboarding templates
INSERT INTO onboarding_templates (name, description, tier, checklist_items, is_required) VALUES
(
  'Onboarding Básico de Usuario',
  'Checklist obligatorio para nuevos usuarios',
  'basic',
  '[
    {"title": "Revisar políticas de seguridad", "description": "Leer y aceptar políticas de seguridad de la empresa", "item_order": 1, "is_required": true, "evidence_required": true, "item_type": "signature"},
    {"title": "Completar perfil de usuario", "description": "Actualizar información personal y foto de perfil", "item_order": 2, "is_required": true, "evidence_required": false, "item_type": "checkbox"},
    {"title": "Tutorial de solicitud de servicios", "description": "Ver tutorial sobre cómo crear solicitudes", "item_order": 3, "is_required": true, "evidence_required": false, "item_type": "checkbox"},
    {"title": "Prueba de creación de solicitud", "description": "Crear una solicitud de prueba para verificar comprensión", "item_order": 4, "is_required": true, "evidence_required": true, "item_type": "file_upload"}
  ]'::jsonb,
  true
),
(
  'Onboarding de Supervisor',
  'Checklist avanzado para supervisores y aprobadores',
  'supervisor',
  '[
    {"title": "Certificación de aprobación de solicitudes", "description": "Completar módulo de aprobación y criterios de evaluación", "item_order": 1, "is_required": true, "evidence_required": true, "item_type": "signature"},
    {"title": "Capacitación en SLA y tiempos de respuesta", "description": "Revisar y aceptar tiempos de respuesta SLA", "item_order": 2, "is_required": true, "evidence_required": true, "item_type": "signature"},
    {"title": "Manejo de incumplimientos y excepciones", "description": "Tutorial sobre gestionar solicitudes que incumplen SLA", "item_order": 3, "is_required": true, "evidence_required": false, "item_type": "checkbox"},
    {"title": "Práctica de aprobación guiada", "description": "Completar 5 aprobaciones con supervisor principal", "item_order": 4, "is_required": true, "evidence_required": true, "item_type": "checklist"}
  ]'::jsonb,
  true
),
(
  'Onboarding de Administrador',
  'Checklist completo para administradores del sistema',
  'admin',
  '[
    {"title": "Certificación de administración de sistema", "description": "Completar certificación completa de administración", "item_order": 1, "is_required": true, "evidence_required": true, "item_type": "signature"},
    {"title": "Configuración de SLAs personalizados", "description": "Crear y configurar SLAs para diferentes tipos de solicitudes", "item_order": 2, "is_required": true, "evidence_required": true, "item_type": "file_upload"},
    {"title": "Gestión de usuarios y permisos", "description": "Demostrar creación y modificación de usuarios", "item_order": 3, "is_required": true, "evidence_required": true, "item_type": "checklist"},
    {"title": "Auditoría y reportes de cumplimiento", "description": "Generar reporte de auditoría mensual", "item_order": 4, "is_required": true, "evidence_required": true, "item_type": "file_upload"},
    {"title": "Plan de contingencia y recuperación", "description": "Documentar y aprobar plan de contingencia", "item_order": 5, "is_required": true, "evidence_required": true, "item_type": "signature"}
  ]'::jsonb,
  true
);

-- Insert default SLA definitions
INSERT INTO sla_definitions (name, description, approval_threshold_hours, execution_threshold_hours, total_threshold_hours, priority_level) VALUES
('SLA Estándar', 'Tiempos de respuesta normales', 24, 72, 96, 'normal'),
('SLA Urgente', 'Prioridad alta para solicitudes críticas', 4, 24, 48, 'high'),
('SLA Emergencia', 'Máxima prioridad para emergencias', 1, 8, 24, 'urgent'),
('SLA Baja Prioridad', 'Solicitudes no críticas', 48, 120, 168, 'low');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Success indicator
DO $$
BEGIN
  RAISE NOTICE 'Compliance system migration completed successfully!';
  RAISE NOTICE 'Tables created: request_flow_compliance, user_activity_log, compliance_evidence, onboarding_templates, compliance_checklist_items, user_onboarding_progress, user_onboarding_responses, digital_signatures, sla_definitions, request_sla_mapping';
  RAISE NOTICE 'Functions created: update_request_flow_status, log_user_activity, update_onboarding_progress';
  RAISE NOTICE 'Default templates: 3 onboarding templates (basic, supervisor, admin)';
  RAISE NOTICE 'Default SLAs: 4 definitions (standard, urgent, emergency, low)';
END $$;
