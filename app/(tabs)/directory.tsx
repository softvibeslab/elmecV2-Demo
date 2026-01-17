import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChat } from '@/hooks/useChat';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/supabase';
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  Send,
  MapPin,
  Users,
} from 'lucide-react-native';

export default function Directory() {
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { createChatRoom } = useChat();
  const { sendDemoNotification } = useNotifications();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const categories = [
    'Todos',
    'Agentes de venta',
    'Servicio al Cliente',
    'Soporte Técnico',
  ];
  const zones = ['Todas', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste'];

  useEffect(() => {
    loadPersonnel();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [personnel, searchQuery, selectedCategory, selectedZone]);

  const loadPersonnel = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los usuarios activos
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error loading personnel:', error);
        setError(`Error al cargar el directorio: ${error.message}`);
        return;
      }

      // Filtrar el usuario actual en el frontend
      const filteredData = ((data as User[]) || []).filter(
        (person: User) => person.id !== currentUser?.id
      );
      setPersonnel(filteredData);
    } catch (error) {
      console.error('Error loading personnel:', error);
      setError(
        `Error al cargar el directorio: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = personnel;

    // Filtrar por búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(person => {
        const fullName = [person.nombre, person.apellido_paterno, person.apellido_materno]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const email = person.correo_electronico.toLowerCase();
        const empresa = person.empresa.toLowerCase();

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          empresa.includes(query)
        );
      });
    }

    // Filtrar por categoría
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(
        person => person.categoria === selectedCategory
      );
    }

    // Filtrar por zona
    if (selectedZone !== 'Todas') {
      filtered = filtered.filter(person => person.zona === selectedZone);
    }

    setFilteredPersonnel(filtered);
  };

  const getFullName = (person: User): string => {
    const parts = [person.nombre, person.apellido_paterno, person.apellido_materno].filter(Boolean);
    return parts.join(' ').trim();
  };

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl).then(supported => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'No se puede realizar la llamada');
      }
    });
  };

  const handleEmail = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el cliente de correo');
      }
    });
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp no está instalado');
      }
    });
  };

  const handleStartChat = async (person: User) => {
    try {
      const roomId = await createChatRoom(person.id, getFullName(person));
      router.push(`/chat/${roomId}`);

      await sendDemoNotification(
        'Chat iniciado',
        `Conversación iniciada con ${getFullName(person)}`,
        'success'
      );
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  const handleSendRequest = (person: User) => {
    router.push({
      pathname: '/(tabs)/requests',
      params: { selectedAgent: person.id.toString() },
    });
  };

  // Mapa de fotos de vendedores
  // NOTA: Las fotos deben descargarse de Google Drive y colocarse en assets/images/vendors/
  // Link: https://drive.google.com/drive/folders/1WOi5J9gcRSCnmIQoWVntFLR29HTwmcMX
  const vendorPhotos: { [key: string]: any } = {
    // Descomentar las líneas cuando las fotos estén disponibles:
    // 'i.pineda': require('@/assets/images/vendors/i.pineda.jpg'),
    // 'j.gonzalez': require('@/assets/images/vendors/j.gonzalez.jpg'),
    // 'c.rosales': require('@/assets/images/vendors/c.rosales.jpg'),
    // 'r.martinez': require('@/assets/images/vendors/r.martinez.jpg'),
    // 'a.diaz': require('@/assets/images/vendors/a.diaz.jpg'),
    // 'coco.vazquez': require('@/assets/images/vendors/coco.vazquez.jpg'),
    // 'o.salazar': require('@/assets/images/vendors/o.salazar.jpg'),
    // 'g.rosales': require('@/assets/images/vendors/g.rosales.jpg'),
    // 'e.navarrete': require('@/assets/images/vendors/e.navarrete.jpg'),
    // 'o.pena': require('@/assets/images/vendors/o.pena.jpg'),
    // 'a.cano': require('@/assets/images/vendors/a.cano.jpg'),
    // 'r.larrea': require('@/assets/images/vendors/r.larrea.jpg'),
    // 'a.licona': require('@/assets/images/vendors/a.licona.jpg'),
    // 'i.munoz': require('@/assets/images/vendors/i.munoz.jpg'),
  };

  const getVendorPhoto = (person: User) => {
    // Intentar cargar la foto del vendedor basada en su email
    const email = person.correo_electronico;
    const username = email.split('@')[0]; // e.g., "i.pineda"

    // Buscar en el mapa de fotos
    return vendorPhotos[username] || null;
  };

  const getInitials = (person: User) => {
    const firstInitial = person.nombre?.charAt(0) || '';
    const lastInitial = person.apellido_paterno?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Componente memoizado para optimizar el rendimiento
  const PersonCard = React.memo(
    ({
      person,
      onCall,
      onMessage,
    }: {
      person: User;
      onCall: (phone: string) => void;
      onMessage: (phone: string) => void;
    }) => {
      const photo = getVendorPhoto(person);

      return (
        <View style={styles.personCard}>
          <View style={styles.personHeader}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {photo ? (
                <Image source={photo} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{getInitials(person)}</Text>
                </View>
              )}
              {person.is_online && (
                <View style={styles.avatarOnlineIndicator} />
              )}
            </View>

            <View style={styles.personInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.personName}>{getFullName(person)}</Text>
                {person.is_online && <View style={styles.onlineIndicator} />}
              </View>
              <Text style={styles.personRole}>
                {getRoleDisplayName(person.rol)}
              </Text>
              <Text style={styles.personCompany}>{person.empresa}</Text>

              <View style={styles.personMeta}>
                {person.categoria && (
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: `${getCategoryColor(person.categoria)}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: getCategoryColor(person.categoria) },
                      ]}
                    >
                      {person.categoria}
                    </Text>
                  </View>
                )}
                {person.zona && (
                  <View style={styles.zoneBadge}>
                    <MapPin size={12} color="#6b7280" />
                    <Text style={styles.zoneText}>{person.zona}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>{person.correo_electronico}</Text>
            <Text style={styles.contactText}>{person.celular}</Text>
            <Text style={styles.contactText}>
              {person.ciudad}, {person.estado}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(person.celular)}
            >
              <Phone size={16} color="#1e40af" />
              <Text style={styles.actionButtonText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWhatsApp(person.celular)}
            >
              <MessageCircle size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEmail(person.correo_electronico)}
            >
              <Mail size={16} color="#f59e0b" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleStartChat(person)}
            >
              <MessageCircle size={16} color="#8b5cf6" />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendRequest(person)}
            >
              <Send size={16} color="#ef4444" />
              <Text style={styles.actionButtonText}>Solicitud</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  );

  const getCategoryColor = (category: string | null | undefined) => {
    switch (category) {
      case 'Agentes de venta':
        return '#3b82f6';
      case 'Servicio al Cliente':
        return '#10b981';
      case 'Soporte Técnico':
      case 'Soporte':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getRoleDisplayName = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'agent':
        return 'Agente';
      case 'customer':
        return 'Cliente';
      default:
        return 'Usuario';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Directorio</Text>
          <Text style={styles.subtitle}>Cargando personal...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Cargando directorio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Directorio</Text>
          <Text style={styles.subtitle}>Error al cargar</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPersonnel}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Directorio</Text>
        <Text style={styles.subtitle}>
          Mostrando {Math.min(filteredPersonnel.length, 15)} de{' '}
          {personnel.length} personas
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o empresa..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#1e40af" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Categoría:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Zona:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {zones.map(zone => (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.filterChip,
                    selectedZone === zone && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedZone(zone)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedZone === zone && styles.filterChipTextActive,
                    ]}
                  >
                    {zone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <FlatList
        data={filteredPersonnel.slice(0, 15)}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item: person }) => (
          <PersonCard
            person={person}
            onCall={handleCall}
            onMessage={handleWhatsApp}
          />
        )}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 200, // Altura aproximada de cada item
          offset: 200 * index,
          index,
        })}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Users size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {personnel.length === 0
                  ? 'No hay personal disponible'
                  : 'No se encontró personal con los filtros seleccionados'}
              </Text>
              <Text style={styles.emptySubtext}>
                {personnel.length === 0
                  ? 'El directorio está vacío'
                  : 'Intenta con otros filtros de búsqueda'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  personCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: '#202B52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  avatarOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  personInfo: {
    flex: 1,
    gap: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  personRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  personCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  personMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  contactInfo: {
    gap: 4,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    gap: 6,
    minWidth: '30%',
  },
  chatButton: {
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
