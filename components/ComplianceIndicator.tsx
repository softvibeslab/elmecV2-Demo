import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCompliance } from '@/contexts/ComplianceContext';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react-native';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;

interface ComplianceIndicatorProps {
  requestId: string;
  compact?: boolean;
  onPress?: () => void;
  style?: any;
}

export const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  requestId,
  compact = false,
  onPress,
  style,
}) => {
  const { requestFlowData, loadingRequestFlow, fetchRequestFlowCompliance } =
    useCompliance();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRequestFlowCompliance(requestId);
  }, [requestId]);

  if (!mounted || loadingRequestFlow || !requestFlowData) {
    return null;
  }

  const getStatusIcon = () => {
    if (requestFlowData.current_status === 'completed') {
      return <CheckCircle size={compact ? 16 : 20} color={colors.success} />;
    }
    if (requestFlowData.current_status === 'rejected') {
      return <AlertTriangle size={compact ? 16 : 20} color={colors.error} />;
    }
    if (requestFlowData.current_status === 'in_progress') {
      return <Clock size={compact ? 16 : 20} color={colors.info} />;
    }
    return <Clock size={compact ? 16 : 20} color={colors.warning} />;
  };

  const getStatusText = () => {
    switch (requestFlowData.current_status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'in_progress':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  };

  const getSLAStatus = () => {
    if (requestFlowData.current_status === 'completed') {
      return requestFlowData.sla_met ? 'SLA Cumplido' : 'SLA Excedido';
    }
    return null;
  };

  const slaStatus = getSLAStatus();

  const content = (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        requestFlowData.sla_met === false && styles.containerBreach,
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getStatusIcon()}</View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.statusText, compact && styles.statusTextCompact]}
          >
            {getStatusText()}
          </Text>

          {slaStatus && !compact && (
            <Text
              style={[
                styles.slaText,
                requestFlowData.sla_met ? styles.slaMet : styles.slaBreach,
              ]}
            >
              {slaStatus}
            </Text>
          )}

          {!compact &&
            requestFlowData.current_status === 'in_progress' &&
            requestFlowData.total_duration && (
              <Text style={styles.durationText}>
                {Math.round(requestFlowData.total_duration / 3600)}h
                transcurridas
              </Text>
            )}
        </View>

        {!compact && (
          <TouchableOpacity
            style={styles.detailButton}
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FileText size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (onPress && !compact) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompact: {
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  containerBreach: {
    borderColor: colors.error,
    backgroundColor: '#fef2f2',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  statusTextCompact: {
    fontSize: 12,
  },
  slaText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  slaMet: {
    color: colors.success,
  },
  slaBreach: {
    color: colors.error,
  },
  durationText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  detailButton: {
    padding: 4,
  },
});
