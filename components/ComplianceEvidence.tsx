import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import {
  FileText,
  Upload,
  PenTool,
  CheckSquare,
  X,
  CheckCircle,
  Check,
  File,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react-native';
import { useCompliance } from '@/contexts/ComplianceContext';
import { uploadFileToStorage } from '@/utils/fileUpload';
import BRAND_COLORS from '@/constants/colors';
const colors = BRAND_COLORS;

const { width, height } = Dimensions.get('window');

interface ComplianceEvidenceProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
  onEvidenceSubmitted?: () => void;
}

type EvidenceType = 'file' | 'signature' | 'checklist' | 'note';

export const ComplianceEvidence: React.FC<ComplianceEvidenceProps> = ({
  requestId,
  visible,
  onClose,
  onEvidenceSubmitted,
}) => {
  const { submitEvidence, submitDigitalSignature } = useCompliance();

  const [selectedType, setSelectedType] = useState<EvidenceType>('file');
  const [uploading, setUploading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', text: 'Revisé la solicitud completament', completed: false },
    {
      id: '2',
      text: 'Verifiqué todos los documentos adjuntos',
      completed: false,
    },
    {
      id: '3',
      text: 'Confirmé la información con el solicitante',
      completed: false,
    },
  ]);
  const [signaturePadVisible, setSignaturePadVisible] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const signatureRef = useRef<any>(null);

  // File upload handler
  const handleFileUpload = async () => {
    try {
      setUploading(true);

      // Use existing file upload component logic or open file picker
      // For now, this is a placeholder - you'd integrate with FileUploadComponent
      // or use expo-document-picker directly

      Alert.alert(
        'Subir Archivo',
        'Funcionalidad de subida de archivos se integrará con FileUploadComponent'
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  // Signature handler
  const handleSignature = async (signature: string) => {
    try {
      setUploading(true);
      setSignatureData(signature);

      // Submit as digital signature
      await submitDigitalSignature(
        'request',
        requestId,
        signature,
        'Confirmo que he revisado y validado esta solicitud'
      );

      // Also submit as compliance evidence
      await submitEvidence({
        request_id: requestId,
        evidence_type: 'signature',
        signature_data: {
          signature,
          timestamp: new Date().toISOString(),
          legal_text: 'Confirmo que he revisado y validado esta solicitud',
        },
      });

      Alert.alert('Éxito', 'Firma digital guardada correctamente');
      onEvidenceSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting signature:', error);
      Alert.alert('Error', 'No se pudo guardar la firma digital');
    } finally {
      setUploading(false);
    }
  };

  // Checklist handler
  const handleChecklistSubmit = async () => {
    try {
      setUploading(true);

      const completedItems = checklistItems.filter(item => item.completed);
      if (completedItems.length === 0) {
        Alert.alert('Validación', 'Debe completar al menos un ítem');
        return;
      }

      await submitEvidence({
        request_id: requestId,
        evidence_type: 'checklist',
        checklist_response: {
          items: checklistItems,
          completedCount: completedItems.length,
          totalCount: checklistItems.length,
        },
      });

      Alert.alert('Éxito', 'Checklist enviado correctamente');
      onEvidenceSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting checklist:', error);
      Alert.alert('Error', 'No se pudo enviar el checklist');
    } finally {
      setUploading(false);
    }
  };

  // Note handler
  const handleNoteSubmit = async () => {
    if (!noteText.trim()) {
      Alert.alert('Validación', 'La nota no puede estar vacía');
      return;
    }

    try {
      setUploading(true);

      await submitEvidence({
        request_id: requestId,
        evidence_type: 'note',
        note_text: noteText,
      });

      Alert.alert('Éxito', 'Nota guardada correctamente');
      setNoteText('');
      onEvidenceSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting note:', error);
      Alert.alert('Error', 'No se pudo guardar la nota');
    } finally {
      setUploading(false);
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Signature pad handlers
  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSignatureConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleSignatureSave = (signature: string) => {
    handleSignature(signature);
    setSignaturePadVisible(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <FileText size={24} color={colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Adjuntar Evidencia</Text>
              <Text style={styles.headerSubtitle}>
                Request ID: {requestId.slice(0, 8)}...
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Evidence Type Selector */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'file' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('file')}
            >
              <Upload
                size={20}
                color={
                  selectedType === 'file' ? '#ffffff' : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'file' && styles.typeButtonTextActive,
                ]}
              >
                Archivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'signature' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('signature')}
            >
              <PenTool
                size={20}
                color={
                  selectedType === 'signature'
                    ? '#ffffff'
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'signature' && styles.typeButtonTextActive,
                ]}
              >
                Firma
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'checklist' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('checklist')}
            >
              <CheckSquare
                size={20}
                color={
                  selectedType === 'checklist'
                    ? '#ffffff'
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'checklist' && styles.typeButtonTextActive,
                ]}
              >
                Lista
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'note' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('note')}
            >
              <FileText
                size={20}
                color={
                  selectedType === 'note' ? '#ffffff' : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'note' && styles.typeButtonTextActive,
                ]}
              >
                Nota
              </Text>
            </TouchableOpacity>
          </View>

          {/* Evidence Type Content */}
          <View style={styles.evidenceContent}>
            {/* File Upload */}
            {selectedType === 'file' && (
              <View style={styles.fileSection}>
                <Text style={styles.sectionTitle}>
                  Subir Archivo como Evidencia
                </Text>
                <Text style={styles.sectionDescription}>
                  Adjunte documentos, imágenes o cualquier archivo que sirva
                  como evidencia de esta solicitud.
                </Text>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleFileUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Subiendo...</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>
                        Seleccionar Archivo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.fileInfo}>
                  <File size={16} color={colors.textSecondary} />
                  <Text style={styles.fileInfoText}>
                    Máximo 5MB por archivo (PDF, imágenes, documentos)
                  </Text>
                </View>
              </View>
            )}

            {/* Digital Signature */}
            {selectedType === 'signature' && (
              <View style={styles.signatureSection}>
                <Text style={styles.sectionTitle}>Firma Digital</Text>
                <Text style={styles.sectionDescription}>
                  Firme digitalmente para confirmar que ha revisado y validado
                  esta solicitud.
                </Text>

                <TouchableOpacity
                  style={styles.signatureButton}
                  onPress={() => setSignaturePadVisible(true)}
                  disabled={uploading}
                >
                  <PenTool size={20} color="#ffffff" />
                  <Text style={styles.signatureButtonText}>
                    Abrir Pad de Firma
                  </Text>
                </TouchableOpacity>

                {signatureData && (
                  <View style={styles.signaturePreview}>
                    <CheckCircle size={20} color={colors.success} />
                    <Text style={styles.signaturePreviewText}>
                      Firma capturada correctamente
                    </Text>
                  </View>
                )}

                <Text style={styles.legalText}>
                  Al firmar, confirmo que he revisado y validado la información
                  contenida en esta solicitud.
                </Text>
              </View>
            )}

            {/* Checklist */}
            {selectedType === 'checklist' && (
              <View style={styles.checklistSection}>
                <Text style={styles.sectionTitle}>Lista de Verificación</Text>
                <Text style={styles.sectionDescription}>
                  Complete los ítems como confirmación de revisión.
                </Text>

                <View style={styles.checklist}>
                  {checklistItems.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(item.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          item.completed && styles.checkboxChecked,
                        ]}
                      >
                        {item.completed && <Check size={16} color="#ffffff" />}
                      </View>
                      <Text style={styles.checklistItemText}>{item.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleChecklistSubmit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Enviando...</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Enviar Lista</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Note */}
            {selectedType === 'note' && (
              <View style={styles.noteSection}>
                <Text style={styles.sectionTitle}>Nota de Evidencia</Text>
                <Text style={styles.sectionDescription}>
                  Agregue observaciones o comentarios como evidencia.
                </Text>

                <TextInput
                  style={styles.noteInput}
                  placeholder="Escriba su nota aquí..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  value={noteText}
                  onChangeText={setNoteText}
                  editable={!uploading}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleNoteSubmit}
                  disabled={uploading || !noteText.trim()}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Guardando...</Text>
                    </>
                  ) : (
                    <>
                      <FileText size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Guardar Nota</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Signature Pad Modal */}
      <Modal
        visible={signaturePadVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSignaturePadVisible(false)}
      >
        <View style={styles.signaturePadContainer}>
          <View style={styles.signaturePadHeader}>
            <Text style={styles.signaturePadTitle}>Firme aquí</Text>
            <View style={styles.signaturePadActions}>
              <TouchableOpacity
                style={styles.signaturePadButton}
                onPress={handleSignatureClear}
              >
                <Text style={styles.signaturePadButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.signaturePadButton,
                  styles.signaturePadButtonConfirm,
                ]}
                onPress={handleSignatureConfirm}
              >
                <Text style={styles.signaturePadButtonTextConfirm}>
                  Confirmar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.signaturePadButton,
                  styles.signaturePadButtonClose,
                ]}
                onPress={() => setSignaturePadVisible(false)}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.signaturePadContent}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleSignatureSave}
              onEmpty={() => Alert.alert('Aviso', 'Firma vacía')}
              descriptionText=""
              clearText="Limpiar"
              confirmText="Confirmar"
              webStyle={`
                .m-signature-pad--body {background: transparent;}
                .m-signature-pad--footer {display: none; margin: 0px;}
              `}
              imageType="image/svg+xml"
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  evidenceContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  fileSection: {
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  fileInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    flex: 1,
  },
  signatureSection: {
    gap: 16,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  signatureButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  signaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  signaturePreviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.success,
  },
  legalText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checklistSection: {
    gap: 16,
  },
  checklist: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  noteSection: {
    gap: 16,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  signaturePadContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  signaturePadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  signaturePadTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  signaturePadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  signaturePadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  signaturePadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  signaturePadButtonConfirm: {
    backgroundColor: colors.primary,
  },
  signaturePadButtonTextConfirm: {
    color: '#ffffff',
  },
  signaturePadButtonClose: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
  },
  signaturePadContent: {
    flex: 1,
    margin: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
