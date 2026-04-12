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
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react-native';
import { uploadFileToStorage, FileToUpload } from '@/utils/fileUpload';

type SelectedFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  url?: string;
  path?: string;
  error?: string;
};

type UploadedFile = {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
};

interface FileUploadComponentProps {
  onFileSelected(file: SelectedFile): void;
  onFileRemoved(index: number): void;
  onFileUploaded?(uploadedFile: UploadedFile): void;
  files: SelectedFile[];
  maxFiles?: number;
  allowedTypes?: string[];
  maxSizeInMB?: number;
  bucket?: string;
  folder?: string;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileSelected,
  onFileRemoved,
  onFileUploaded,
  files,
  maxFiles = 5,
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxSizeInMB = 10,
  bucket = 'request-files',
  folder = 'attachments',
}) => {
  const [uploading, setUploading] = useState(false);
  const showSuccessMessage = files.some(
    file => file.uploadStatus === 'success'
  );

  const uploadFileImmediately = async (file: FileToUpload) => {
    try {
      // Update file status to uploading
      onFileSelected({
        ...file,
        uploadStatus: 'uploading',
        uploadProgress: 0,
      });

      const result = await uploadFileToStorage(file, bucket, folder);

      if (result) {
        // Update file status to success
        onFileSelected({
          ...file,
          uploadStatus: 'success',
          url: result.url,
          path: result.path,
        });

        // Notify parent component
        if (onFileUploaded) {
          onFileUploaded(result);
        }

        return result;
      } else {
        throw new Error('No se pudo subir el archivo');
      }
    } catch (error: any) {
      // Update file status to error
      onFileSelected({
        ...file,
        uploadStatus: 'error',
        error: error.message || 'Error al subir el archivo',
      });
      throw error;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: any): boolean => {
    // Obtener el tipo MIME del archivo
    let fileType = file.mimeType || file.type;

    // Si no hay tipo MIME, intentar deducirlo de la extensión del archivo
    if (!fileType) {
      const extension = file.name?.split('.').pop()?.toLowerCase();
      if (extension) {
        const mimeTypes: { [key: string]: string } = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          txt: 'text/plain',
          mp4: 'video/mp4',
          mp3: 'audio/mpeg',
          zip: 'application/zip',
        };
        fileType = mimeTypes[extension] || 'application/octet-stream';
      }
    }

    // Validar tipo de archivo
    if (allowedTypes && allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return fileType?.startsWith(`${baseType}/`) || false;
        }
        return fileType === type;
      });

      if (!isAllowed) {
        Alert.alert(
          'Formato no permitido',
          `El archivo "${file.name}" no tiene un formato válido. Tipo detectado: ${fileType || 'desconocido'}`
        );
        return false;
      }
    }

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
        const fileData = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size || 0,
          uploadStatus: 'pending' as const,
        };

        if (validateFile(file)) {
          // Add file with pending status first
          onFileSelected(fileData);

          // Upload immediately
          try {
            await uploadFileImmediately(fileData);
          } catch (uploadError: any) {
            Alert.alert(
              'Error de subida',
              uploadError.message || 'No se pudo subir el archivo'
            );
          }
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
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
        const fileData = {
          uri: image.uri,
          name: image.fileName || `image_${Date.now()}.jpg`,
          type: image.mimeType || 'image/jpeg',
          size: image.fileSize || 0,
          uploadStatus: 'pending' as const,
        };

        if (validateFile(fileData)) {
          // Add file with pending status first
          onFileSelected(fileData);

          // Upload immediately
          try {
            await uploadFileImmediately(fileData);
          } catch (uploadError: any) {
            Alert.alert(
              'Error de subida',
              uploadError.message || 'No se pudo subir la imagen'
            );
          }
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
        const fileData = {
          uri: photo.uri,
          name: photo.fileName || `photo_${Date.now()}.jpg`,
          type: photo.mimeType || 'image/jpeg',
          size: photo.fileSize || 0,
          uploadStatus: 'pending' as const,
        };

        if (validateFile(fileData)) {
          // Add file with pending status first
          onFileSelected(fileData);

          // Upload immediately
          try {
            await uploadFileImmediately(fileData);
          } catch (uploadError: any) {
            Alert.alert(
              'Error de subida',
              uploadError.message || 'No se pudo subir la foto'
            );
          }
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 size={16} color="#3b82f6" />;
      case 'success':
        return <CheckCircle size={16} color="#10b981" />;
      case 'error':
        return <AlertCircle size={16} color="#ef4444" />;
      default:
        return null;
    }
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
          <View style={styles.fileListHeader}>
            <Text style={styles.fileListTitle}>Archivos seleccionados:</Text>
            {showSuccessMessage && (
              <View style={styles.successBadge}>
                <CheckCircle size={14} color="#10b981" />
                <Text style={styles.successText}>
                  {files.filter(f => f.uploadStatus === 'success').length} de{' '}
                  {files.length} subidos
                </Text>
              </View>
            )}
          </View>
          {files.map((file, index) => (
            <View
              key={index}
              style={[
                styles.fileItem,
                file.uploadStatus === 'error' && styles.fileItemError,
              ]}
            >
              <View style={styles.fileInfo}>
                {getFileIcon(file.type)}
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                    {file.uploadStatus === 'uploading' && (
                      <Text style={styles.uploadingText}>Subiendo...</Text>
                    )}
                    {file.uploadStatus === 'success' && (
                      <Text style={styles.successText}>✓ Subido</Text>
                    )}
                    {file.uploadStatus === 'error' && (
                      <Text style={styles.errorText}>✗ Error</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.fileActions}>
                {getStatusIcon(file.uploadStatus)}

                {file.type.startsWith('image/') && file.uri && (
                  <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onFileRemoved(index)}
                  disabled={file.uploadStatus === 'uploading'}
                >
                  <X
                    size={16}
                    color={
                      file.uploadStatus === 'uploading' ? '#9ca3af' : '#ef4444'
                    }
                  />
                </TouchableOpacity>
              </View>
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
  fileListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileListTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#065f46',
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
  fileItemError: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
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
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
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
