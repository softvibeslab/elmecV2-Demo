import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useCompliance } from '@/contexts/ComplianceContext';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  Award,
  BarChart3,
} from 'lucide-react-native';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;

const { width } = Dimensions.get('window');

interface ComplianceDashboardProps {
  onRequestDetail?: (requestId: string) => void;
  onUserDetail?: (userId: string) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  onRequestDetail,
  onUserDetail,
}) => {
  const {
    dashboardData,
    loadingDashboard,
    fetchDashboardData,
    slaDefinitions,
  } = useCompliance();

  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'sla' | 'activity'
  >('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    return `${Math.round(hours / 24)}d`;
  };

  if (loadingDashboard || !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <FileText size={32} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Dashboard de Cumplimiento</Text>
          <Text style={styles.headerSubtitle}>
            Monitoreo de flujos, SLAs y actividad
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <BarChart3
            size={18}
            color={
              selectedTab === 'overview' ? '#ffffff' : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'overview' && styles.tabTextActive,
            ]}
          >
            Resumen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'sla' && styles.tabActive]}
          onPress={() => setSelectedTab('sla')}
        >
          <Award
            size={18}
            color={selectedTab === 'sla' ? '#ffffff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'sla' && styles.tabTextActive,
            ]}
          >
            SLA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'activity' && styles.tabActive]}
          onPress={() => setSelectedTab('activity')}
        >
          <Activity
            size={18}
            color={
              selectedTab === 'activity' ? '#ffffff' : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'activity' && styles.tabTextActive,
            ]}
          >
            Actividad
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Request Flow Stats */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Estado de Solicitudes</Text>
              <FileText size={20} color={colors.primary} />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {dashboardData.requestFlowStats.total}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={[styles.statCard, styles.statCardPending]}>
                <Clock size={24} color={colors.warning} />
                <Text style={styles.statValue}>
                  {dashboardData.requestFlowStats.pending}
                </Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>

              <View style={[styles.statCard, styles.statCardProgress]}>
                <TrendingUp size={24} color={colors.info} />
                <Text style={styles.statValue}>
                  {dashboardData.requestFlowStats.in_progress}
                </Text>
                <Text style={styles.statLabel}>En Proceso</Text>
              </View>

              <View style={[styles.statCard, styles.statCardCompleted]}>
                <CheckCircle size={24} color={colors.success} />
                <Text style={styles.statValue}>
                  {dashboardData.requestFlowStats.completed}
                </Text>
                <Text style={styles.statLabel}>Completadas</Text>
              </View>

              <View style={[styles.statCard, styles.statCardRejected]}>
                <XCircle size={24} color={colors.error} />
                <Text style={styles.statValue}>
                  {dashboardData.requestFlowStats.rejected}
                </Text>
                <Text style={styles.statLabel}>Rechazadas</Text>
              </View>
            </View>
          </View>

          {/* Average Durations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Tiempos Promedio</Text>
              <Clock size={20} color={colors.primary} />
            </View>

            <View style={styles.durationList}>
              <View style={styles.durationItem}>
                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>Aprobación</Text>
                  <Text style={styles.durationValue}>
                    {formatDuration(
                      dashboardData.averageDurations.approvalHours
                    )}
                  </Text>
                </View>
                <View style={styles.durationBar}>
                  <View
                    style={[
                      styles.durationBarFill,
                      {
                        width: `${Math.min(
                          (dashboardData.averageDurations.approvalHours / 24) *
                            100,
                          100
                        )}%`,
                        backgroundColor: colors.info,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.durationItem}>
                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>Ejecución</Text>
                  <Text style={styles.durationValue}>
                    {formatDuration(
                      dashboardData.averageDurations.executionHours
                    )}
                  </Text>
                </View>
                <View style={styles.durationBar}>
                  <View
                    style={[
                      styles.durationBarFill,
                      {
                        width: `${Math.min(
                          (dashboardData.averageDurations.executionHours / 72) *
                            100,
                          100
                        )}%`,
                        backgroundColor: colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.durationItem}>
                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>Total</Text>
                  <Text style={styles.durationValue}>
                    {formatDuration(dashboardData.averageDurations.totalHours)}
                  </Text>
                </View>
                <View style={styles.durationBar}>
                  <View
                    style={[
                      styles.durationBarFill,
                      {
                        width: `${Math.min(
                          (dashboardData.averageDurations.totalHours / 96) *
                            100,
                          100
                        )}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* User Activity Summary */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Actividad de Usuarios</Text>
              <Users size={20} color={colors.primary} />
            </View>

            <View style={styles.activityGrid}>
              <View style={styles.activityCard}>
                <Text style={styles.activityValue}>
                  {dashboardData.userActivity.today}
                </Text>
                <Text style={styles.activityLabel}>Hoy</Text>
              </View>

              <View style={styles.activityCard}>
                <Text style={styles.activityValue}>
                  {dashboardData.userActivity.thisWeek}
                </Text>
                <Text style={styles.activityLabel}>Esta Semana</Text>
              </View>

              <View style={styles.activityCard}>
                <Text style={styles.activityValue}>
                  {dashboardData.userActivity.thisMonth}
                </Text>
                <Text style={styles.activityLabel}>Este Mes</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* SLA Tab */}
      {selectedTab === 'sla' && (
        <View style={styles.tabContent}>
          {/* SLA Compliance Overview */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Cumplimiento de SLA</Text>
              <Award size={20} color={colors.primary} />
            </View>

            <View style={styles.slaOverview}>
              <View style={styles.slaCircleContainer}>
                <View
                  style={[
                    styles.slaCircle,
                    {
                      borderColor:
                        dashboardData.slaCompliance.complianceRate >= 80
                          ? colors.success
                          : dashboardData.slaCompliance.complianceRate >= 60
                            ? colors.warning
                            : colors.error,
                    },
                  ]}
                >
                  <Text style={styles.slaPercentage}>
                    {Math.round(dashboardData.slaCompliance.complianceRate)}%
                  </Text>
                  <Text style={styles.slaLabel}>Tasa de Cumplimiento</Text>
                </View>
              </View>

              <View style={styles.slaStats}>
                <View style={styles.slaStatItem}>
                  <CheckCircle size={20} color={colors.success} />
                  <View style={styles.slaStatInfo}>
                    <Text style={styles.slaStatValue}>
                      {dashboardData.slaCompliance.met}
                    </Text>
                    <Text style={styles.slaStatLabel}>SLAs Cumplidos</Text>
                  </View>
                </View>

                <View style={styles.slaStatItem}>
                  <XCircle size={20} color={colors.error} />
                  <View style={styles.slaStatInfo}>
                    <Text style={styles.slaStatValue}>
                      {dashboardData.slaCompliance.breached}
                    </Text>
                    <Text style={styles.slaStatLabel}>SLAs Incumplidos</Text>
                  </View>
                </View>

                <View style={styles.slaStatItem}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <View style={styles.slaStatInfo}>
                    <Text style={styles.slaStatValue}>
                      {dashboardData.slaCompliance.total}
                    </Text>
                    <Text style={styles.slaStatLabel}>Total SLAs</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* SLA Definitions */}
          {slaDefinitions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Definiciones de SLA</Text>
                <FileText size={20} color={colors.primary} />
              </View>

              {slaDefinitions.map(sla => (
                <View key={sla.id} style={styles.slaDefinitionCard}>
                  <View style={styles.slaDefinitionHeader}>
                    <Text style={styles.slaDefinitionName}>{sla.name}</Text>
                    <View
                      style={[
                        styles.slaPriorityBadge,
                        {
                          backgroundColor:
                            sla.priority_level === 'urgent'
                              ? colors.error
                              : sla.priority_level === 'high'
                                ? colors.warning
                                : sla.priority_level === 'normal'
                                  ? colors.info
                                  : colors.textSecondary,
                        },
                      ]}
                    >
                      <Text style={styles.slaPriorityText}>
                        {sla.priority_level.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.slaDefinitionDescription}>
                    {sla.description}
                  </Text>

                  <View style={styles.slaThresholds}>
                    <View style={styles.slaThresholdItem}>
                      <Text style={styles.slaThresholdLabel}>Aprobación</Text>
                      <Text style={styles.slaThresholdValue}>
                        {sla.approval_threshold_hours}h
                      </Text>
                    </View>

                    <View style={styles.slaThresholdItem}>
                      <Text style={styles.slaThresholdLabel}>Ejecución</Text>
                      <Text style={styles.slaThresholdValue}>
                        {sla.execution_threshold_hours}h
                      </Text>
                    </View>

                    <View style={styles.slaThresholdItem}>
                      <Text style={styles.slaThresholdLabel}>Total</Text>
                      <Text style={styles.slaThresholdValue}>
                        {sla.total_threshold_hours}h
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Activity Tab */}
      {selectedTab === 'activity' && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Métricas de Actividad</Text>
              <Activity size={20} color={colors.primary} />
            </View>

            <View style={styles.activitySummary}>
              <View style={styles.activityMetric}>
                <Text style={styles.activityMetricValue}>
                  {dashboardData.userActivity.today}
                </Text>
                <Text style={styles.activityMetricLabel}>Acciones Hoy</Text>
              </View>

              <View style={styles.activityMetric}>
                <Text style={styles.activityMetricValue}>
                  {dashboardData.userActivity.thisWeek}
                </Text>
                <Text style={styles.activityMetricLabel}>Esta Semana</Text>
              </View>

              <View style={styles.activityMetric}>
                <Text style={styles.activityMetricValue}>
                  {dashboardData.userActivity.thisMonth}
                </Text>
                <Text style={styles.activityMetricLabel}>Este Mes</Text>
              </View>
            </View>

            {dashboardData.userActivity.topUsers.length > 0 && (
              <View style={styles.topUsersSection}>
                <Text style={styles.topUsersTitle}>Usuarios Más Activos</Text>
                {dashboardData.userActivity.topUsers.map((user, index) => (
                  <TouchableOpacity
                    key={user.user_id}
                    style={styles.topUserItem}
                    onPress={() => onUserDetail?.(user.user_id)}
                  >
                    <Text style={styles.topUserRank}>#{index + 1}</Text>
                    <Text style={styles.topUserId}>{user.user_id}</Text>
                    <Text style={styles.topUserCount}>
                      {user.activityCount} acciones
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    backgroundColor: colors.background,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 32 - 48) / 2,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statCardPending: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statCardProgress: {
    borderWidth: 1,
    borderColor: colors.info,
  },
  statCardCompleted: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  statCardRejected: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  durationList: {
    gap: 16,
  },
  durationItem: {
    gap: 8,
  },
  durationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  durationValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  durationBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  durationBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  activityCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  activityValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
  },
  activityLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  slaOverview: {
    gap: 24,
  },
  slaCircleContainer: {
    alignItems: 'center',
  },
  slaCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  slaPercentage: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  slaLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  slaStats: {
    gap: 16,
  },
  slaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  slaStatInfo: {
    flex: 1,
  },
  slaStatValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  slaStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  slaDefinitionCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  slaDefinitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaDefinitionName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  slaPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  slaPriorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  slaDefinitionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  slaThresholds: {
    flexDirection: 'row',
    gap: 16,
  },
  slaThresholdItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 4,
  },
  slaThresholdLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  slaThresholdValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  activitySummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  activityMetric: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  activityMetricValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
  },
  activityMetricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topUsersSection: {
    gap: 8,
  },
  topUsersTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  topUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  topUserRank: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    width: 24,
  },
  topUserId: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  topUserCount: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
});
