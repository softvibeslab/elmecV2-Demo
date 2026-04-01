import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'expo-router';
import { supabase, supabaseClient } from '@/lib/supabase';
import { Request, User } from '@/types/supabase';

// Tipos extendidos para las consultas con joins
interface RequestWithRelations extends Request {
  usuario?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    empresa: string;
    zona?: string;
  };
  agente?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    categoria?: string;
    zona?: string;
  };
}
import {
  Plus,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Send,
  X,
  User as UserIcon,
  MessageCircle,
  Loader2,
  Circle,
  Trash2,
  MapPin,
} from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { FileUploadComponent } from '@/components/FileUploadComponent';
import { uploadMultipleFiles, UploadResult } from '@/utils/fileUpload';

export default function Requests() {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    RequestWithRelations[]
  >([]);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ uri: string; name: string; type: string; size: number }>
  >([]);
  // Filter state for agent/admin view
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [activeAgentFilter, setActiveAgentFilter] = useState<string | null>(null);
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null);
  const [statusChangeRequest, setStatusChangeRequest] = useState<RequestWithRelations | null>(null);
  const [newRequest, setNewRequest] = useState({
    titulo: '',
    mensaje: '',
    tipo: 1,
    prioridad: 'media' as const,
    agente_id: '',
  });

  const { user } = useAuth();
  const { sendDemoNotification, sendNotificationToUser } = useNotifications();
  const { createChatRoom } = useChat();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadRequests();
      loadAgents();
    }
  }, [user]);

  useEffect(() => {
    setFilteredRequests(requests);
  }, [requests]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let data: RequestWithRelations[] | null = null;
      let error: any = null;

      // Filtrar según el rol del usuario
      if (user.rol === 'customer') {
        // Clientes solo ven sus solicitudes
        const query = supabase
          .from('requests')
          .select(
            `
            *,
            usuario:users!requests_usuario_id_fkey(id, nombre, apellido_paterno, apellido_materno, empresa, zona),
            agente:users!requests_agente_id_fkey(id, nombre, apellido_paterno, apellido_materno, categoria, zona)
          `
          )
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false });

        const result = await query;
        data = result.data;
        error = result.error;
      } else if (user.rol === 'agent') {
        // Agentes ven:
        // 1. Solicitudes asignadas a ellos
        // 2. Solicitudes sin asignar de clientes de su misma zona
        const baseQuery = `
          *,
          usuario:users!requests_usuario_id_fkey(id, nombre, apellido_paterno, apellido_materno, empresa, zona),
          agente:users!requests_agente_id_fkey(id, nombre, apellido_paterno, apellido_materno, categoria, zona)
        `;

        // Consulta 1: Solicitudes asignadas al agente
        const assignedQuery = supabase
          .from('requests')
          .select(baseQuery)
          .eq('agente_id', user.id);

        // Consulta 2: Solicitudes sin asignar de su zona
        let unassignedQuery: any = null;
        if (user.zona) {
          unassignedQuery = supabase
            .from('requests')
            .select(baseQuery)
            .is('agente_id', null)
            .order('created_at', { ascending: false });
        }

        // Ejecutar ambas consultas en paralelo
        const [assignedResult, unassignedResult] = await Promise.all([
          assignedQuery,
          unassignedQuery || { data: null, error: null },
        ]);

        const assignedRequests = assignedResult.data || [];
        const unassignedRequests = (unassignedResult?.data || []).filter(
          (req: RequestWithRelations) => req.usuario?.zona === user.zona
        );

        // Combinar y eliminar duplicados (usando Set para IDs únicos)
        const allRequests = [...assignedRequests, ...unassignedRequests];
        const uniqueRequests = Array.from(
          new Map(allRequests.map((req: RequestWithRelations) => [req.id, req])).values()
        );

        // Ordenar por fecha
        data = uniqueRequests.sort(
          (a: RequestWithRelations, b: RequestWithRelations) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        error = assignedResult.error || unassignedResult?.error;
      } else {
        // Admins ven todas las solicitudes
        const query = supabase
          .from('requests')
          .select(
            `
            *,
            usuario:users!requests_usuario_id_fkey(id, nombre, apellido_paterno, apellido_materno, empresa, zona),
            agente:users!requests_agente_id_fkey(id, nombre, apellido_paterno, apellido_materno, categoria, zona)
          `
          )
          .order('created_at', { ascending: false });

        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error loading requests:', error);
        setError(`Error al cargar las solicitudes: ${error.message}`);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      setError(
        `Error al cargar las solicitudes: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      let query = supabase
        .from('users')
        .select(
          'id, nombre, apellido_paterno, apellido_materno, categoria, zona'
        )
        .eq('rol', 'agent')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      // Si el usuario es cliente, filtrar agentes por su misma zona
      if (user?.rol === 'customer' && user?.zona) {
        query = query.eq('zona', user.zona);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading agents:', error);
        return;
      }

      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  // Sistema de semáforo:
  // ROJO: Sin atender (solicitud que excedió tiempos de respuesta)
  // AMARILLO: Nueva (recién creada)
  // VERDE: En proceso (siendo atendida)
  // AZUL: Terminada (resuelta o cerrada)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sin_atender':
        return <Circle size={16} color="#ef4444" fill="#ef4444" />;
      case 'nuevo':
        return <Circle size={16} color="#f59e0b" fill="#f59e0b" />;
      case 'asignado':
      case 'en_proceso':
        return <Circle size={16} color="#22c55e" fill="#22c55e" />;
      case 'resuelto':
      case 'cerrado':
        return <Circle size={16} color="#3b82f6" fill="#3b82f6" />;
      default:
        return <Circle size={16} color="#6b7280" fill="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sin_atender':
        return 'Sin atender';
      case 'nuevo':
        return 'Nueva';
      case 'asignado':
        return 'Asignado';
      case 'en_proceso':
        return 'En proceso';
      case 'resuelto':
        return 'Terminada';
      case 'cerrado':
        return 'Terminada';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sin_atender':
        return '#ef4444'; // Rojo
      case 'nuevo':
        return '#f59e0b'; // Amarillo
      case 'asignado':
      case 'en_proceso':
        return '#22c55e'; // Verde
      case 'resuelto':
      case 'cerrado':
        return '#3b82f6'; // Azul
      default:
        return '#6b7280';
    }
  };

  // Obtener nombre del área basado en el tipo de solicitud
  const getAreaName = (tipo: number) => {
    switch (tipo) {
      case 1:
        return 'VENTAS';
      case 2:
        return 'SOPORTE';
      case 3:
        return 'COTIZACIÓN';
      default:
        return 'GENERAL';
    }
  };

  // Obtener color del área
  const getAreaColor = (tipo: number) => {
    switch (tipo) {
      case 1:
        return '#10b981'; // Verde - Ventas
      case 2:
        return '#3b82f6'; // Azul - Soporte
      case 3:
        return '#f59e0b'; // Amarillo - Cotización
      default:
        return '#6b7280'; // Gris - General
    }
  };

  // Verifica si una solicitud debe marcarse como "sin atender"
  const checkRequestExpiration = (request: RequestWithRelations): string => {
    const now = new Date();
    const createdAt = new Date(request.created_at);
    const updatedAt = new Date(request.updated_at);
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceUpdate = Math.floor(
      (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Si es nueva y han pasado más de 3 días sin cambiar a en_proceso
    if (request.estatus === 'nuevo' && daysSinceCreation > 3) {
      return 'sin_atender';
    }

    // Si está en proceso y han pasado más de 5 días sin terminar
    if (
      (request.estatus === 'asignado' || request.estatus === 'en_proceso') &&
      daysSinceUpdate > 5
    ) {
      return 'sin_atender';
    }

    return request.estatus;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baja':
        return '#10b981';
      case 'media':
        return '#f59e0b';
      case 'alta':
        return '#ef4444';
      case 'urgente':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFullName = (usuario: any) => {
    if (!usuario) return 'Usuario desconocido';
    const parts = [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno].filter(Boolean);
    return parts.join(' ').trim() || 'Usuario desconocido';
  };

  const getAgentFullName = (agent: User) => {
    const parts = [agent.nombre, agent.apellido_paterno, agent.apellido_materno].filter(Boolean);
    return parts.join(' ').trim() || 'Agente';
  };

  const handleCreateRequest = async () => {
    console.log('=== INICIANDO CREACIÓN DE SOLICITUD ===');
    console.log('Estado del formulario:', {
      titulo: newRequest.titulo,
      mensaje: newRequest.mensaje?.substring(0, 50),
      tipo: newRequest.tipo,
      prioridad: newRequest.prioridad,
      agente_id: newRequest.agente_id,
      archivos: selectedFiles.length,
    });

    // Validación de campos obligatorios
    if (!newRequest.titulo.trim()) {
      console.log('❌ Validación fallida: título vacío');
      Alert.alert(
        'Campo obligatorio',
        'El título es obligatorio. Por favor ingresa un título descriptivo para tu solicitud.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (!newRequest.mensaje.trim()) {
      console.log('❌ Validación fallida: mensaje vacío');
      Alert.alert(
        'Campo obligatorio',
        'El mensaje es obligatorio. Por favor describe en detalle tu solicitud.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validación de longitud del título
    if (newRequest.titulo.trim().length < 5) {
      console.log('❌ Validación fallida: título muy corto');
      Alert.alert(
        'Título muy corto',
        `El título debe tener al menos 5 caracteres. Actualmente tiene ${newRequest.titulo.trim().length} caracteres.\n\nPor favor ingresa un título más descriptivo.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (newRequest.titulo.trim().length > 200) {
      console.log('❌ Validación fallida: título muy largo');
      Alert.alert(
        'Título muy largo',
        `El título no puede exceder 200 caracteres. Actualmente tiene ${newRequest.titulo.trim().length} caracteres.\n\nPor favor resume el título de tu solicitud.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validación de longitud del mensaje
    if (newRequest.mensaje.trim().length < 10) {
      console.log('❌ Validación fallida: mensaje muy corto');
      Alert.alert(
        'Mensaje muy corto',
        `El mensaje debe tener al menos 10 caracteres. Actualmente tiene ${newRequest.mensaje.trim().length} caracteres.\n\nPor favor describe tu solicitud con más detalle.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validación de archivos
    if (selectedFiles.length > 3) {
      console.log('❌ Validación fallida: demasiados archivos');
      Alert.alert(
        'Demasiados archivos',
        `Solo se permiten máximo 3 archivos adjuntos. Actualmente tienes ${selectedFiles.length} archivos seleccionados.\n\nPor favor elimina algunos archivos antes de continuar.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validar tamaño de cada archivo
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(
      file => file.size > maxSizeInBytes
    );
    if (oversizedFiles.length > 0) {
      console.log('❌ Validación fallida: archivos muy grandes');
      const fileNames = oversizedFiles
        .map(f => `• ${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`)
        .join('\n');
      Alert.alert(
        'Archivos muy grandes',
        `Los siguientes archivos exceden el límite de ${maxSizeInMB}MB:\n\n${fileNames}\n\nPor favor selecciona archivos más pequeños.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validación de usuario autenticado
    if (!user) {
      console.log('❌ Validación fallida: usuario no autenticado');
      Alert.alert(
        'Sesión no válida',
        'No se pudo verificar tu sesión. Por favor cierra sesión y vuelve a iniciar sesión.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    console.log('✅ Todas las validaciones pasaron');
    setSubmitting(true);
    try {
      // Validate agent exists if selected
      if (newRequest.agente_id) {
        const { data: agentExists, error: agentError } = await supabase
          .from('users')
          .select('id, nombre, apellido_paterno, apellido_materno')
          .eq('id', newRequest.agente_id)
          .eq('rol', 'agent')
          .eq('activo', true)
          .single();

        if (agentError || !agentExists) {
          console.error('Agent validation error:', agentError);
          Alert.alert(
            'Agente no disponible',
            'El agente que seleccionaste ya no está disponible o no tiene permisos para recibir solicitudes.\n\nPor favor selecciona otro agente o deja el campo vacío para que se asigne automáticamente.',
            [{ text: 'Entendido' }]
          );
          setSubmitting(false);
          return;
        }
      }

      // Upload files to Supabase Storage if any
      let uploadedFiles: UploadResult[] = [];
      if (selectedFiles.length > 0) {
        try {
          console.log(
            `Uploading ${selectedFiles.length} file(s) to storage...`
          );
          uploadedFiles = await uploadMultipleFiles(
            selectedFiles,
            'request-files',
            `requests/${user.id}`
          );
          console.log(`Successfully uploaded ${uploadedFiles.length} file(s)`);
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);

          // Determinar el mensaje de error específico
          let errorMessage = 'No se pudieron subir los archivos adjuntos.';
          if (uploadError?.message) {
            if (uploadError.message.includes('size')) {
              errorMessage =
                'Uno o más archivos exceden el tamaño máximo permitido.';
            } else if (
              uploadError.message.includes('type') ||
              uploadError.message.includes('format')
            ) {
              errorMessage =
                'Uno o más archivos tienen un formato no permitido.';
            } else if (
              uploadError.message.includes('network') ||
              uploadError.message.includes('connection')
            ) {
              errorMessage =
                'Error de conexión al subir los archivos. Verifica tu conexión a internet.';
            } else if (
              uploadError.message.includes('permission') ||
              uploadError.message.includes('denied')
            ) {
              errorMessage =
                'No tienes permisos para subir archivos. Contacta al administrador.';
            } else {
              errorMessage = `Error al subir archivos: ${uploadError.message}`;
            }
          }

          Alert.alert(
            'Error al subir archivos',
            `${errorMessage}\n\n¿Deseas continuar sin archivos adjuntos?`,
            [
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => {
                  setSubmitting(false);
                },
              },
              {
                text: 'Continuar sin archivos',
                onPress: () => {
                  // Los archivos se limpiarán, continuar sin ellos
                  uploadedFiles = [];
                },
              },
            ]
          );
          setSubmitting(false);
          return;
        }
      }

      // Properly typed request data
      const requestData: any = {
        titulo: newRequest.titulo.trim(),
        mensaje: newRequest.mensaje.trim(),
        tipo: newRequest.tipo,
        prioridad: newRequest.prioridad,
        estatus: 'asignado', // Estado inicial automático según requerimiento
        usuario_id: user.id,
        agente_id: newRequest.agente_id || null,
        tags: [],
        metadata: {
          created_from: 'mobile',
          app_version: '1.0.0',
          status_history: [
            {
              from: null,
              to: 'asignado',
              timestamp: new Date().toISOString(),
              reason: 'Creación inicial de solicitud',
            },
          ],
        },
      };

      // Agregar archivos solo si hay archivos subidos
      if (uploadedFiles.length > 0) {
        requestData.archivos = uploadedFiles.map(file => file.url);
        requestData.metadata.files = uploadedFiles.map(file => ({
          name: file.name,
          url: file.url,
          path: file.path,
          type: file.type,
          size: file.size,
        }));
      }

      console.log('Creating request with data:', {
        titulo: requestData.titulo,
        tipo: requestData.tipo,
        prioridad: requestData.prioridad,
        usuario_id: requestData.usuario_id,
        agente_id: requestData.agente_id,
      });

      const { data, error } = await supabaseClient
        .from('requests')
        .insert(requestData)
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno, empresa, zona),
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno, categoria, zona)
        `
        )
        .single();

      if (error) {
        console.error('Error creating request:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Analizar el tipo de error y mostrar mensaje específico
        let errorTitle = 'Error al crear solicitud';
        let errorMessage =
          'No se pudo crear la solicitud. Por favor intenta de nuevo.';

        // Errores de validación de Supabase
        if (error.code === '23502') {
          // NOT NULL violation
          errorTitle = 'Datos incompletos';
          errorMessage =
            'Algunos campos obligatorios no fueron enviados correctamente. Por favor verifica todos los campos e intenta nuevamente.';
        } else if (error.code === '23503') {
          // Foreign key violation
          errorTitle = 'Referencia inválida';
          if (error.message.includes('agente_id')) {
            errorMessage =
              'El agente seleccionado no es válido. Por favor selecciona otro agente o deja el campo vacío.';
          } else if (error.message.includes('usuario_id')) {
            errorMessage =
              'Tu sesión no es válida. Por favor cierra sesión y vuelve a iniciar sesión.';
          } else {
            errorMessage =
              'Una de las referencias en la solicitud no es válida. Por favor verifica los datos.';
          }
        } else if (error.code === '23505') {
          // Unique violation
          errorTitle = 'Solicitud duplicada';
          errorMessage =
            'Ya existe una solicitud similar. Por favor verifica tus solicitudes existentes.';
        } else if (
          error.code === '42501' ||
          error.message.includes('permission')
        ) {
          // Permission denied
          errorTitle = 'Permisos insuficientes';
          errorMessage =
            'No tienes permisos para crear solicitudes. Por favor contacta al administrador.';
        } else if (error.message.includes('titulo')) {
          errorTitle = 'Error en el título';
          errorMessage =
            'El título de la solicitud no cumple con los requisitos. Debe tener entre 5 y 200 caracteres.';
        } else if (error.message.includes('mensaje')) {
          errorTitle = 'Error en el mensaje';
          errorMessage =
            'El mensaje de la solicitud no cumple con los requisitos. Debe tener al menos 10 caracteres.';
        } else if (error.message.includes('tipo')) {
          errorTitle = 'Tipo de solicitud inválido';
          errorMessage =
            'El tipo de solicitud seleccionado no es válido. Por favor selecciona un tipo válido.';
        } else if (error.message.includes('prioridad')) {
          errorTitle = 'Prioridad inválida';
          errorMessage =
            'La prioridad seleccionada no es válida. Por favor selecciona una prioridad válida.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('connection')
        ) {
          errorTitle = 'Error de conexión';
          errorMessage =
            'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Tiempo de espera agotado';
          errorMessage =
            'La operación tardó demasiado tiempo. Por favor intenta nuevamente.';
        } else if (error.details) {
          errorMessage = `Error: ${error.message}\n\nDetalles: ${error.details}`;
        } else {
          errorMessage = `Error: ${error.message}\n\nPor favor verifica los datos e intenta nuevamente.`;
        }

        Alert.alert(errorTitle, errorMessage, [{ text: 'Entendido' }]);
        return;
      }

      if (!data) {
        console.error('No data returned from insert');
        Alert.alert(
          'Error inesperado',
          'No se recibió confirmación de la solicitud creada. Es posible que la solicitud se haya creado pero no podemos confirmarlo.\n\nPor favor revisa tu lista de solicitudes o intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      console.log('✅ Request created successfully:', data.id);
      console.log('Solicitud creada:', {
        id: data.id,
        titulo: data.titulo,
        estatus: data.estatus,
        usuario_id: data.usuario_id,
        agente_id: data.agente_id,
      });

      // Agregar la nueva solicitud a la lista
      setRequests(prev => {
        console.log(
          'Agregando solicitud a la lista. Total anterior:',
          prev.length
        );
        return [data as RequestWithRelations, ...prev];
      });

      // Limpiar formulario
      console.log('Limpiando formulario...');
      setNewRequest({
        titulo: '',
        mensaje: '',
        tipo: 1,
        prioridad: 'media',
        agente_id: '',
      });
      setSelectedFiles([]);
      console.log('Cerrando modal...');
      setShowNewRequestModal(false);

      // Enviar notificación al usuario
      try {
        await sendDemoNotification(
          'Solicitud creada',
          `Tu solicitud "${data.titulo}" ha sido enviada correctamente`,
          'success',
          { requestId: data.id }
        );
      } catch (notifError) {
        console.error('Error sending user notification:', notifError);
        // No bloquear si falla la notificación
      }

      // Si se asignó un agente, enviar notificación y CREAR CHAT AUTOMÁTICAMENTE
      if (data.agente_id && user) {
        try {
          // 1. Enviar notificación al agente
          await sendNotificationToUser(
            data.agente_id,
            'Nueva solicitud asignada',
            `Se te ha asignado la solicitud "${data.titulo}"`,
            'info',
            { requestId: data.id, type: 'assignment' }
          );

          // 2. CREAR CHAT AUTOMÁTICO entre solicitante y agente
          const agente = agents.find(a => a.id === data.agente_id);
          const agenteName = agente
            ? `${agente.nombre} ${agente.apellido_paterno}`
            : 'Agente';

          const chatRoomId = await createChatRoom(
            data.agente_id,
            data.id, // request_id para vincular
            {
              request_title: data.titulo,
              request_id: data.id,
              zona: user.zona,
              can_add_zone_members: true, // Permitir agregar miembros de la zona
              participant_names: [
                `${user.nombre} ${user.apellido_paterno}`,
                agenteName,
              ],
            }
          );

          console.log('✅ Chat creado automáticamente:', chatRoomId);

          // Enviar mensaje inicial del sistema
          if (chatRoomId) {
            // El chat se creó, notificar al usuario
            await sendDemoNotification(
              'Chat creado',
              `Se ha creado un chat con ${agenteName} para tu solicitud`,
              'success',
              { chatRoomId, requestId: data.id }
            );
          }
        } catch (notifError) {
          console.error(
            'Error creating chat or sending notification:',
            notifError
          );
          // No bloquear si falla la notificación o chat
        }
      }

      console.log('Mostrando alerta de éxito...');
      Alert.alert('Éxito', 'Solicitud creada correctamente');
      console.log('=== SOLICITUD CREADA EXITOSAMENTE ===');
    } catch (error: any) {
      console.error('❌ Unexpected error creating request:', error);

      let errorTitle = 'Error inesperado';
      let errorMessage = 'Ocurrió un error inesperado al crear la solicitud.';

      if (error instanceof Error) {
        if (
          error.message.includes('network') ||
          error.message.includes('Failed to fetch')
        ) {
          errorTitle = 'Error de conexión';
          errorMessage =
            'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Tiempo de espera agotado';
          errorMessage =
            'La operación tardó demasiado tiempo. Por favor intenta nuevamente.';
        } else if (error.message.includes('abort')) {
          errorTitle = 'Operación cancelada';
          errorMessage =
            'La operación fue cancelada. Por favor intenta nuevamente.';
        } else if (
          error.message.includes('parse') ||
          error.message.includes('JSON')
        ) {
          errorTitle = 'Error de formato';
          errorMessage =
            'Hubo un problema al procesar la respuesta del servidor. Por favor intenta nuevamente.';
        } else {
          errorMessage = `${error.message}\n\nPor favor intenta de nuevo o contacta al soporte técnico si el problema persiste.`;
        }
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'Entendido' }]);
    } finally {
      console.log('Finalizando proceso. Liberando botón...');
      setSubmitting(false);
    }
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    newStatus: string
  ) => {
    try {
      // Buscar la solicitud actual para validar la transición y obtener metadata
      const currentRequest = requests.find(r => r.id === requestId);
      if (!currentRequest) return;

      // Validación de transición (ejemplo simple)
      if (currentRequest.estatus === 'resuelto' && newStatus !== 'en_proceso' && newStatus !== 'cerrado') {
        Alert.alert('Transición inválida', 'No se puede cambiar el estado de una solicitud ya resuelta a menos que se reabra (En proceso).');
        return;
      }

      const now = new Date().toISOString();
      const updatedMetadata = {
        ...(currentRequest.metadata || {}),
        status_history: [
          ...(currentRequest.metadata?.status_history || []),
          {
            from: currentRequest.estatus,
            to: newStatus,
            timestamp: now,
            reason: `Cambio manual por ${user?.nombre} (${user?.rol})`,
          },
        ],
      };

      // Usar el cliente sin tipos estrictos para evitar errores de 'never'
      const { error } = await supabaseClient
        .from('requests')
        .update({
          estatus: newStatus,
          updated_at: now,
          metadata: updatedMetadata,
        } as any)
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        Alert.alert('Error', 'No se pudo actualizar el estado de la solicitud.');
        return;
      }

      // Actualizar la lista local
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
              ...req,
              estatus: newStatus as any,
              updated_at: now,
              metadata: updatedMetadata,
            }
            : req
        )
      );

      // Enviar notificación al usuario propietario de la solicitud (en tiempo real)
      if (currentRequest && currentRequest.usuario_id) {
        // Notificar al cliente que su solicitud cambió de estado
        try {
          await sendNotificationToUser(
            currentRequest.usuario_id,
            'Solicitud actualizada',
            `Tu solicitud "${currentRequest.titulo}" cambió a: ${getStatusText(newStatus)}`,
            'info',
            { requestId, newStatus }
          );
        } catch (notifError) {
          console.error('Error sending notification to customer:', notifError);
        }
      }

      // También mostrar notificación local al agente
      if (currentRequest) {
        await sendDemoNotification(
          'Estado actualizado',
          `La solicitud "${currentRequest.titulo}" cambió a: ${getStatusText(newStatus)}`,
          'success',
          { requestId }
        );
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  // Eliminar solicitud terminada (solo disponible para solicitudes con estatus resuelto/cerrado)
  const handleDeleteRequest = async (requestId: string, titulo: string) => {
    Alert.alert(
      'Eliminar solicitud',
      `¿Estás seguro de que deseas eliminar la solicitud "${titulo}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabaseClient
                .from('requests')
                .delete()
                .eq('id', requestId);

              if (error) {
                console.error('Error deleting request:', error);
                Alert.alert('Error', 'No se pudo eliminar la solicitud');
                return;
              }

              // Eliminar de la lista local
              setRequests(prev => prev.filter(req => req.id !== requestId));
              Alert.alert('Éxito', 'Solicitud eliminada correctamente');
            } catch (error) {
              console.error('Error deleting request:', error);
              Alert.alert('Error', 'No se pudo eliminar la solicitud');
            }
          },
        },
      ]
    );
  };

  const handleSearch = (filters: any) => {
    let filtered = requests;

    // Filtrar por texto
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        req =>
          req.titulo.toLowerCase().includes(query) ||
          req.mensaje.toLowerCase().includes(query) ||
          (req.agente && getFullName(req.agente).toLowerCase().includes(query))
      );
    }

    // Filtrar por estado
    if (filters.status.length > 0) {
      filtered = filtered.filter(req => filters.status.includes(req.estatus));
    }

    // Filtrar por prioridad
    if (filters.priority.length > 0) {
      filtered = filtered.filter(req =>
        filters.priority.includes(req.prioridad)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleClearSearch = () => {
    setFilteredRequests(requests);
  };

  // Apply inline filters (status, agent, client) for agent/admin view
  const applyInlineFilters = useCallback(() => {
    let filtered = requests;

    if (activeStatusFilters.length > 0) {
      filtered = filtered.filter(req => activeStatusFilters.includes(req.estatus));
    }

    if (activeAgentFilter) {
      filtered = filtered.filter(req => req.agente_id === activeAgentFilter);
    }

    if (activeClientFilter) {
      filtered = filtered.filter(req => req.usuario_id === activeClientFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, activeStatusFilters, activeAgentFilter, activeClientFilter]);

  useEffect(() => {
    if (user?.rol === 'agent' || user?.rol === 'admin') {
      applyInlineFilters();
    }
  }, [activeStatusFilters, activeAgentFilter, activeClientFilter, applyInlineFilters]);

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setActiveStatusFilters([]);
    setActiveAgentFilter(null);
    setActiveClientFilter(null);
  };

  // Get unique clients from requests for client filter
  const uniqueClients = useMemo(() => {
    const clientMap = new Map<string, { id: string; name: string }>();
    requests.forEach(req => {
      if (req.usuario_id && req.usuario) {
        clientMap.set(req.usuario_id, {
          id: req.usuario_id,
          name: getFullName(req.usuario),
        });
      }
    });
    return Array.from(clientMap.values());
  }, [requests]);

  const handleFileSelected = (file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  }) => {
    setSelectedFiles(prev => [...prev, file]);
  };

  const handleFileRemoved = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartChat = async (request: RequestWithRelations) => {
    try {
      // Determinar el ID del otro participante
      let otherParticipantId: string;
      let otherParticipantName: string;

      if (user?.rol === 'customer') {
        // Si soy cliente, abrir chat con el agente
        if (!request.agente_id || !request.agente) {
          Alert.alert(
            'Sin agente asignado',
            'Esta solicitud no tiene un agente asignado aún. Espera a que un agente sea asignado para iniciar el chat.'
          );
          return;
        }
        otherParticipantId = request.agente_id;
        otherParticipantName = getFullName(request.agente);
      } else {
        // Si soy agente o admin, abrir chat con el cliente
        if (!request.usuario_id || !request.usuario) {
          Alert.alert(
            'Error',
            'No se pudo encontrar el usuario de esta solicitud'
          );
          return;
        }
        otherParticipantId = request.usuario_id;
        otherParticipantName = getFullName(request.usuario);
      }

      // Crear o obtener el chat room
      const roomId = await createChatRoom(
        otherParticipantId,
        otherParticipantName,
        request.id
      );

      // Navegar al chat
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'No se pudo iniciar el chat. Intenta de nuevo.');
    }
  };

  // Simular cambios de estado automáticos para demo
  useEffect(() => {
    if (requests.length === 0) return;

    const interval = setInterval(() => {
      // Cambiar estado aleatoriamente para demo
      if (Math.random() > 0.95) {
        const pendingRequests = requests.filter(r =>
          ['nuevo', 'asignado', 'en_proceso'].includes(r.estatus)
        );

        if (pendingRequests.length > 0) {
          const randomRequest =
            pendingRequests[Math.floor(Math.random() * pendingRequests.length)];
          let newStatus = randomRequest.estatus;

          if (randomRequest.estatus === 'nuevo') {
            newStatus = 'asignado';
          } else if (randomRequest.estatus === 'asignado') {
            newStatus = 'en_proceso';
          } else if (
            randomRequest.estatus === 'en_proceso' &&
            Math.random() > 0.7
          ) {
            newStatus = 'resuelto';
          }

          if (newStatus !== randomRequest.estatus) {
            handleUpdateRequestStatus(randomRequest.id, newStatus);
          }
        }
      }
    }, 15000); // Cada 15 segundos

    return () => clearInterval(interval);
  }, [requests]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Solicitudes</Text>
              <Text style={styles.subtitle}>Cargando...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Solicitudes</Text>
              <Text style={styles.subtitle}>Error al cargar</Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequests}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Solicitudes</Text>
            <Text style={styles.subtitle}>
              {requests.length} solicitud{requests.length !== 1 ? 'es' : ''}
              {user?.rol === 'customer' ? '' : ' asignadas'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewRequestModal(true)}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros inline - Solo para agentes y admins */}
      {(user?.rol === 'agent' || user?.rol === 'admin') && (
        <View style={styles.filterSection}>
          {/* Filtro por estatus (semáforo) */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Estatus:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {[
                { key: 'sin_atender', label: 'Sin atender', color: '#ef4444' },
                { key: 'nuevo', label: 'Nueva', color: '#f59e0b' },
                { key: 'en_proceso', label: 'En proceso', color: '#22c55e' },
                { key: 'asignado', label: 'Asignado', color: '#22c55e' },
                { key: 'resuelto', label: 'Terminada', color: '#3b82f6' },
                { key: 'cerrado', label: 'Cerrada', color: '#3b82f6' },
              ].map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.filterChip,
                    activeStatusFilters.includes(s.key) && { backgroundColor: s.color, borderColor: s.color },
                  ]}
                  onPress={() => toggleStatusFilter(s.key)}
                >
                  <Circle size={10} color={activeStatusFilters.includes(s.key) ? '#fff' : s.color} fill={activeStatusFilters.includes(s.key) ? '#fff' : s.color} />
                  <Text style={[styles.filterChipText, activeStatusFilters.includes(s.key) && styles.filterChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtro por agente */}
          {agents.length > 0 && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Agente:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {agents.map(agent => (
                  <TouchableOpacity
                    key={agent.id}
                    style={[
                      styles.filterChip,
                      activeAgentFilter === agent.id && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveAgentFilter(prev => prev === agent.id ? null : agent.id)}
                  >
                    <UserIcon size={10} color={activeAgentFilter === agent.id ? '#fff' : '#6b7280'} />
                    <Text style={[styles.filterChipText, activeAgentFilter === agent.id && styles.filterChipTextActive]}>
                      {getAgentFullName(agent)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filtro por cliente */}
          {uniqueClients.length > 0 && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Cliente:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {uniqueClients.map(client => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.filterChip,
                      activeClientFilter === client.id && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveClientFilter(prev => prev === client.id ? null : client.id)}
                  >
                    <Text style={[styles.filterChipText, activeClientFilter === client.id && styles.filterChipTextActive]}>
                      {client.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Botón limpiar filtros */}
          {(activeStatusFilters.length > 0 || activeAgentFilter || activeClientFilter) && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
              <X size={14} color="#6b7280" />
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredRequests.map(request => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
            onPress={() => {
              // Mostrar modal de cambio de estado (solo para agentes y admins)
              if (user?.rol === 'agent' || user?.rol === 'admin') {
                setStatusChangeRequest(request);
              }
            }}
          >
            <View style={styles.requestHeader}>
              <View style={styles.statusAndAreaContainer}>
                <View style={styles.requestStatus}>
                  {getStatusIcon(checkRequestExpiration(request))}
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(checkRequestExpiration(request)) },
                    ]}
                  >
                    {getStatusText(checkRequestExpiration(request))}
                  </Text>
                </View>
                <View
                  style={[
                    styles.areaBadge,
                    { backgroundColor: `${getAreaColor(request.tipo)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.areaBadgeText,
                      { color: getAreaColor(request.tipo) },
                    ]}
                  >
                    {getAreaName(request.tipo)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDate}>
                {formatDate(request.created_at)}
              </Text>
            </View>

            <Text style={styles.requestTitle}>{request.titulo}</Text>
            <Text style={styles.requestMessage} numberOfLines={3}>
              {request.mensaje}
            </Text>

            {/* Información del usuario (para agentes y admins) */}
            {(user?.rol === 'agent' || user?.rol === 'admin') &&
              request.usuario && (
                <>
                  <View style={styles.userInfo}>
                    <UserIcon size={16} color="#6b7280" />
                    <Text style={styles.userName}>
                      Cliente: {getFullName(request.usuario)} -{' '}
                      {request.usuario.empresa}
                    </Text>
                  </View>
                  {request.usuario.zona && (
                    <View style={styles.zoneInfo}>
                      <MapPin size={14} color="#3b82f6" />
                      <Text style={styles.zoneText}>
                        Zona: {request.usuario.zona}
                      </Text>
                    </View>
                  )}
                </>
              )}

            {/* Información del agente (para clientes) */}
            {user?.rol === 'customer' && request.agente && (
              <View style={styles.agentInfo}>
                <UserIcon size={16} color="#6b7280" />
                <Text style={styles.agentName}>
                  Agente: {getFullName(request.agente)} -{' '}
                  {request.agente.categoria}
                </Text>
              </View>
            )}

            {/* Mostrar si no hay agente asignado */}
            {!request.agente_id && (
              <View style={styles.noAgentInfo}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.noAgentText}>Sin agente asignado</Text>
              </View>
            )}

            {/* Archivos adjuntos */}
            {request.archivos && request.archivos.length > 0 && (
              <View style={styles.attachmentsInfo}>
                <Text style={styles.attachmentsText}>
                  📎 {request.archivos.length} archivo
                  {request.archivos.length !== 1 ? 's' : ''} adjunto
                  {request.archivos.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Feedback si está resuelto */}
            {request.estatus === 'resuelto' && request.feedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Comentarios:</Text>
                <Text style={styles.feedbackText}>{request.feedback}</Text>
                {request.rating && (
                  <Text style={styles.ratingText}>
                    Calificación: {'⭐'.repeat(request.rating)} (
                    {request.rating}/5)
                  </Text>
                )}
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              {/* Botón Charlar */}
              <TouchableOpacity
                style={styles.chatButton}
                onPress={e => {
                  e.stopPropagation();
                  handleStartChat(request);
                }}
              >
                <MessageCircle size={18} color="#ffffff" />
                <Text style={styles.chatButtonText}>Charlar</Text>
              </TouchableOpacity>

              {/* Botón Eliminar (solo para solicitudes terminadas) */}
              {(request.estatus === 'resuelto' ||
                request.estatus === 'cerrado') && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={e => {
                      e.stopPropagation();
                      handleDeleteRequest(request.id, request.titulo);
                    }}
                  >
                    <Trash2 size={18} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {requests.length === 0
                ? 'No tienes solicitudes aún'
                : 'No se encontraron solicitudes'}
            </Text>
            <Text style={styles.emptySubtext}>
              {requests.length === 0
                ? 'Toca el botón + para crear tu primera solicitud'
                : 'Intenta con otros filtros de búsqueda'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Nueva Solicitud */}
      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Solicitud</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNewRequestModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Título *</Text>
                <Text
                  style={[
                    styles.charCounter,
                    newRequest.titulo.length < 5 && styles.charCounterWarning,
                    newRequest.titulo.length > 200 && styles.charCounterError,
                  ]}
                >
                  {newRequest.titulo.length}/200
                </Text>
              </View>
              <TextInput
                style={[
                  styles.formInput,
                  newRequest.titulo.length > 200 && styles.formInputError,
                ]}
                placeholder="Describe brevemente tu solicitud"
                placeholderTextColor="#9ca3af"
                value={newRequest.titulo}
                onChangeText={text =>
                  setNewRequest(prev => ({ ...prev, titulo: text }))
                }
                maxLength={250}
              />
              {newRequest.titulo.length > 0 && newRequest.titulo.length < 5 && (
                <Text style={styles.validationHint}>Mínimo 5 caracteres</Text>
              )}
              {newRequest.titulo.length > 200 && (
                <Text style={styles.validationError}>
                  El título no puede exceder 200 caracteres
                </Text>
              )}
            </View>

            {agents.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Agente Destino (Opcional)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.agentsScroll}
                >
                  {agents.map(agent => (
                    <TouchableOpacity
                      key={agent.id}
                      style={[
                        styles.agentChip,
                        newRequest.agente_id === agent.id &&
                        styles.agentChipSelected,
                      ]}
                      onPress={() =>
                        setNewRequest(prev => ({
                          ...prev,
                          agente_id: agent.id,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.agentChipText,
                          newRequest.agente_id === agent.id &&
                          styles.agentChipTextSelected,
                        ]}
                      >
                        {getAgentFullName(agent)}
                      </Text>
                      <Text
                        style={[
                          styles.agentChipCategory,
                          newRequest.agente_id === agent.id &&
                          styles.agentChipCategorySelected,
                        ]}
                      >
                        {agent.categoria}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Mensaje *</Text>
                <Text
                  style={[
                    styles.charCounter,
                    newRequest.mensaje.length > 0 &&
                    newRequest.mensaje.length < 10 &&
                    styles.charCounterWarning,
                  ]}
                >
                  {newRequest.mensaje.length} caracteres
                </Text>
              </View>
              <FileUploadComponent
                onFileSelected={handleFileSelected}
                onFileRemoved={handleFileRemoved}
                files={selectedFiles}
                maxFiles={3}
                maxSizeInMB={5}
              />
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Describe tu solicitud en detalle..."
                placeholderTextColor="#9ca3af"
                value={newRequest.mensaje}
                onChangeText={text =>
                  setNewRequest(prev => ({ ...prev, mensaje: text }))
                }
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {newRequest.mensaje.length > 0 &&
                newRequest.mensaje.length < 10 && (
                  <Text style={styles.validationHint}>
                    Mínimo 10 caracteres
                  </Text>
                )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleCreateRequest}
              disabled={submitting}
              activeOpacity={submitting ? 1 : 0.7}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                </>
              ) : (
                <>
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Espacio inferior para evitar que el teclado tape el botón */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Cambiar Estado */}
      <Modal
        visible={!!statusChangeRequest}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusChangeRequest(null)}
      >
        <TouchableOpacity
          style={styles.statusModalOverlay}
          activeOpacity={1}
          onPress={() => setStatusChangeRequest(null)}
        >
          <View style={styles.statusModalContent}>
            <Text style={styles.statusModalTitle}>Cambiar Estado</Text>
            {statusChangeRequest && (
              <Text style={styles.statusModalSubtitle}>
                {statusChangeRequest.titulo}
              </Text>
            )}

            <View style={styles.statusModalButtons}>
              <TouchableOpacity
                style={[styles.statusModalBtn, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}
                onPress={() => {
                  if (statusChangeRequest) {
                    handleUpdateRequestStatus(statusChangeRequest.id, 'sin_atender');
                    setStatusChangeRequest(null);
                  }
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.statusModalBtnText, { color: '#ef4444' }]}>Sin atender</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusModalBtn, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}
                onPress={() => {
                  if (statusChangeRequest) {
                    handleUpdateRequestStatus(statusChangeRequest.id, 'nuevo');
                    setStatusChangeRequest(null);
                  }
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.statusModalBtnText, { color: '#f59e0b' }]}>Nueva</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusModalBtn, { backgroundColor: '#f0fdf4', borderColor: '#22c55e' }]}
                onPress={() => {
                  if (statusChangeRequest) {
                    handleUpdateRequestStatus(statusChangeRequest.id, 'en_proceso');
                    setStatusChangeRequest(null);
                  }
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                <Text style={[styles.statusModalBtnText, { color: '#22c55e' }]}>En proceso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusModalBtn, { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                onPress={() => {
                  if (statusChangeRequest) {
                    handleUpdateRequestStatus(statusChangeRequest.id, 'resuelto');
                    setStatusChangeRequest(null);
                  }
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.statusModalBtnText, { color: '#3b82f6' }]}>Marcar como Resuelto</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.statusModalCancel}
              onPress={() => setStatusChangeRequest(null)}
            >
              <Text style={styles.statusModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1e40af',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    minWidth: 52,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginRight: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusAndAreaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  areaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  areaBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  requestDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  requestTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    flex: 1,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  zoneText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  agentName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    flex: 1,
  },
  noAgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noAgentText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#f59e0b',
  },
  attachmentsInfo: {
    marginBottom: 8,
  },
  attachmentsText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  feedbackContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  feedbackLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e3a8a',
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  charCounter: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  charCounterWarning: {
    color: '#f59e0b',
  },
  charCounterError: {
    color: '#ef4444',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  formTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  validationHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#f59e0b',
    marginTop: 4,
  },
  validationError: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
    marginTop: 4,
  },
  typeScroll: {
    flexGrow: 0,
  },
  typeChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  typeChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  typeChipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  typeChipTextSelected: {
    color: '#1e40af',
  },
  priorityScroll: {
    flexGrow: 0,
  },
  priorityChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  priorityChipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  priorityChipTextSelected: {
    color: '#ffffff',
  },
  agentsScroll: {
    flexGrow: 0,
  },
  agentChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
  },
  agentChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  agentChipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  agentChipTextSelected: {
    color: '#1e40af',
  },
  agentChipCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  agentChipCategorySelected: {
    color: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  statusModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusModalButtons: {
    gap: 10,
  },
  statusModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  statusModalBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statusModalCancel: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
  },
  statusModalCancelText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
});
