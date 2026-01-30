import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Environment variables used by Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
  if (uri.startsWith('data:')) {
    return dataURLtoBlob(uri);
  }
  const response = await fetch(uri);
  return await response.blob();
}

/**
 * Normalize MIME type based on extension if missing or generic
 */
function normalizeMimeType(type: string | undefined, fileName: string): string {
  if (type && type !== 'application/octet-stream') return type;

  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Upload a file to Supabase Storage
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
      uri: file.uri,
    });

    // Validate file
    if (!file.uri || !file.name) {
      console.error('Invalid file: missing uri or name');
      return null;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    // Limpiar fileName de caracteres especiales para evitar problemas en URL
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = folder ? `${folder}/${cleanFileName}` : cleanFileName;

    console.log('Target path:', filePath);

    // ---------------------------------------------------------
    // WEB PLATFORM STRATEGY
    // ---------------------------------------------------------
    if (Platform.OS === 'web') {
      let blob: Blob;
      try {
        blob = await fileURIToBlob(file.uri);
      } catch (webError) {
        console.error('Error converting file to blob on web:', webError);
        throw new Error('No se pudo leer el archivo');
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;
      if (!data) throw new Error('No data returned from upload');

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }
    // ---------------------------------------------------------
    // NATIVE PLATFORM STRATEGY (FileSystem.uploadAsync)
    // ---------------------------------------------------------
    else {
      // Usar uploadAsync es mucho más robusto en Android/iOS que fetch/Blob
      // porque usa la red nativa y evita problemas de memoria del bridge JS.

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Variables de entorno de Supabase no configuradas');
      }

      // Obtener sesión actual para autenticación correcta (RLS)
      // Necesitamos el access_token del usuario logueado, no la anon key.
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // El token a usar en Authorization debe ser el del usuario si existe.
      // Si no hay sesión, usamos Anon Key como fallback (pero fallará si RLS requiere auth).
      const bearerToken = accessToken || SUPABASE_ANON_KEY;

      if (!accessToken) {
        console.log('Upload: No session token found, utilizing Anon Key (RLS checks might fail if auth required)');
      }

      // Construir URL completa de subida
      // Endpoint: POST /storage/v1/object/{bucket}/{path}
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

      console.log('Uploading using native FileSystem.uploadAsync to:', uploadUrl);

      // Asegurar que la URI es accesible (si es content:// a veces conviene copiarla)
      let uriToUpload = file.uri;

      // Intentar copiar a cache si empieza con content:// para asegurar acceso
      if (file.uri.startsWith('content://')) {
        try {
          // Verificar primero si podemos leerla
          const info = await FileSystem.getInfoAsync(file.uri);
          if (!info.exists) {
            // Si dice que no existe (común bugs de Android), intentamos copiar
            const cacheUri = `${FileSystem.cacheDirectory}upload_${Date.now()}_${cleanFileName}`;
            await FileSystem.copyAsync({ from: file.uri, to: cacheUri });
            uriToUpload = cacheUri;
            console.log('Copied content:// URI to cache:', uriToUpload);
          }
        } catch (e) {
          console.warn('Error checking/copying content URI, trying original:', e);
        }
      }

      const fileType = normalizeMimeType(file.type, file.name);

      const uploadResponse = await FileSystem.uploadAsync(uploadUrl, uriToUpload, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, // Envío directo del binario
        fieldName: 'file', // Requerido aunque sea binary a veces por compatibilidad
        mimeType: fileType,
        headers: {
          'Authorization': `Bearer ${bearerToken}`, // <-- Token de usuario REAL
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': fileType,
          'x-upsert': 'false', // Header opcional de supabase
        },
      });

      console.log('Native upload response status:', uploadResponse.status);

      if (uploadResponse.status >= 200 && uploadResponse.status < 300) {
        // Éxito. Supabase devuelve metadata del archivo en el body, similar al JS Client
        // Parsear respuesta si es necesario, o reconstruir el path localmente.
        // La API devuelve: { "Key": "bucket/path/to/file.ext", ... }

        let responseData;
        try {
          responseData = JSON.parse(uploadResponse.body);
        } catch (e) {
          console.warn('Could not parse response body JSON:', e);
        }

        // Supabase REST API retorna la "Key" completa incluyendo bucket
        // Ej: "request-files/attachments/123.jpg"
        const finalKey = responseData?.Key || `${bucket}/${filePath}`;

        // Construir Public URL manualmente ya que bypassamos el cliente JS
        // Formato: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        // O usar getPublicUrl del cliente JS si queremos
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return {
          url: urlData.publicUrl,
          path: filePath, // Usamos nuestro filePath generado
          name: file.name,
          size: file.size,
          type: file.type,
        };
      } else {
        console.error('Native upload failed:', uploadResponse.body);

        // Parsear error si es JSON para mostrar mensaje amigable
        let errorMessage = uploadResponse.body;
        try {
          const errorJson = JSON.parse(uploadResponse.body);
          if (errorJson.message) errorMessage = errorJson.message;
          if (errorJson.error) errorMessage += ` (${errorJson.error})`;
        } catch (e) { }

        throw new Error(`Error subiendo archivo (Status ${uploadResponse.status}): ${errorMessage}`);
      }
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: FileToUpload[],
  bucket: string = 'request-files',
  folder: string = 'attachments'
): Promise<UploadResult[]> {
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
      errors.push(error instanceof Error ? error : new Error('Error desconocido'));
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error('No se pudo subir ningún archivo');
  }

  return results;
}

/**
 * Delete a file
 */
export async function deleteFileFromStorage(
  filePath: string,
  bucket: string = 'request-files'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    return !error;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
