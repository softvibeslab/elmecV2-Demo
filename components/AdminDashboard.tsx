import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  FileText,
  MessageCircle,
  TrendingUp,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
  ChartPie as PieChart,
  Activity,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  pendingRequests: number;
  resolvedRequests: number;
  totalMessages: number;
  avgResponseTime: number;
  satisfactionRate: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    resolvedRequests: 0,
    totalMessages: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Mock data - En producción esto vendría de la API
  useEffect(() => {
    const mockStats: DashboardStats = {
      totalUsers: 156,
      activeUsers: 89,
      totalRequests: 342,
      pendingRequests: 23,
      resolvedRequests: 298,
      totalMessages: 1247,
      avgResponseTime: 2.4,
      satisfactionRate: 4.6,
    };

    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  const requestsChartData: ChartData[] = useMemo(
    () => [
      { label: 'Resueltas', value: stats.resolvedRequests, color: '#10b981' },
      {
        label: 'En proceso',
        value:
          stats.totalRequests - stats.resolvedRequests - stats.pendingRequests,
        color: '#3b82f6',
      },
      { label: 'Pendientes', value: stats.pendingRequests, color: '#f59e0b' },
    ],
    [stats.resolvedRequests, stats.totalRequests, stats.pendingRequests]
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }> = React.memo(({ title, value, subtitle, icon, color, trend }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          {React.cloneElement(
            icon as React.ReactElement,
            { size: 24, color } as any
          )}
        </View>
        {trend && (
          <View
            style={[
              styles.trendContainer,
              { backgroundColor: trend.isPositive ? '#ecfdf5' : '#fef2f2' },
            ]}
          >
            <TrendingUp
              size={12}
              color={trend.isPositive ? '#10b981' : '#ef4444'}
              style={{
                transform: [{ rotate: trend.isPositive ? '0deg' : '180deg' }],
              }}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? '#10b981' : '#ef4444' },
              ]}
            >
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  ));

  const SimpleChart: React.FC<{ data: ChartData[] }> = React.memo(
    ({ data }) => {
      const maxValue = useMemo(
        () => Math.max(...data.map(d => d.value)),
        [data]
      );

      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribución de Solicitudes</Text>
          <View style={styles.chartBars}>
            {data.map((item, index) => (
              <View key={index} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      backgroundColor: item.color,
                      height: (item.value / maxValue) * 100,
                    },
                  ]}
                />
                <Text style={styles.chartBarLabel}>{item.label}</Text>
                <Text style={styles.chartBarValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
  );

  if (user?.rol !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <AlertTriangle size={64} color="#ef4444" />
          <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
          <Text style={styles.accessDeniedText}>
            No tienes permisos para acceder al panel de administración
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel de Administración</Text>
          <Text style={styles.subtitle}>Dashboard ejecutivo - ELMEC</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['24h', '7d', '30d', '90d'].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} activos`}
            icon={<Users />}
            color="#3b82f6"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Solicitudes"
            value={stats.totalRequests}
            subtitle={`${stats.pendingRequests} pendientes`}
            icon={<FileText />}
            color="#10b981"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Mensajes"
            value={stats.totalMessages}
            subtitle="Total enviados"
            icon={<MessageCircle />}
            color="#f59e0b"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Tiempo Respuesta"
            value={`${stats.avgResponseTime}h`}
            subtitle="Promedio"
            icon={<Clock />}
            color="#8b5cf6"
            trend={{ value: 5, isPositive: false }}
          />
        </View>

        {/* Charts Section */}
        <View style={styles.chartsSection}>
          <SimpleChart data={requestsChartData} />

          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Métricas Clave</Text>
            <View style={styles.metricsList}>
              <View style={styles.metricItem}>
                <CheckCircle size={20} color="#10b981" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Tasa de Resolución</Text>
                  <Text style={styles.metricValue}>
                    {(
                      (stats.resolvedRequests / stats.totalRequests) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Activity size={20} color="#3b82f6" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Satisfacción Cliente</Text>
                  <Text style={styles.metricValue}>
                    {stats.satisfactionRate}/5.0
                  </Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <TrendingUp size={20} color="#f59e0b" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Usuarios Activos</Text>
                  <Text style={styles.metricValue}>
                    {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Users size={20} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Gestionar Usuarios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FileText size={20} color="#10b981" />
              <Text style={styles.actionButtonText}>Ver Solicitudes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <BarChart3 size={20} color="#f59e0b" />
              <Text style={styles.actionButtonText}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  periodButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  chartsSection: {
    paddingHorizontal: 24,
    gap: 24,
    marginBottom: 32,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    gap: 8,
  },
  chartBar: {
    width: 40,
    borderRadius: 4,
    minHeight: 20,
  },
  chartBarLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  chartBarValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  metricsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  metricsList: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
