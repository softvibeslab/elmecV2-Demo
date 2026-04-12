import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  CheckCircle,
  Circle,
  FileText,
  Upload,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Home,
  UserCheck,
  Award,
  Loader2,
} from 'lucide-react-native';
import { useCompliance } from '@/contexts/ComplianceContext';
import { useAuth } from '@/contexts/AuthContext';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;
import { ComplianceEvidence } from './ComplianceEvidence';

interface OnboardingFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type OnboardingStep =
  | 'welcome'
  | 'checklist'
  | 'evidence'
  | 'signature'
  | 'completion';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { user } = useAuth();
  const {
    userOnboardingProgress,
    onboardingTemplates,
    loadingOnboarding,
    startOnboarding,
    completeOnboardingItem,
    fetchUserOnboardingProgress,
  } = useCompliance();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [textResponses, setTextResponses] = useState<Record<string, string>>(
    {}
  );
  const [completing, setCompleting] = useState(false);
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);

  // Get user tier
  const userTier =
    user?.rol === 'admin'
      ? 'admin'
      : user?.rol === 'supervisor'
        ? 'supervisor'
        : 'basic';

  // Get appropriate template
  const template = onboardingTemplates.find(t => t.tier === userTier);
  const items = template?.checklist_items || [];

  // Calculate progress
  const progress = userOnboardingProgress?.progress_percentage || 0;
  const currentItem = items[currentItemIndex];

  useEffect(() => {
    if (visible && !userOnboardingProgress) {
      initializeOnboarding();
    }
  }, [visible]);

  const initializeOnboarding = async () => {
    try {
      await startOnboarding();
      await fetchUserOnboardingProgress(user?.id || '');
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de onboarding');
    }
  };

  const handleStart = () => {
    setCurrentStep('checklist');
  };

  const handleNext = async () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      setCurrentStep('completion');
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleItemComplete = async (response: any) => {
    if (!currentItem?.id) return;

    try {
      setCompleting(true);

      await completeOnboardingItem(currentItem.id, response);

      // Move to next item after short delay
      setTimeout(() => {
        handleNext();
        setCompleting(false);
      }, 500);
    } catch (error) {
      console.error('Error completing item:', error);
      Alert.alert('Error', 'No se pudo completar el ítem');
      setCompleting(false);
    }
  };

  const handleCheckboxComplete = async () => {
    await handleItemComplete({
      checked: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleTextComplete = async () => {
    const response = textResponses[currentItem?.id || ''];
    if (!response.trim()) {
      Alert.alert('Validación', 'Por favor complete el campo requerido');
      return;
    }

    await handleItemComplete({
      text: response,
      timestamp: new Date().toISOString(),
    });
  };

  const handleFileComplete = () => {
    setEvidenceModalVisible(true);
  };

  const handleEvidenceSubmitted = async () => {
    setEvidenceModalVisible(false);
    await handleItemComplete({
      hasEvidence: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSignatureComplete = () => {
    setCurrentStep('signature');
  };

  const handleSignatureSubmit = async () => {
    // Signature will be handled by ComplianceEvidence component
    setCurrentStep('completion');
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      setCompleting(true);
      // Additional completion logic if needed
      onComplete?.();
      setTimeout(() => {
        setCompleting(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setCompleting(false);
    }
  };

  const renderWelcomeStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIcon}>
          <UserCheck size={64} color={colors.primary} />
        </View>

        <Text style={styles.welcomeTitle}>
          Bienvenido al Onboarding{' '}
          {userTier === 'basic'
            ? 'Básico'
            : userTier === 'supervisor'
              ? 'de Supervisor'
              : 'de Administrador'}
        </Text>

        <Text style={styles.welcomeDescription}>
          Este proceso te guiará a través de los pasos necesarios para completar
          tu perfil y comenzar a utilizar el sistema de manera efectiva.
        </Text>

        <View style={styles.welcomeStats}>
          <View style={styles.welcomeStat}>
            <FileText size={24} color={colors.primary} />
            <Text style={styles.welcomeStatValue}>{items.length}</Text>
            <Text style={styles.welcomeStatLabel}>Pasos</Text>
          </View>

          <View style={styles.welcomeStat}>
            <Award size={24} color={colors.warning} />
            <Text style={styles.welcomeStatValue}>
              {items.filter(i => i.is_required).length}
            </Text>
            <Text style={styles.welcomeStatLabel}>Requeridos</Text>
          </View>

          <View style={styles.welcomeStat}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.welcomeStatValue}>
              {Math.round((items.length * 10) / 60)}m
            </Text>
            <Text style={styles.welcomeStatLabel}>Duración Est.</Text>
          </View>
        </View>

        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeInfoTitle}>¿Qué incluye?</Text>
          <View style={styles.welcomeInfoList}>
            <Text style={styles.welcomeInfoItem}>• Revisión de políticas</Text>
            <Text style={styles.welcomeInfoItem}>
              • Configuración de perfil
            </Text>
            <Text style={styles.welcomeInfoItem}>
              • Tutorial de funcionalidades
            </Text>
            <Text style={styles.welcomeInfoItem}>• Firma de documentos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderChecklistStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Paso {currentItemIndex + 1} de {items.length}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((currentItemIndex / items.length) * 100)}%
          </Text>
        </View>

        <View style={styles.progressBarAndroid}>
          <View
            style={[
              styles.progressBarAndroidFill,
              {
                width: `${(currentItemIndex / items.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Current Item */}
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <View style={styles.itemNumber}>
            <Text style={styles.itemNumberText}>{currentItemIndex + 1}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{currentItem?.title}</Text>
            {currentItem?.description && (
              <Text style={styles.itemDescription}>
                {currentItem.description}
              </Text>
            )}
          </View>
          {currentItem?.is_required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Requerido</Text>
            </View>
          )}
        </View>

        {/* Item Type Specific Content */}
        {currentItem?.item_type === 'checkbox' && (
          <View style={styles.itemContent}>
            <TouchableOpacity
              style={styles.checkboxButton}
              onPress={handleCheckboxComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 size={24} color={colors.primary} />
              ) : (
                <>
                  <Circle size={24} color={colors.primary} />
                  <Text style={styles.checkboxButtonText}>
                    Confirmar completado
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentItem?.item_type === 'text_input' && (
          <View style={styles.itemContent}>
            <TextInput
              style={styles.textInput}
              placeholder="Ingrese su respuesta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={textResponses[currentItem?.id || ''] || ''}
              onChangeText={text =>
                setTextResponses(prev => ({
                  ...prev,
                  [currentItem?.id || '']: text,
                }))
              }
              editable={!completing}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.textSubmitButton}
              onPress={handleTextComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 size={20} color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.textSubmitButtonText}>
                    Enviar Respuesta
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentItem?.item_type === 'file_upload' && (
          <View style={styles.itemContent}>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={handleFileComplete}
              disabled={completing}
            >
              <Upload size={24} color="#ffffff" />
              <Text style={styles.fileButtonText}>Subir Evidencia</Text>
            </TouchableOpacity>

            {currentItem?.evidence_required && (
              <Text style={styles.evidenceRequiredText}>
                * Se requiere adjuntar archivo para continuar
              </Text>
            )}
          </View>
        )}

        {currentItem?.item_type === 'signature' && (
          <View style={styles.itemContent}>
            <Text style={styles.signatureDescription}>
              Por favor firme digitalmente para confirmar que ha leído y
              aceptado este requisito.
            </Text>

            <TouchableOpacity
              style={styles.signatureButton}
              onPress={handleSignatureComplete}
              disabled={completing}
            >
              <PenTool size={24} color="#ffffff" />
              <Text style={styles.signatureButtonText}>Abrir Pad de Firma</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderCompletionStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.completionContainer}>
        <View style={styles.completionIcon}>
          <CheckCircle size={80} color={colors.success} />
        </View>

        <Text style={styles.completionTitle}>¡Felicidades!</Text>

        <Text style={styles.completionDescription}>
          Has completado exitosamente el proceso de onboarding{' '}
          {userTier === 'basic'
            ? 'básico'
            : userTier === 'supervisor'
              ? 'de supervisor'
              : 'de administrador'}
          .
        </Text>

        <View style={styles.completionStats}>
          <View style={styles.completionStat}>
            <Text style={styles.completionStatValue}>{items.length}</Text>
            <Text style={styles.completionStatLabel}>Pasos Completados</Text>
          </View>

          <View style={styles.completionStat}>
            <Text style={styles.completionStatValue}>100%</Text>
            <Text style={styles.completionStatLabel}>Progreso</Text>
          </View>
        </View>

        <View style={styles.completionNextSteps}>
          <Text style={styles.completionNextStepsTitle}>Próximos Pasos</Text>
          <Text style={styles.completionNextStepsText}>
            • Ya puedes crear y gestionar solicitudes
          </Text>
          <Text style={styles.completionNextStepsText}>
            • Revisa el dashboard de cumplimiento periódicamente
          </Text>
          <Text style={styles.completionNextStepsText}>
            • Mantén tu información de perfil actualizada
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Home size={24} color={colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Onboarding</Text>
              <Text style={styles.headerSubtitle}>
                {currentStep === 'welcome' && 'Bienvenido'}
                {currentStep === 'checklist' &&
                  `Paso ${currentItemIndex + 1}/${items.length}`}
                {currentStep === 'completion' && 'Completado'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ChevronRight size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {currentStep === 'welcome' && renderWelcomeStep()}
        {currentStep === 'checklist' && renderChecklistStep()}
        {currentStep === 'completion' && renderCompletionStep()}

        {/* Footer Actions */}
        <View style={styles.footer}>
          {currentStep === 'welcome' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStart}
              disabled={loadingOnboarding}
            >
              {loadingOnboarding ? (
                <Loader2 size={20} color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Comenzar</Text>
                  <ChevronRight size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          )}

          {currentStep === 'checklist' && (
            <View style={styles.checklistActions}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  currentItemIndex === 0 && styles.secondaryButtonDisabled,
                ]}
                onPress={handlePrevious}
                disabled={currentItemIndex === 0 || completing}
              >
                <ChevronLeft size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Anterior</Text>
              </TouchableOpacity>

              {currentItem?.item_type !== 'file_upload' &&
                currentItem?.item_type !== 'signature' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNext}
                    disabled={completing}
                  >
                    {completing ? (
                      <Loader2 size={20} color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          {currentItemIndex < items.length - 1
                            ? 'Siguiente'
                            : 'Finalizar'}
                        </Text>
                        <ChevronRight size={20} color="#ffffff" />
                      </>
                    )}
                  </TouchableOpacity>
                )}
            </View>
          )}

          {currentStep === 'completion' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
              disabled={completing}
            >
              {completing ? (
                <Loader2 size={20} color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Ir al Dashboard</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Evidence Modal */}
        <ComplianceEvidence
          requestId="onboarding"
          visible={evidenceModalVisible}
          onClose={() => setEvidenceModalVisible(false)}
          onEvidenceSubmitted={handleEvidenceSubmitted}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  stepContent: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  checklistActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  welcomeContainer: {
    padding: 24,
    gap: 24,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeStats: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  welcomeStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  welcomeStatValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  welcomeStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  welcomeInfo: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  welcomeInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  welcomeInfoList: {
    gap: 8,
  },
  welcomeInfoItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  progressBar: {
    width: '100%',
    height: 4,
  },
  progressBarAndroid: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarAndroidFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  itemContainer: {
    padding: 16,
    gap: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  itemContent: {
    gap: 12,
  },
  checkboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkboxButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  textSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  textSubmitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  fileButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  evidenceRequiredText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    textAlign: 'center',
  },
  signatureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  signatureButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  completionContainer: {
    padding: 24,
    gap: 24,
    alignItems: 'center',
  },
  completionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  completionStats: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  completionStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  completionStatValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.success,
  },
  completionStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  completionNextSteps: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  completionNextStepsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  completionNextStepsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
