import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface RequestFlowCompliance {
  id: string;
  request_id: string;
  current_status:
    | 'pending'
    | 'approved'
    | 'in_progress'
    | 'completed'
    | 'rejected';
  pending_at: string;
  approved_at: string | null;
  in_progress_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  pending_duration: number | null;
  approval_duration: number | null;
  execution_duration: number | null;
  total_duration: number | null;
  sla_met: boolean;
  sla_breach_reason: string | null;
  approved_by: string | null;
  executed_by: string | null;
  completed_by: string | null;
  notes: string | null;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type:
    | 'login'
    | 'logout'
    | 'file_upload'
    | 'message_sent'
    | 'request_created'
    | 'request_approved'
    | 'request_completed'
    | 'evidence_added'
    | 'checklist_completed'
    | 'signature_added';
  request_id: string | null;
  chat_room_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  platform: string | null;
  created_at: string;
}

export interface ComplianceEvidence {
  id: string;
  request_id: string;
  submitted_by: string;
  evidence_type: 'file' | 'signature' | 'checklist' | 'note';
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  signature_data: Record<string, any> | null;
  signature_ip: string | null;
  signature_timestamp: string | null;
  checklist_id: string | null;
  checklist_response: Record<string, any> | null;
  note_text: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  tier: 'basic' | 'supervisor' | 'admin';
  checklist_items: ChecklistItem[];
  is_required: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id?: string;
  title: string;
  description: string;
  item_order: number;
  is_required: boolean;
  evidence_required: boolean;
  item_type: 'checkbox' | 'file_upload' | 'signature' | 'text_input';
}

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  template_id: string | null;
  total_items: number;
  completed_items: number;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  approval_threshold_hours: number;
  execution_threshold_hours: number;
  total_threshold_hours: number;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
}

export interface ComplianceDashboard {
  requestFlowStats: {
    total: number;
    pending: number;
    approved: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
  slaCompliance: {
    total: number;
    met: number;
    breached: number;
    complianceRate: number;
  };
  userActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    topUsers: Array<{ user_id: string; activityCount: number }>;
  };
  averageDurations: {
    approvalHours: number;
    executionHours: number;
    totalHours: number;
  };
}

// =====================================================
// CONTEXT TYPE
// =====================================================

interface ComplianceContextType {
  // Request Flow Compliance
  requestFlowData: RequestFlowCompliance | null;
  loadingRequestFlow: boolean;
  fetchRequestFlowCompliance: (requestId: string) => Promise<void>;
  updateRequestFlowStatus: (
    requestId: string,
    status: string,
    userId: string
  ) => Promise<void>;

  // User Activity
  userActivityLogs: UserActivityLog[];
  loadingActivity: boolean;
  fetchUserActivity: (userId?: string, limit?: number) => Promise<void>;
  logActivity: (
    activityType: string,
    metadata?: Record<string, any>,
    requestId?: string,
    chatRoomId?: string
  ) => Promise<void>;

  // Evidence
  complianceEvidence: ComplianceEvidence[];
  loadingEvidence: boolean;
  fetchComplianceEvidence: (requestId: string) => Promise<void>;
  submitEvidence: (evidenceData: Partial<ComplianceEvidence>) => Promise<void>;

  // Onboarding
  onboardingTemplates: OnboardingTemplate[];
  userOnboardingProgress: UserOnboardingProgress | null;
  loadingOnboarding: boolean;
  fetchOnboardingTemplates: () => Promise<void>;
  fetchUserOnboardingProgress: (userId: string) => Promise<void>;
  startOnboarding: () => Promise<void>;
  completeOnboardingItem: (
    itemId: string,
    response: any,
    evidenceId?: string
  ) => Promise<void>;

  // SLA
  slaDefinitions: SLADefinition[];
  loadingSLA: boolean;
  fetchSLADefinitions: () => Promise<void>;

  // Dashboard
  dashboardData: ComplianceDashboard | null;
  loadingDashboard: boolean;
  fetchDashboardData: () => Promise<void>;

  // Digital Signatures
  submitDigitalSignature: (
    entityType: string,
    entityId: string,
    signatureBase64: string,
    legalText?: string
  ) => Promise<void>;
}

// =====================================================
// CONTEXT
// =====================================================

const ComplianceContext = createContext<ComplianceContextType | undefined>(
  undefined
);

// =====================================================
// PROVIDER COMPONENT
// =====================================================

interface ComplianceProviderProps {
  children: ReactNode;
}

export const ComplianceProvider: React.FC<ComplianceProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();

  // State
  const [requestFlowData, setRequestFlowData] =
    useState<RequestFlowCompliance | null>(null);
  const [loadingRequestFlow, setLoadingRequestFlow] = useState(false);

  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>(
    []
  );
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [complianceEvidence, setComplianceEvidence] = useState<
    ComplianceEvidence[]
  >([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const [onboardingTemplates, setOnboardingTemplates] = useState<
    OnboardingTemplate[]
  >([]);
  const [userOnboardingProgress, setUserOnboardingProgress] =
    useState<UserOnboardingProgress | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  const [slaDefinitions, setSlaDefinitions] = useState<SLADefinition[]>([]);
  const [loadingSLA, setLoadingSLA] = useState(false);

  const [dashboardData, setDashboardData] =
    useState<ComplianceDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // =====================================================
  // REQUEST FLOW COMPLIANCE
  // =====================================================

  const fetchRequestFlowCompliance = useCallback(
    async (requestId: string) => {
      if (!user) return;

      setLoadingRequestFlow(true);
      try {
        const { data, error } = await supabase
          .from('request_flow_compliance')
          .select('*')
          .eq('request_id', requestId)
          .single();

        if (error) throw error;
        setRequestFlowData(data);
      } catch (error) {
        console.error('Error fetching request flow compliance:', error);
      } finally {
        setLoadingRequestFlow(false);
      }
    },
    [user]
  );

  const updateRequestFlowStatus = useCallback(
    async (requestId: string, status: string, userId: string) => {
      try {
        const { data, error } = await supabase.rpc(
          'update_request_flow_status',
          {
            p_request_id: requestId,
            p_new_status: status,
            p_user_id: userId,
          }
        );

        if (error) throw error;

        // Log activity
        await logActivity(`request_${status}`, { requestId }, requestId);

        // Refresh data
        await fetchRequestFlowCompliance(requestId);
      } catch (error) {
        console.error('Error updating request flow status:', error);
        throw error;
      }
    },
    [fetchRequestFlowCompliance]
  );

  // =====================================================
  // USER ACTIVITY
  // =====================================================

  const fetchUserActivity = useCallback(
    async (userId?: string, limit: number = 50) => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      setLoadingActivity(true);
      try {
        const { data, error } = await supabase
          .from('user_activity_log')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setUserActivityLogs(data || []);
      } catch (error) {
        console.error('Error fetching user activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    },
    [user]
  );

  const logActivity = useCallback(
    async (
      activityType: string,
      metadata: Record<string, any> = {},
      requestId?: string,
      chatRoomId?: string
    ) => {
      if (!user) return;

      try {
        const { error } = await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: activityType,
          p_request_id: requestId || null,
          p_chat_room_id: chatRoomId || null,
          p_metadata: metadata,
        });

        if (error) throw error;
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    },
    [user]
  );

  // =====================================================
  // EVIDENCE
  // =====================================================

  const fetchComplianceEvidence = useCallback(async (requestId: string) => {
    setLoadingEvidence(true);
    try {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplianceEvidence(data || []);
    } catch (error) {
      console.error('Error fetching compliance evidence:', error);
    } finally {
      setLoadingEvidence(false);
    }
  }, []);

  const submitEvidence = useCallback(
    async (evidenceData: Partial<ComplianceEvidence>) => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('compliance_evidence')
          .insert({
            ...evidenceData,
            submitted_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await logActivity(
          'evidence_added',
          { evidenceType: evidenceData.evidence_type },
          evidenceData.request_id
        );

        return data;
      } catch (error) {
        console.error('Error submitting evidence:', error);
        throw error;
      }
    },
    [user, logActivity]
  );

  // =====================================================
  // ONBOARDING
  // =====================================================

  const fetchOnboardingTemplates = useCallback(async () => {
    setLoadingOnboarding(true);
    try {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOnboardingTemplates(data || []);
    } catch (error) {
      console.error('Error fetching onboarding templates:', error);
      // Load default templates if Supabase fails
      const defaultTemplates = [
        {
          id: 'basic-default',
          name: 'Onboarding Básico',
          description: 'Proceso de inducción para técnicos y operarios',
          tier: 'basic' as const,
          is_required: true,
          valid_from: new Date().toISOString(),
          valid_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          checklist_items: [
            {
              id: 'basic-1',
              title: 'Bienvenida',
              description: 'Revisión de información general de la empresa',
              item_order: 1,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'basic-2',
              title: 'Políticas de Seguridad',
              description: 'Confirmar lectura de políticas de seguridad',
              item_order: 2,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'basic-3',
              title: 'Configuración de Perfil',
              description: 'Completar información personal',
              item_order: 3,
              item_type: 'text_input' as const,
              is_required: true,
            },
            {
              id: 'basic-4',
              title: 'Firma de Documentos',
              description: 'Firmar acuerdo de confidencialidad',
              item_order: 4,
              item_type: 'signature' as const,
              is_required: true,
            },
          ],
        },
        {
          id: 'supervisor-default',
          name: 'Onboarding de Supervisor',
          description: 'Proceso de inducción para supervisores y gerentes',
          tier: 'supervisor' as const,
          is_required: true,
          valid_from: new Date().toISOString(),
          valid_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          checklist_items: [
            {
              id: 'sup-1',
              title: 'Introducción al Rol',
              description: 'Descripción de responsabilidades como supervisor',
              item_order: 1,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'sup-2',
              title: 'Sistema de Aprobaciones',
              description: 'Tutorial del flujo de aprobaciones',
              item_order: 2,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'sup-3',
              title: 'Métricas y Reportes',
              description: 'Acceso a dashboard de cumplimiento',
              item_order: 3,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'sup-4',
              title: 'Firma de Responsabilidad',
              description: 'Acuerdo de manejo de información sensible',
              item_order: 4,
              item_type: 'signature' as const,
              is_required: true,
            },
          ],
        },
        {
          id: 'admin-default',
          name: 'Onboarding de Administrador',
          description: 'Proceso de inducción para administradores del sistema',
          tier: 'admin' as const,
          is_required: true,
          valid_from: new Date().toISOString(),
          valid_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          checklist_items: [
            {
              id: 'admin-1',
              title: 'Visión General del Sistema',
              description: 'Arquitectura y componentes del sistema',
              item_order: 1,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'admin-2',
              title: 'Gestión de Usuarios',
              description: 'Creación y administración de usuarios',
              item_order: 2,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'admin-3',
              title: 'Configuración de Cumplimiento',
              description: 'Setup de SLAs y políticas',
              item_order: 3,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'admin-4',
              title: 'Reportes Avanzados',
              description: 'Acceso a reportes y analytics',
              item_order: 4,
              item_type: 'checkbox' as const,
              is_required: true,
            },
            {
              id: 'admin-5',
              title: 'Firma de Administrador',
              description: 'Acuerdo de responsabilidades de admin',
              item_order: 5,
              item_type: 'signature' as const,
              is_required: true,
            },
          ],
        },
      ];
      setOnboardingTemplates(defaultTemplates);
    } finally {
      setLoadingOnboarding(false);
    }
  }, []);

  const fetchUserOnboardingProgress = useCallback(async (userId: string) => {
    setLoadingOnboarding(true);
    try {
      const { data, error } = await supabase
        .from('user_onboarding_progress')
        .select('*, onboarding_templates(*)')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is ok
        throw error;
      }
      setUserOnboardingProgress(data);
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
    } finally {
      setLoadingOnboarding(false);
    }
  }, []);

  const startOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      // Determine tier based on user role (using user.rol instead of user_metadata)
      const tier =
        user?.rol === 'admin'
          ? 'admin'
          : user?.rol === 'supervisor'
            ? 'supervisor'
            : 'basic';

      // Try to get template from Supabase
      let template;
      try {
        const { data: templates } = await supabase
          .from('onboarding_templates')
          .select('*')
          .eq('tier', tier)
          .eq('is_required', true)
          .limit(1);

        if (templates && templates.length > 0) {
          template = templates[0];
        }
      } catch (supabaseError) {
        console.warn('Could not fetch template from Supabase, using local');
      }

      // Fallback to local template
      if (!template) {
        template = onboardingTemplates.find(t => t.tier === tier);
        if (!template) {
          throw new Error('No onboarding template found for user tier');
        }
      }

      // Try to create progress record in Supabase
      let progressData;
      try {
        const { data, error } = await supabase
          .from('user_onboarding_progress')
          .insert({
            user_id: user.id,
            template_id: template.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        progressData = data;
      } catch (supabaseError) {
        console.warn('Could not create progress in Supabase, using local');
        // Create local progress object
        progressData = {
          id: `local-${Date.now()}`,
          user_id: user.id,
          template_id: template.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          completed_items: [],
        };
      }

      setUserOnboardingProgress(progressData);
      await logActivity('checklist_completed', {
        action: 'onboarding_started',
      });

      return progressData;
    } catch (error) {
      console.error('Error starting onboarding:', error);
      throw error;
    }
  }, [user, logActivity, onboardingTemplates]);

  const completeOnboardingItem = useCallback(
    async (itemId: string, response: any, evidenceId?: string) => {
      if (!user || !userOnboardingProgress) return;

      try {
        // Try Supabase RPC function
        try {
          const { data, error } = await supabase.rpc(
            'update_onboarding_progress',
            {
              p_user_id: user.id,
              p_item_id: itemId,
              p_response: response,
              p_evidence_id: evidenceId || null,
            }
          );

          if (error) throw error;

          // Refresh progress
          await fetchUserOnboardingProgress(user.id);

          return data;
        } catch (supabaseError) {
          console.warn('Could not update progress in Supabase, using local');
          // Update local progress
          const updatedProgress = {
            ...userOnboardingProgress,
            completed_items: [
              ...(userOnboardingProgress.completed_items || []),
              {
                item_id: itemId,
                response,
                evidence_id: evidenceId,
                completed_at: new Date().toISOString(),
              },
            ],
          };
          setUserOnboardingProgress(updatedProgress);
          return updatedProgress;
        }
      } catch (error) {
        console.error('Error completing onboarding item:', error);
        throw error;
      }
    },
    [user, userOnboardingProgress, fetchUserOnboardingProgress]
  );

  // =====================================================
  // SLA DEFINITIONS
  // =====================================================

  const fetchSLADefinitions = useCallback(async () => {
    setLoadingSLA(true);
    try {
      const { data, error } = await supabase
        .from('sla_definitions')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: false });

      if (error) throw error;
      setSlaDefinitions(data || []);
    } catch (error) {
      console.error('Error fetching SLA definitions:', error);
    } finally {
      setLoadingSLA(false);
    }
  }, []);

  // =====================================================
  // DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      // Fetch request flow stats
      const { data: flowData, error: flowError } = await supabase
        .from('request_flow_compliance')
        .select('current_status');

      if (flowError) throw flowError;

      const requestFlowStats = {
        total: flowData?.length || 0,
        pending:
          flowData?.filter(f => f.current_status === 'pending').length || 0,
        approved:
          flowData?.filter(f => f.current_status === 'approved').length || 0,
        in_progress:
          flowData?.filter(f => f.current_status === 'in_progress').length || 0,
        completed:
          flowData?.filter(f => f.current_status === 'completed').length || 0,
        rejected:
          flowData?.filter(f => f.current_status === 'rejected').length || 0,
      };

      // Fetch SLA compliance
      const { data: slaData, error: slaError } = await supabase
        .from('request_flow_compliance')
        .select('sla_met');

      if (slaError) throw slaError;

      const slaMet = slaData?.filter(s => s.sla_met).length || 0;
      const slaBreach = slaData?.filter(s => !s.sla_met).length || 0;

      const slaCompliance = {
        total: slaData?.length || 0,
        met: slaMet,
        breached: slaBreach,
        complianceRate:
          slaData && slaData.length > 0 ? (slaMet / slaData.length) * 100 : 0,
      };

      // Fetch user activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_log')
        .select('user_id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activityError) throw activityError;

      // Calculate user activity stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - today.getDay());

      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const userActivity = {
        today:
          activityData?.filter(a => new Date(a.created_at) >= today).length ||
          0,
        thisWeek:
          activityData?.filter(a => new Date(a.created_at) >= thisWeek)
            .length || 0,
        thisMonth:
          activityData?.filter(a => new Date(a.created_at) >= thisMonth)
            .length || 0,
        topUsers: [], // Can be enhanced with aggregation query
      };

      // Calculate average durations
      const { data: durationData, error: durationError } = await supabase
        .from('request_flow_compliance')
        .select('approval_duration, execution_duration, total_duration')
        .eq('current_status', 'completed');

      if (durationError) throw durationError;

      const avgDurations = {
        approvalHours:
          durationData && durationData.length > 0
            ? durationData.reduce(
                (sum, d) => sum + (d.approval_duration || 0),
                0
              ) /
              durationData.length /
              3600
            : 0,
        executionHours:
          durationData && durationData.length > 0
            ? durationData.reduce(
                (sum, d) => sum + (d.execution_duration || 0),
                0
              ) /
              durationData.length /
              3600
            : 0,
        totalHours:
          durationData && durationData.length > 0
            ? durationData.reduce(
                (sum, d) => sum + (d.total_duration || 0),
                0
              ) /
              durationData.length /
              3600
            : 0,
      };

      setDashboardData({
        requestFlowStats,
        slaCompliance,
        userActivity,
        averageDurations: avgDurations,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // =====================================================
  // DIGITAL SIGNATURES
  // =====================================================

  const submitDigitalSignature = useCallback(
    async (
      entityType: string,
      entityId: string,
      signatureBase64: string,
      legalText?: string
    ) => {
      if (!user) return;

      try {
        const { error } = await supabase.from('digital_signatures').insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          signature_base64: signatureBase64,
          legal_text: legalText,
          agreed_to_terms: true,
          device_info: {
            platform: Platform.OS,
            userAgent: navigator.userAgent,
          },
        });

        if (error) throw error;

        // Log activity
        await logActivity('signature_added', { entityType, entityId });

        return true;
      } catch (error) {
        console.error('Error submitting digital signature:', error);
        throw error;
      }
    },
    [user, logActivity]
  );

  // =====================================================
  // AUTO-LOAD DATA ON MOUNT
  // =====================================================

  useEffect(() => {
    if (user) {
      fetchOnboardingTemplates();
      fetchSLADefinitions();
      fetchUserOnboardingProgress(user.id);
      fetchUserActivity(user.id, 20);
    }
  }, [user, fetchOnboardingTemplates, fetchSLADefinitions, fetchUserActivity]);

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value: ComplianceContextType = {
    // Request Flow
    requestFlowData,
    loadingRequestFlow,
    fetchRequestFlowCompliance,
    updateRequestFlowStatus,

    // User Activity
    userActivityLogs,
    loadingActivity,
    fetchUserActivity,
    logActivity,

    // Evidence
    complianceEvidence,
    loadingEvidence,
    fetchComplianceEvidence,
    submitEvidence,

    // Onboarding
    onboardingTemplates,
    userOnboardingProgress,
    loadingOnboarding,
    fetchOnboardingTemplates,
    fetchUserOnboardingProgress,
    startOnboarding,
    completeOnboardingItem,

    // SLA
    slaDefinitions,
    loadingSLA,
    fetchSLADefinitions,

    // Dashboard
    dashboardData,
    loadingDashboard,
    fetchDashboardData,

    // Digital Signatures
    submitDigitalSignature,
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
};

// =====================================================
// CUSTOM HOOK
// =====================================================

export const useCompliance = (): ComplianceContextType => {
  const context = useContext(ComplianceContext);
  if (context === undefined) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};
