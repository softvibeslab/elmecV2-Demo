import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabaseClient } from '@/lib/supabase';
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react-native';

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido_paterno: user?.apellido_paterno || '',
    apellido_materno: user?.apellido_materno || '',
    empresa: user?.empresa || '',
    celular: user?.celular || '',
    ciudad: user?.ciudad || '',
    estado: user?.estado || '',
  });

  const handleSave = async () => {
    if (!user) return;

    // Validaciones básicas
    if (!formData.nombre || !formData.apellido_paterno) {
      Alert.alert('Error', 'El nombre y apellido paterno son obligatorios');
      return;
    }

    if (!formData.celular || formData.celular.length < 10) {
      Alert.alert('Error', 'Ingresa un número de teléfono válido');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({
          nombre: formData.nombre.trim(),
          apellido_paterno: formData.apellido_paterno.trim(),
          apellido_materno: formData.apellido_materno.trim(),
          empresa: formData.empresa.trim(),
          celular: formData.celular.trim(),
          ciudad: formData.ciudad.trim(),
          estado: formData.estado.trim(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'No se pudo actualizar el perfil');
        return;
      }

      // Refrescar datos del usuario
      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, nombre: text }))
              }
              placeholder="Nombre"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Apellido Paterno */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Apellido Paterno *</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.apellido_paterno}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, apellido_paterno: text }))
              }
              placeholder="Apellido Paterno"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Apellido Materno */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Apellido Materno</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.apellido_materno}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, apellido_materno: text }))
              }
              placeholder="Apellido Materno"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Empresa */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Empresa</Text>
          <View style={styles.inputContainer}>
            <Building size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.empresa}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, empresa: text }))
              }
              placeholder="Empresa"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Correo (solo lectura) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={[styles.inputContainer, styles.inputDisabled]}>
            <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={user?.correo_electronico}
              editable={false}
              placeholder="Correo Electrónico"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <Text style={styles.helperText}>El correo no se puede modificar</Text>
        </View>

        {/* Teléfono */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Teléfono *</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.celular}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, celular: text }))
              }
              placeholder="10 dígitos"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Ciudad */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ciudad</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.ciudad}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, ciudad: text }))
              }
              placeholder="Ciudad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Estado */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.estado}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, estado: text }))
              }
              placeholder="Estado"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.saveButtonText}>Guardando...</Text>
            </>
          ) : (
            <>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  inputReadOnly: {
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B52',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
