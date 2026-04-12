/**
 * Tipos para el sistema de cumplimiento
 * Estas tablas no están en el schema generado por Supabase aún
 */

export interface RequestFlowCompliance {
  id: string;
  request_id: string;
  current_status:
    | 'pendiente'
    | 'en_aprobacion'
    | 'aprobado'
    | 'en_proceso'
    | 'completado'
    | 'rechazado';
  approval_duration?: number;
  execution_duration?: number;
  total_duration?: number;
  sla_met: boolean;
  sla_breach_reason?: string;
  updated_at: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: any;
  request_id?: string;
  chat_room_id?: string;
  created_at: string;
}

export interface ComplianceEvidence {
  id: string;
  entity_type: 'request' | 'chat' | 'user';
  entity_id: string;
  evidence_type: 'file' | 'signature' | 'checklist' | 'note';
  file_url?: string;
  file_name?: string;
  signature_base64?: string;
  checklist_items?: any[];
  notes?: string;
  submitted_by: string;
  created_at: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  tier: 'basic' | 'supervisor' | 'admin';
  items: any[];
  is_active: boolean;
  created_at: string;
}

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  template_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_items: any[];
  started_at: string;
  completed_at?: string;
}

export interface DigitalSignature {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  signature_base64: string;
  legal_text?: string;
  agreed_to_terms: boolean;
  device_info: any;
  created_at: string;
}

export interface SlaDefinition {
  id: string;
  request_type: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  approval_threshold_hours: number;
  execution_threshold_hours: number;
  total_threshold_hours: number;
  is_active: boolean;
  created_at: string;
}

// Extend Database types
export interface ComplianceTables {
  request_flow_compliance: RequestFlowCompliance;
  user_activity_log: UserActivityLog;
  compliance_evidence: ComplianceEvidence;
  onboarding_templates: OnboardingTemplate;
  user_onboarding_progress: UserOnboardingProgress;
  digital_signatures: DigitalSignature;
  sla_definitions: SlaDefinition;
}
