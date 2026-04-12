import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export interface FileToUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

function normalizeMimeType(file: FileToUpload): string {
  const rawType = file.type?.trim();
  if (rawType && rawType.includes('/')) {
    return rawType;
  }

  const extension = file.name?.split('.').pop()?.toLowerCase();
  if (extension && MIME_TYPES_BY_EXTENSION[extension]) {
    return MIME_TYPES_BY_EXTENSION[extension];
  }

  if (rawType === 'image') return 'image/jpeg';
  if (rawType === 'audio') return 'audio/mpeg';
  if (rawType === 'video') return 'video/mp4';

  return 'application/octet-stream';
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const sanitized = base64.replace(/\s/g, '');
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const validLength =
    sanitized.indexOf('=') === -1 ? sanitized.length : sanitized.indexOf('=');
  const outputLength = Math.floor((validLength * 3) / 4);
  const bytes = new Uint8Array(outputLength);

  let byteIndex = 0;

  for (let i = 0; i < sanitized.length; i += 4) {
    const encoded1 = chars.indexOf(sanitized[i] || 'A');
    const encoded2 = chars.indexOf(sanitized[i + 1] || 'A');
    const encoded3 = chars.indexOf(sanitized[i + 2] || '=');
    const encoded4 = chars.indexOf(sanitized[i + 3] || '=');

    if (encoded1 < 0 || encoded2 < 0 || encoded3 < 0 || encoded4 < 0) {
      throw new Error('Contenido base64 invalido');
    }

    const chunk =
      (encoded1 << 18) |
      (encoded2 << 12) |
      ((encoded3 & 63) << 6) |
      (encoded4 & 63);

    if (byteIndex < outputLength) {
      bytes[byteIndex++] = (chunk >> 16) & 0xff;
    }
    if (sanitized[i + 2] !== '=' && byteIndex < outputLength) {
      bytes[byteIndex++] = (chunk >> 8) & 0xff;
    }
    if (sanitized[i + 3] !== '=' && byteIndex < outputLength) {
      bytes[byteIndex++] = chunk & 0xff;
    }
  }

  return bytes.buffer;
}

/**
 * Convert data URL to Blob without using fetch (CSP-safe)
 */
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert file URI to Blob for web platform (CSP-safe)
 */
async function fileURIToBlob(uri: string): Promise<Blob> {
  // Check if it's a data URL
  if (uri.startsWith('data:')) {
    return dataURLtoBlob(uri);
  }

  // For regular URLs (blob: or http:), use fetch
  const response = await fetch(uri);
  return await response.blob();
}

async function resolveReadableNativeUri(
  uri: string,
  fileName: string
): Promise<{
  readableUri: string;
  cleanupUri?: string;
  size: number;
}> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (fileInfo.exists) {
    return {
      readableUri: uri,
      size: fileInfo.size ?? 0,
    };
  }

  if (!uri.startsWith('content://') || !FileSystem.cacheDirectory) {
    throw new Error('No se pudo acceder al archivo seleccionado');
  }

  const extension = fileName.split('.').pop() || 'bin';
  const cleanupUri = `${FileSystem.cacheDirectory}upload-${Date.now()}.${extension}`;

  await FileSystem.copyAsync({
    from: uri,
    to: cleanupUri,
  });

  const copiedInfo = await FileSystem.getInfoAsync(cleanupUri);
  if (!copiedInfo.exists) {
    throw new Error('No se pudo preparar el archivo para subir');
  }

  return {
    readableUri: cleanupUri,
    cleanupUri,
    size: copiedInfo.size ?? 0,
  };
}

/**
 * Upload a file to Supabase Storage
 * @param file - File information to upload
 * @param bucket - Supabase storage bucket name
 * @param folder - Optional folder path within bucket
 * @returns Upload result with public URL
 */
export async function uploadFileToStorage(
  file: FileToUpload,
  bucket: string = 'request-files',
  folder: string = 'attachments'
): Promise<UploadResult | null> {
  let cleanupUri: string | undefined;

  try {
    const contentType = normalizeMimeType(file);

    console.log('Starting file upload:', {
      name: file.name,
      size: file.size,
      type: contentType,
      uri: file.uri,
    });

    // Validate file
    if (!file.uri || !file.name) {
      console.error('Invalid file: missing uri or name');
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('Uploading to path:', filePath);

    // Get upload body based on platform
    let uploadBody: Blob | ArrayBuffer;
    let actualSize = file.size;

    if (Platform.OS === 'web') {
      // For web, directly convert URI to blob
      try {
        const blob = await fileURIToBlob(file.uri);
        uploadBody = blob;
        actualSize = actualSize || blob.size;
      } catch (webError) {
        console.error('Error converting file to blob on web:', webError);
        throw new Error('No se pudo leer el archivo');
      }
    } else {
      // For native platforms, upload ArrayBuffer. Blob conversion is unreliable.
      let fileBase64: string;
      try {
        const nativeFile = await resolveReadableNativeUri(file.uri, file.name);
        cleanupUri = nativeFile.cleanupUri;
        actualSize = actualSize || nativeFile.size;

        fileBase64 = await FileSystem.readAsStringAsync(
          nativeFile.readableUri,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );

        if (!fileBase64) {
          throw new Error('Archivo vacio');
        }

        uploadBody = base64ToArrayBuffer(fileBase64);
      } catch (readError) {
        console.error('Error reading file:', readError);
        throw new Error('No se pudo leer el archivo');
      }
    }

    if (actualSize > maxSize) {
      console.error('Resolved file too large:', actualSize);
      throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadBody, {
        contentType,
        upsert: true, // Cambiado a true para evitar errores de duplicados en reintentos
      });

    if (error) {
      console.error('Supabase storage upload error:', error);

      // Check if bucket doesn't exist
      if (
        error.message?.includes('not found') ||
        error.message?.includes('does not exist')
      ) {
        throw new Error(
          `El bucket de almacenamiento "${bucket}" no existe. ` +
            'Por favor contacta al administrador para configurar el almacenamiento.'
        );
      }

      // Check if file is too large
      if (
        error.message?.includes('size') ||
        error.message?.includes('too large')
      ) {
        throw new Error(
          'El archivo es demasiado grande. Tamaño máximo permitido: 5MB'
        );
      }

      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from upload');
      throw new Error('No se recibió confirmación de la subida');
    }

    console.log('File uploaded successfully:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('Could not get public URL');
      throw new Error('No se pudo obtener la URL pública del archivo');
    }

    return {
      url: urlData.publicUrl,
      path: data.path,
      name: file.name,
      size: actualSize,
      type: contentType,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  } finally {
    if (cleanupUri) {
      await FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(
        cleanupError => {
          console.warn('Could not remove temporary upload file:', cleanupError);
        }
      );
    }
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param bucket - Supabase storage bucket name
 * @param folder - Optional folder path within bucket
 * @returns Array of upload results
 */
export async function uploadMultipleFiles(
  files: FileToUpload[],
  bucket: string = 'request-files',
  folder: string = 'attachments'
): Promise<UploadResult[]> {
  console.log(`Uploading ${files.length} files...`);

  const results: UploadResult[] = [];
  const errors: Error[] = [];

  for (const file of files) {
    try {
      const result = await uploadFileToStorage(file, bucket, folder);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      errors.push(
        error instanceof Error ? error : new Error('Error desconocido')
      );
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} file(s) failed to upload`);
    // If all files failed, throw error
    if (results.length === 0) {
      throw new Error('No se pudo subir ningún archivo');
    }
    // If some files failed, log warning but continue
    console.warn('Some files uploaded successfully despite errors');
  }

  console.log(`Successfully uploaded ${results.length} file(s)`);
  return results;
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path to file in storage
 * @param bucket - Supabase storage bucket name
 */
export async function deleteFileFromStorage(
  filePath: string,
  bucket: string = 'request-files'
): Promise<boolean> {
  try {
    console.log('Deleting file:', filePath);

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    console.log('File deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates if a file meets the requirements for upload
 * @param file - File object to validate
 * @param maxSizeInMB - Maximum size allowed in MB
 * @param allowedTypes - Array of allowed MIME types (e.g. ['image/jpeg', 'application/pdf'])
 * @returns { valid: boolean, error?: string }
 */
export function validateFileForUpload(
  file: { size: number; type: string; name: string },
  maxSizeInMB: number = 5,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
): { valid: boolean; error?: string } {
  // Size validation
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `El archivo "${file.name}" excede el límite de ${maxSizeInMB}MB.`,
    };
  }

  // Type validation (optional, can be skipped if allowedTypes is empty)
  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(`${baseType}/`);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `El formato del archivo "${file.name}" no está permitido. Use imágenes, PDF o Word.`,
      };
    }
  }

  return { valid: true };
}
