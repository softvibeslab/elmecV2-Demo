import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  FileText,
  MessageSquare,
  Users,
  CheckCircle,
  BarChart3,
  ClipboardCheck,
  Lightbulb,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;

const { width, height } = Dimensions.get('window');

interface AppTourGuideProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  feature: string;
  route?: string; // Nueva propiedad para navegación
  tips: string[];
  actionLabel?: string; // Texto del botón de acción
  mockup?: {
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'pending';
  }[];
}

export const AppTourGuide: React.FC<AppTourGuideProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Bienvenido a Elmec MFR',
      description:
        'Te guiaremos paso a paso por las principales funcionalidades de la aplicación',
      icon: Home,
      feature: 'Inicio',
      route: '/(tabs)',
      actionLabel: 'Comenzar Tour',
      tips: [
        'Conocerás cada sección de la app',
        'Podrás interactuar con cada funcionalidad',
        'Aprenderás a crear solicitudes y usar el chat',
      ],
    },
    {
      id: 'requests',
      title: 'Gestión de Solicitudes',
      description:
        'Crea y gestiona solicitudes de mantenimiento de forma sencilla',
      icon: FileText,
      feature: 'Solicitudes',
      route: '/(tabs)/requests',
      actionLabel: 'Ir a Solicitudes',
      tips: [
        'Crea solicitudes con fotos y documentos',
        'Rastrea el estado en tiempo real',
        'Filtra por zona, prioridad o estado',
        'Recibe notificaciones de actualizaciones',
      ],
      mockup: [
        {
          title: 'Mantenimiento HVAC',
          description: 'En progreso - Prioridad Alta',
          status: 'in-progress',
        },
        {
          title: 'Reparación Eléctrica',
          description: 'Pendiente - Urgente',
          status: 'pending',
        },
        {
          title: 'Instalación Servidores',
          description: 'Completado',
          status: 'completed',
        },
      ],
    },
    {
      id: 'chat',
      title: 'Chat en Tiempo Real',
      description: 'Comunícate instantáneamente con tu equipo',
      icon: MessageSquare,
      feature: 'Chat',
      route: '/(tabs)/chat',
      actionLabel: 'Ir al Chat',
      tips: [
        'Chats individuales y grupales',
        'Comparte archivos e imágenes',
        'Indicadores de mensaje leído',
        'Notificaciones push instantáneas',
      ],
      mockup: [
        {
          title: 'Coordinación Mantenimiento',
          description: '5 participantes - 12 mensajes',
          status: 'in-progress',
        },
        {
          title: 'Soporte Técnico',
          description: '3 participantes - Urgente',
          status: 'pending',
        },
      ],
    },
    {
      id: 'directory',
      title: 'Directorio de Usuarios',
      description: 'Encuentra y contacta a cualquier miembro del equipo',
      icon: Users,
      feature: 'Directorio',
      route: '/directory',
      actionLabel: 'Ir al Directorio',
      tips: [
        'Busca por nombre, zona o rol',
        'Ver información de contacto completa',
        'Inicia chat directamente',
        'Filtra por especialidad',
      ],
    },
    {
      id: 'compliance',
      title: 'Dashboard de Cumplimiento',
      description: 'Monitorea SLAs y métricas de rendimiento',
      icon: BarChart3,
      feature: 'Cumplimiento',
      actionLabel: 'Próximamente',
      tips: [
        'Vista general de todas las solicitudes',
        'Tasa de cumplimiento de SLA',
        'Tiempos promedio por etapa',
        'Actividad de usuarios',
      ],
      mockup: [
        {
          title: 'SLA Cumplido',
          description: '95% de solicitudes dentro del tiempo',
          status: 'completed',
        },
        {
          title: 'Tiempo Promedio',
          description: '4 horas para aprobación',
          status: 'completed',
        },
      ],
    },
    {
      id: 'evidence',
      title: 'Sistema de Evidencias',
      description: 'Adjunta documentos, firmas y checklists de verificación',
      icon: ClipboardCheck,
      feature: 'Evidencias',
      actionLabel: 'Próximamente',
      tips: [
        'Sube archivos desde galería o cámara',
        'Firmas digitales integradas',
        'Checklists de verificación',
        'Notas y observaciones',
      ],
    },
    {
      id: 'onboarding',
      title: 'Tu Progreso',
      description: 'Completa tu proceso de onboarding según tu rol',
      icon: CheckCircle,
      feature: 'Perfil',
      route: '/(tabs)/profile',
      actionLabel: 'Ir a Mi Perfil',
      tips: [
        'Básico: Para técnicos y operarios',
        'Supervisor: Para aprobadores y gerentes',
        'Admin: Para administradores del sistema',
        'Progreso guardado automáticamente',
      ],
    },
    {
      id: 'calculator',
      title: 'Calculadoras Industriales',
      description: 'Herramientas especializadas para cálculos técnicos',
      icon: Zap,
      feature: 'Calculadoras',
      route: '/(tabs)/calculator',
      actionLabel: 'Ir a Calculadoras',
      tips: [
        'Barrenado: Cálculos de perforación',
        'Fresado: Cálculos de mecanizado',
        'Resultados instantáneos',
        'Exporta resultados',
      ],
    },
    {
      id: 'tips',
      title: 'Consejos Útiles',
      description: 'Maximiza tu productividad con estos tips',
      icon: Lightbulb,
      feature: 'Tips',
      actionLabel: 'Finalizar',
      tips: [
        'Mantén tus datos de perfil actualizados',
        'Revisa el dashboard diariamente',
        'Responde rápido a los mensajes',
        'Completa tus onboarding tasks',
        'Usa checklists para seguimiento',
      ],
    },
  ];

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible, currentStep]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        animateIn();
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        animateIn();
      });
    }
  };

  const handleAction = () => {
    const step = tourSteps[currentStep];

    // Cerrar el tour
    onClose();
    onComplete?.();

    // Navegar a la ruta si existe
    if (step.route) {
      setTimeout(() => {
        router.push(step.route as any);
      }, 300);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const getCurrentStep = () => tourSteps[currentStep];
  const step = getCurrentStep();
  const Icon = step.icon;

  const getMockupColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return colors.warning;
      case 'pending':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getMockupIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={colors.success} />;
      case 'in-progress':
        return <Zap size={16} color={colors.warning} />;
      case 'pending':
        return <Zap size={16} color={colors.error} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} de {tourSteps.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.stepContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Icon size={64} color={colors.primary} />
              </View>

              {/* Title & Description */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.description}>{step.description}</Text>

                <View style={styles.featureBadge}>
                  <Text style={styles.featureText}>{step.feature}</Text>
                </View>
              </View>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Consejos:</Text>
                {step.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Mockup Data */}
              {step.mockup && step.mockup.length > 0 && (
                <View style={styles.mockupContainer}>
                  <Text style={styles.mockupTitle}>📋 Ejemplos:</Text>
                  {step.mockup.map((item, index) => (
                    <View key={index} style={styles.mockupItem}>
                      <View style={styles.mockupHeader}>
                        {getMockupIcon(item.status)}
                        <View style={styles.mockupInfo}>
                          <Text style={styles.mockupItemTitle}>
                            {item.title}
                          </Text>
                          <Text style={styles.mockupItemDescription}>
                            {item.description}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.mockupStatusBadge,
                            { backgroundColor: getMockupColor(item.status) },
                          ]}
                        >
                          <Text style={styles.mockupStatusText}>
                            {item.status === 'completed'
                              ? '✓'
                              : item.status === 'in-progress'
                                ? '⚡'
                                : '⏳'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Feature Highlight */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightIcon}>✨</Text>
                <Text style={styles.highlightText}>
                  {currentStep === tourSteps.length - 1
                    ? '¡Estás listo para usar la aplicación!'
                    : step.route
                      ? `Haz clic en "${step.actionLabel}" para explorar esta sección`
                      : 'Continúa explorando para descubrir más funciones'}
                </Text>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {/* Action Button - Primary */}
            {step.actionLabel && step.id !== 'welcome' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAction}
              >
                <Text style={styles.actionButtonText}>{step.actionLabel}</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.previousButton,
                  currentStep === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft
                  size={20}
                  color={
                    currentStep === 0 ? colors.textSecondary : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.navButtonText,
                    currentStep === 0 && styles.navButtonTextDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                {tourSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentStep && styles.dotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                <Text style={styles.navButtonText}>
                  {currentStep === tourSteps.length - 1
                    ? 'Finalizar'
                    : 'Siguiente'}
                </Text>
                {currentStep < tourSteps.length - 1 && (
                  <ChevronRight size={20} color={colors.primary} />
                )}
                {currentStep === tourSteps.length - 1 && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.primary,
    gap: 16,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 24,
  },
  stepContent: {
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  textContainer: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  tipsContainer: {
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  mockupContainer: {
    gap: 12,
  },
  mockupTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  mockupItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mockupInfo: {
    flex: 1,
    gap: 4,
  },
  mockupItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  mockupItemDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  mockupStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupStatusText: {
    fontSize: 16,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.primary}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  highlightIcon: {
    fontSize: 24,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  previousButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
