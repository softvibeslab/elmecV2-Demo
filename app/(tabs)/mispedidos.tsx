import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  X,
  Box,
  Building2,
  PackageCheck,
  AlertCircle,
  Calendar,
  Hash,
  DollarSign,
  FileText,
} from 'lucide-react-native';

// Tipos para pedidos
interface OrderTrackingStep {
  id: string;
  title: string;
  description: string;
  date: string | null;
  completed: boolean;
  current: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pendiente' | 'confirmado' | 'en_produccion' | 'enviado' | 'en_transito' | 'entregado' | 'cancelado';
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress: string;
  trackingSteps: OrderTrackingStep[];
}

// Datos de demostración
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'PED-2024-001547',
    date: '2024-12-05',
    status: 'en_transito',
    total: 45780.00,
    trackingNumber: 'MX123456789',
    estimatedDelivery: '2024-12-12',
    shippingAddress: 'Av. Industrial 1234, Monterrey, NL',
    items: [
      { id: '1', name: 'Fresa de Carburo 10mm', quantity: 5, price: 2500, sku: 'FC-10MM-001' },
      { id: '2', name: 'Inserto CNMG 120408', quantity: 20, price: 850, sku: 'INS-CNMG-408' },
      { id: '3', name: 'Portaherramientas MCLNR', quantity: 2, price: 8900, sku: 'PH-MCLNR-01' },
    ],
    trackingSteps: [
      { id: '1', title: 'Pedido Recibido', description: 'Tu pedido ha sido recibido y está siendo procesado', date: '2024-12-05 09:30', completed: true, current: false },
      { id: '2', title: 'Pedido Confirmado', description: 'Pago verificado, pedido confirmado', date: '2024-12-05 14:15', completed: true, current: false },
      { id: '3', title: 'En Producción', description: 'Tu pedido está siendo preparado', date: '2024-12-06 08:00', completed: true, current: false },
      { id: '4', title: 'Enviado', description: 'Tu pedido ha salido de nuestro almacén', date: '2024-12-08 16:45', completed: true, current: false },
      { id: '5', title: 'En Tránsito', description: 'En camino a tu dirección - Última ubicación: Saltillo, Coahuila', date: '2024-12-10 11:20', completed: true, current: true },
      { id: '6', title: 'Entregado', description: 'Pedido entregado', date: null, completed: false, current: false },
    ],
  },
  {
    id: '2',
    orderNumber: 'PED-2024-001532',
    date: '2024-12-01',
    status: 'entregado',
    total: 23450.00,
    trackingNumber: 'MX987654321',
    estimatedDelivery: '2024-12-08',
    shippingAddress: 'Blvd. Díaz Ordaz 500, Monterrey, NL',
    items: [
      { id: '1', name: 'Broca HSS 8mm', quantity: 10, price: 450, sku: 'BR-HSS-8MM' },
      { id: '2', name: 'Machuelo M10x1.5', quantity: 5, price: 1200, sku: 'MAC-M10-15' },
      { id: '3', name: 'Aceite de Corte 20L', quantity: 2, price: 4500, sku: 'AC-CORTE-20' },
    ],
    trackingSteps: [
      { id: '1', title: 'Pedido Recibido', description: 'Tu pedido ha sido recibido', date: '2024-12-01 10:00', completed: true, current: false },
      { id: '2', title: 'Pedido Confirmado', description: 'Pago verificado', date: '2024-12-01 15:30', completed: true, current: false },
      { id: '3', title: 'En Producción', description: 'Preparando pedido', date: '2024-12-02 09:00', completed: true, current: false },
      { id: '4', title: 'Enviado', description: 'Salió del almacén', date: '2024-12-04 14:00', completed: true, current: false },
      { id: '5', title: 'En Tránsito', description: 'En camino', date: '2024-12-06 08:30', completed: true, current: false },
      { id: '6', title: 'Entregado', description: 'Recibido por: Juan Pérez', date: '2024-12-07 11:45', completed: true, current: true },
    ],
  },
  {
    id: '3',
    orderNumber: 'PED-2024-001558',
    date: '2024-12-10',
    status: 'en_produccion',
    total: 67890.00,
    estimatedDelivery: '2024-12-18',
    shippingAddress: 'Carr. Nacional 2500, Guadalupe, NL',
    items: [
      { id: '1', name: 'Centro de Maquinado Vertical', quantity: 1, price: 55000, sku: 'CMV-500-01' },
      { id: '2', name: 'Kit de Instalación', quantity: 1, price: 8500, sku: 'KIT-INST-01' },
      { id: '3', name: 'Capacitación (horas)', quantity: 8, price: 548.75, sku: 'CAP-HRS' },
    ],
    trackingSteps: [
      { id: '1', title: 'Pedido Recibido', description: 'Tu pedido ha sido recibido', date: '2024-12-10 08:15', completed: true, current: false },
      { id: '2', title: 'Pedido Confirmado', description: 'Anticipo recibido, pedido confirmado', date: '2024-12-10 16:00', completed: true, current: false },
      { id: '3', title: 'En Producción', description: 'Equipo en proceso de configuración y pruebas', date: '2024-12-11 09:00', completed: true, current: true },
      { id: '4', title: 'Enviado', description: 'Pendiente', date: null, completed: false, current: false },
      { id: '5', title: 'En Tránsito', description: 'Pendiente', date: null, completed: false, current: false },
      { id: '6', title: 'Entregado', description: 'Pendiente', date: null, completed: false, current: false },
    ],
  },
  {
    id: '4',
    orderNumber: 'PED-2024-001545',
    date: '2024-12-03',
    status: 'pendiente',
    total: 12300.00,
    estimatedDelivery: '2024-12-15',
    shippingAddress: 'Av. Universidad 1000, San Nicolás, NL',
    items: [
      { id: '1', name: 'Calibrador Digital 150mm', quantity: 3, price: 2800, sku: 'CAL-DIG-150' },
      { id: '2', name: 'Micrómetro 0-25mm', quantity: 2, price: 1950, sku: 'MIC-025-01' },
    ],
    trackingSteps: [
      { id: '1', title: 'Pedido Recibido', description: 'Pedido recibido, pendiente de pago', date: '2024-12-03 14:30', completed: true, current: true },
      { id: '2', title: 'Pedido Confirmado', description: 'Esperando confirmación de pago', date: null, completed: false, current: false },
      { id: '3', title: 'En Producción', description: 'Pendiente', date: null, completed: false, current: false },
      { id: '4', title: 'Enviado', description: 'Pendiente', date: null, completed: false, current: false },
      { id: '5', title: 'En Tránsito', description: 'Pendiente', date: null, completed: false, current: false },
      { id: '6', title: 'Entregado', description: 'Pendiente', date: null, completed: false, current: false },
    ],
  },
];

const getStatusConfig = (status: Order['status']) => {
  switch (status) {
    case 'pendiente':
      return { color: '#f59e0b', bgColor: '#fef3c7', icon: Clock, text: 'Pendiente de Pago' };
    case 'confirmado':
      return { color: '#3b82f6', bgColor: '#dbeafe', icon: CheckCircle, text: 'Confirmado' };
    case 'en_produccion':
      return { color: '#8b5cf6', bgColor: '#ede9fe', icon: Box, text: 'En Producción' };
    case 'enviado':
      return { color: '#06b6d4', bgColor: '#cffafe', icon: Package, text: 'Enviado' };
    case 'en_transito':
      return { color: '#22c55e', bgColor: '#dcfce7', icon: Truck, text: 'En Tránsito' };
    case 'entregado':
      return { color: '#10b981', bgColor: '#d1fae5', icon: PackageCheck, text: 'Entregado' };
    case 'cancelado':
      return { color: '#ef4444', bgColor: '#fee2e2', icon: AlertCircle, text: 'Cancelado' };
    default:
      return { color: '#6b7280', bgColor: '#f3f4f6', icon: Package, text: 'Desconocido' };
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Componente de Timeline de Tracking
const TrackingTimeline = ({ steps }: { steps: OrderTrackingStep[] }) => {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={step.id} style={styles.timelineItem}>
            {/* Línea conectora */}
            {!isLast && (
              <View
                style={[
                  styles.timelineLine,
                  step.completed ? styles.timelineLineCompleted : styles.timelineLinePending,
                ]}
              />
            )}

            {/* Círculo indicador */}
            <View
              style={[
                styles.timelineCircle,
                step.completed ? styles.timelineCircleCompleted : styles.timelineCirclePending,
                step.current && styles.timelineCircleCurrent,
              ]}
            >
              {step.completed ? (
                <CheckCircle size={16} color="#ffffff" />
              ) : (
                <View style={styles.timelineCircleInner} />
              )}
            </View>

            {/* Contenido */}
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineTitle,
                  step.current && styles.timelineTitleCurrent,
                  !step.completed && !step.current && styles.timelineTitlePending,
                ]}
              >
                {step.title}
              </Text>
              <Text
                style={[
                  styles.timelineDescription,
                  !step.completed && !step.current && styles.timelineDescriptionPending,
                ]}
              >
                {step.description}
              </Text>
              {step.date && (
                <Text style={styles.timelineDate}>{step.date}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// Modal de Detalle de Pedido
const OrderDetailModal = ({
  order,
  visible,
  onClose,
}: {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Detalle del Pedido</Text>
            <Text style={styles.modalOrderNumber}>{order.orderNumber}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Estado actual */}
          <View style={[styles.statusBanner, { backgroundColor: statusConfig.bgColor }]}>
            <StatusIcon size={32} color={statusConfig.color} />
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
              {order.estimatedDelivery && order.status !== 'entregado' && (
                <Text style={styles.statusBannerSubtext}>
                  Entrega estimada: {formatDate(order.estimatedDelivery)}
                </Text>
              )}
            </View>
          </View>

          {/* Información del pedido */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información del Pedido</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.infoLabel}>Fecha:</Text>
                <Text style={styles.infoValue}>{formatDate(order.date)}</Text>
              </View>
              <View style={styles.infoItem}>
                <DollarSign size={16} color="#6b7280" />
                <Text style={styles.infoLabel}>Total:</Text>
                <Text style={styles.infoValueBold}>{formatCurrency(order.total)}</Text>
              </View>
              {order.trackingNumber && (
                <View style={styles.infoItem}>
                  <Hash size={16} color="#6b7280" />
                  <Text style={styles.infoLabel}>Guía:</Text>
                  <Text style={styles.infoValue}>{order.trackingNumber}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.infoLabel}>Envío:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{order.shippingAddress}</Text>
              </View>
            </View>
          </View>

          {/* Timeline de tracking */}
          <View style={styles.trackingSection}>
            <Text style={styles.sectionTitle}>Seguimiento del Pedido</Text>
            <TrackingTimeline steps={order.trackingSteps} />
          </View>

          {/* Productos */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Productos ({order.items.length})</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.productItem}>
                <View style={styles.productIcon}>
                  <Box size={20} color="#6b7280" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productSku}>SKU: {item.sku}</Text>
                </View>
                <View style={styles.productPricing}>
                  <Text style={styles.productQuantity}>x{item.quantity}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total del Pedido</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          {/* Acciones */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton}>
              <FileText size={20} color="#1e40af" />
              <Text style={styles.actionButtonText}>Descargar Factura</Text>
            </TouchableOpacity>
            {order.status === 'pendiente' && (
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
                <DollarSign size={20} color="#ffffff" />
                <Text style={styles.actionButtonTextPrimary}>Realizar Pago</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function MisPedidos() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredOrders = filterStatus
    ? MOCK_ORDERS.filter(order => order.status === filterStatus)
    : MOCK_ORDERS;

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const statusFilters = [
    { key: null, label: 'Todos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'en_produccion', label: 'En Producción' },
    { key: 'en_transito', label: 'En Tránsito' },
    { key: 'entregado', label: 'Entregados' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <OrderDetailModal
        order={selectedOrder}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
      />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Mis Pedidos</Text>
            <Text style={styles.subtitle}>
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Package size={28} color="#1e40af" />
          </View>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key || 'all'}
            style={[
              styles.filterChip,
              filterStatus === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de pedidos */}
      <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          const currentStep = order.trackingSteps.find(step => step.current);

          return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <StatusIcon size={14} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.text}
                  </Text>
                </View>
              </View>

              {/* Mini tracking visual */}
              <View style={styles.miniTracking}>
                {order.trackingSteps.slice(0, 6).map((step, index) => (
                  <React.Fragment key={step.id}>
                    <View
                      style={[
                        styles.miniTrackingDot,
                        step.completed && styles.miniTrackingDotCompleted,
                        step.current && styles.miniTrackingDotCurrent,
                      ]}
                    />
                    {index < 5 && (
                      <View
                        style={[
                          styles.miniTrackingLine,
                          step.completed && styles.miniTrackingLineCompleted,
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {currentStep && (
                <View style={styles.currentStepInfo}>
                  <Truck size={16} color="#6b7280" />
                  <Text style={styles.currentStepText} numberOfLines={1}>
                    {currentStep.description}
                  </Text>
                </View>
              )}

              <View style={styles.orderFooter}>
                <View style={styles.orderItems}>
                  <Box size={14} color="#6b7280" />
                  <Text style={styles.orderItemsText}>
                    {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Total:</Text>
                  <Text style={styles.orderTotalValue}>{formatCurrency(order.total)}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No hay pedidos</Text>
            <Text style={styles.emptySubtitle}>
              No tienes pedidos con el filtro seleccionado
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  orderList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  miniTracking: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  miniTrackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
  },
  miniTrackingDotCompleted: {
    backgroundColor: '#22c55e',
  },
  miniTrackingDotCurrent: {
    backgroundColor: '#3b82f6',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  miniTrackingLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  miniTrackingLineCompleted: {
    backgroundColor: '#22c55e',
  },
  currentStepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  currentStepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderItemsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  orderTotal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginRight: 8,
  },
  orderTotalLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  orderTotalValue: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  modalOrderNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  statusBannerContent: {
    flex: 1,
  },
  statusBannerText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  statusBannerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    marginTop: 2,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  infoGrid: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  infoValueBold: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  trackingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 70,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 28,
    bottom: -28,
    width: 2,
  },
  timelineLineCompleted: {
    backgroundColor: '#22c55e',
  },
  timelineLinePending: {
    backgroundColor: '#e5e7eb',
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  timelineCircleCompleted: {
    backgroundColor: '#22c55e',
  },
  timelineCirclePending: {
    backgroundColor: '#e5e7eb',
  },
  timelineCircleCurrent: {
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -2,
  },
  timelineCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  timelineTitleCurrent: {
    color: '#3b82f6',
  },
  timelineTitlePending: {
    color: '#9ca3af',
  },
  timelineDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 2,
  },
  timelineDescriptionPending: {
    color: '#d1d5db',
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  productsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  productIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  productPricing: {
    alignItems: 'flex-end',
  },
  productQuantity: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#1e40af',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
});
