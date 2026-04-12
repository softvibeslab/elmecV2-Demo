import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Building2,
  Wrench,
  Zap,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;

interface MockupScreensProps {
  onNavigate?: (screen: string) => void;
}

export const MockupScreens: React.FC<MockupScreensProps> = ({ onNavigate }) => {
  const incompleteFeatures = [
    {
      id: 'facilities',
      title: 'Gestión de Instalaciones',
      description: 'Administra edificios, plantas y ubicaciones físicas',
      icon: Building2,
      status: 'pending',
      priority: 'high',
      progress: 0,
      tasks: [
        'Mapa de instalaciones',
        'Gestión de espacios',
        'Planos digitales',
      ],
    },
    {
      id: 'inventory',
      title: 'Inventario de Herramientas',
      description: 'Controla herramientas, equipos y materiales',
      icon: Wrench,
      status: 'in-progress',
      priority: 'medium',
      progress: 60,
      tasks: [
        'Catálogo de herramientas',
        'Asignación a técnicos',
        'Mantenimiento de equipos',
      ],
    },
    {
      id: 'energy',
      title: 'Monitor de Energía',
      description: 'Seguimiento de consumo eléctrico en tiempo real',
      icon: Zap,
      status: 'pending',
      priority: 'low',
      progress: 20,
      tasks: [
        'Medidores inteligentes',
        'Alertas de consumo',
        'Reportes de eficiencia',
      ],
    },
    {
      id: 'settings',
      title: 'Configuración Avanzada',
      description: 'Personalización del sistema y preferencias',
      icon: Settings,
      status: 'in-progress',
      priority: 'medium',
      progress: 45,
      tasks: ['Perfiles de usuario', 'Notificaciones', 'Temas y apariencia'],
    },
    {
      id: 'scheduling',
      title: 'Calendario de Turnos',
      description: 'Gestión de horarios y asignaciones de personal',
      icon: Clock,
      status: 'pending',
      priority: 'high',
      progress: 0,
      tasks: [
        'Calendario mensual',
        'Asignación de turnos',
        'Solicitudes de cambio',
      ],
    },
    {
      id: 'reports',
      title: 'Reportes y Análisis',
      description: 'Estadísticas detalladas y exportación de datos',
      icon: CheckCircle,
      status: 'in-progress',
      priority: 'medium',
      progress: 70,
      tasks: ['Reportes PDF', 'Exportación Excel', 'Gráficos avanzados'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return colors.warning;
      case 'pending':
        return colors.textSecondary;
      default:
        return colors.border;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in-progress':
        return 'En Desarrollo';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: '#fef2f2',
          color: colors.error,
          label: 'Alta',
        };
      case 'medium':
        return {
          backgroundColor: '#fefce8',
          color: colors.warning,
          label: 'Media',
        };
      case 'low':
        return {
          backgroundColor: '#f0fdf4',
          color: colors.success,
          label: 'Baja',
        };
      default:
        return {
          backgroundColor: colors.background,
          color: colors.textSecondary,
          label: 'Normal',
        };
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AlertTriangle size={24} color={colors.warning} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Flujos en Desarrollo</Text>
          <Text style={styles.headerDescription}>
            Estas funcionalidades están siendo desarrolladas
          </Text>
        </View>
      </View>

      {incompleteFeatures.map(feature => {
        const Icon = feature.icon;
        const priorityBadge = getPriorityBadge(feature.priority);

        return (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => onNavigate?.(feature.id)}
            activeOpacity={0.7}
          >
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Icon size={32} color={colors.primary} />
              </View>

              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(feature.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(feature.status)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            {feature.progress > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Progreso</Text>
                  <Text style={styles.progressValue}>{feature.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${feature.progress}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Tasks List */}
            <View style={styles.tasksContainer}>
              <Text style={styles.tasksTitle}>Tareas:</Text>
              {feature.tasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View
                    style={[
                      styles.taskBullet,
                      index < (feature.progress / 100) * feature.tasks.length &&
                        styles.taskBulletComplete,
                    ]}
                  />
                  <Text
                    style={[
                      styles.taskText,
                      index < (feature.progress / 100) * feature.tasks.length &&
                        styles.taskTextComplete,
                    ]}
                  >
                    {task}
                  </Text>
                </View>
              ))}
            </View>

            {/* Priority Badge */}
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityBadge.backgroundColor },
              ]}
            >
              <Text
                style={[styles.priorityText, { color: priorityBadge.color }]}
              >
                Prioridad: {priorityBadge.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Estas funcionalidades estarán disponibles en próximas
          actualizaciones
        </Text>
      </View>
    </ScrollView>
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
    padding: 20,
    backgroundColor: colors.surface,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  featureCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  progressContainer: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  tasksContainer: {
    gap: 8,
  },
  tasksTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  taskBulletComplete: {
    backgroundColor: colors.success,
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  taskTextComplete: {
    color: colors.textPrimary,
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
