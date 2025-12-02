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
  try {
    console.log('Starting file upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
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

    // Get blob based on platform
    let blob: Blob;

    if (Platform.OS === 'web') {
      // For web, directly convert URI to blob
      try {
        blob = await fileURIToBlob(file.uri);
      } catch (webError) {
        console.error('Error converting file to blob on web:', webError);
        throw new Error('No se pudo leer el archivo');
      }
    } else {
      // For native platforms, use FileSystem
      let fileBase64: string;
      try {
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists) {
          console.error('File does not exist:', file.uri);
          return null;
        }

        fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to blob without fetch (CSP-safe)
        const dataUrl = `data:${file.type};base64,${fileBase64}`;
        blob = dataURLtoBlob(dataUrl);
      } catch (readError) {
        console.error('Error reading file:', readError);
        throw new Error('No se pudo leer el archivo');
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: file.type,
        upsert: false,
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
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
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
