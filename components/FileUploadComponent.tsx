import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Upload,
  File,
  Image as ImageIcon,
  X,
  Camera,
} from 'lucide-react-native';

interface FileUploadComponentProps {
  onFileSelected: (file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  }) => void;
  onFileRemoved: (index: number) => void;
  files: Array<{ uri: string; name: string; type: string; size: number }>;
  maxFiles?: number;
  allowedTypes?: string[];
  maxSizeInMB?: number;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileSelected,
  onFileRemoved,
  files,
  maxFiles = 5,
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxSizeInMB = 10,
}) => {
  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: any): boolean => {
    // Validar tamaño
    if (file.size && file.size > maxSizeInMB * 1024 * 1024) {
      Alert.alert('Error', `El archivo es muy grande. Máximo ${maxSizeInMB}MB`);
      return false;
    }

    // Validar cantidad
    if (files.length >= maxFiles) {
      Alert.alert('Error', `Máximo ${maxFiles} archivos permitidos`);
      return false;
    }

    return true;
  };

  const pickDocument = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        if (validateFile(file)) {
          onFileSelected({
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
            size: file.size || 0,
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      setUploading(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tus fotos'
        );
        setUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        if (validateFile({ size: image.fileSize })) {
          onFileSelected({
            uri: image.uri,
            name: image.fileName || `image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: image.fileSize || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setUploading(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tu cámara'
        );
        setUploading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        if (validateFile({ size: photo.fileSize })) {
          onFileSelected({
            uri: photo.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: photo.fileSize || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon size={20} color="#3b82f6" />;
    }
    return <File size={20} color="#6b7280" />;
  };

  return (
    <View style={styles.container}>
      {/* Upload Buttons */}
      <View style={styles.uploadButtons}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && styles.uploadButtonDisabled,
          ]}
          onPress={pickDocument}
          disabled={uploading || files.length >= maxFiles}
        >
          <Upload size={18} color="#ffffff" />
          <Text style={styles.uploadButtonText}>Archivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && styles.uploadButtonDisabled,
          ]}
          onPress={pickImage}
          disabled={uploading || files.length >= maxFiles}
        >
          <ImageIcon size={18} color="#ffffff" />
          <Text style={styles.uploadButtonText}>Galería</Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              uploading && styles.uploadButtonDisabled,
            ]}
            onPress={takePhoto}
            disabled={uploading || files.length >= maxFiles}
          >
            <Camera size={18} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Cámara</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* File List */}
      {files.length > 0 && (
        <View style={styles.fileList}>
          <Text style={styles.fileListTitle}>Archivos seleccionados:</Text>
          {files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                {getFileIcon(file.type)}
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>

              {file.type.startsWith('image/') && (
                <Image source={{ uri: file.uri }} style={styles.thumbnail} />
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onFileRemoved(index)}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload Info */}
      <Text style={styles.uploadInfo}>
        Máximo {maxFiles} archivos • {maxSizeInMB}MB por archivo
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  fileList: {
    gap: 8,
  },
  fileListTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  uploadInfo: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});
