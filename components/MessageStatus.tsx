import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react-native';

type MessageStatusType = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: MessageStatusType;
  size?: number;
  showLabel?: boolean;
}

/**
 * Componente de estado de entrega de mensajes estilo WhatsApp
 *
 * Estados:
 * - pending: Reloj (enviando)
 * - sent: Un check gris (enviado al servidor)
 * - delivered: Dos checks grises (entregado al destinatario)
 * - read: Dos checks azules (leido por el destinatario)
 * - failed: Icono de error rojo (fallo en el envio)
 */
export default function MessageStatus({
  status,
  size = 16,
  showLabel = false,
}: MessageStatusProps) {
  const renderStatus = () => {
    switch (status) {
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <Clock size={size} color="#9ca3af" />
          </View>
        );

      case 'sent':
        return (
          <View style={styles.statusContainer}>
            <Check size={size} color="#9ca3af" />
          </View>
        );

      case 'delivered':
        return (
          <View style={styles.statusContainer}>
            <CheckCheck size={size} color="#9ca3af" />
          </View>
        );

      case 'read':
        return (
          <View style={styles.statusContainer}>
            <CheckCheck size={size} color="#3b82f6" />
          </View>
        );

      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <AlertCircle size={size} color="#ef4444" />
          </View>
        );

      default:
        return null;
    }
  };

  return renderStatus();
}

/**
 * Componente de envio en progreso con spinner
 */
export function SendingIndicator({ size = 14 }: { size?: number }) {
  return (
    <View style={styles.sendingContainer}>
      <ActivityIndicator size="small" color="#9ca3af" />
    </View>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingContainer: {
    marginLeft: 4,
    transform: [{ scale: 0.8 }],
  },
});
