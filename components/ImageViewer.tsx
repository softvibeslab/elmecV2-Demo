import React from 'react';
import {
  Platform,
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Text,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ImageViewerProps {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
}

/**
 * Platform-agnostic image viewer component
 * Uses react-native-image-viewing on native, custom modal on web
 */
export default function ImageViewer({
  images,
  imageIndex,
  visible,
  onRequestClose,
}: ImageViewerProps) {
  // For native platforms, use react-native-image-viewing if available
  // Use lazy loading to prevent bundling issues on web
  const [nativeViewer, setNativeViewer] = React.useState<any>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'web' && !nativeViewer) {
      // Lazy load only on native platforms
      import('react-native-image-viewing')
        .then(mod => {
          setNativeViewer(() => mod.default);
        })
        .catch(() => {
          console.warn('react-native-image-viewing not available');
        });
    }
  }, [Platform.OS]);

  if (Platform.OS !== 'web' && nativeViewer && visible) {
    const NativeViewer = nativeViewer;

    return (
      <NativeViewer
        images={images}
        imageIndex={imageIndex}
        visible={visible}
        onRequestClose={onRequestClose}
      />
    );
  }

  // For web, use custom modal implementation
  const { width, height } = Dimensions.get('window');
  const currentImage = images[imageIndex];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onRequestClose}>
          <X size={32} color="#ffffff" />
        </TouchableOpacity>

        {/* Image container with scroll/zoom */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: currentImage?.uri }}
            style={[
              styles.image,
              {
                maxWidth: width,
                maxHeight: height,
              },
            ]}
            resizeMode="contain"
          />
        </ScrollView>

        {/* Image counter */}
        {images.length > 1 && (
          <View style={styles.counter}>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {imageIndex + 1} / {images.length}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  counterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
