import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { diceImageNames, type DiceImageName } from './diceImages';
import { getDicePhotoSource, saveDicePhotoOverride } from './dicePhotoOverrides';

type Feedback = { kind: 'error' | 'success'; text: string } | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  onImageChanged: () => void;
};

export function DicePhotoManagerModal({ visible, onClose, onImageChanged }: Props) {
  const [selected, setSelected] = useState<DiceImageName | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setFeedback(null);
  }, [visible]);

  async function saveResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || selected === null) return;

    const jpegBase64 = result.assets[0]?.base64;
    if (!jpegBase64) {
      setFeedback({ kind: 'error', text: 'Não foi possível ler a foto selecionada.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveDicePhotoOverride(selected, jpegBase64);
      setRevision((value) => value + 1);
      onImageChanged();
      setFeedback({ kind: 'success', text: `Foto da combinação ${selected} substituída.` });
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível salvar a nova foto.' });
    } finally {
      setSaving(false);
    }
  }

  async function openGallery() {
    setFeedback(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFeedback({ kind: 'error', text: 'Permita o acesso às fotos para abrir a galeria.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      await saveResult(result);
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível abrir a galeria.' });
    }
  }

  async function openCamera() {
    setFeedback(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFeedback({ kind: 'error', text: 'Permita o acesso à câmera para tirar uma foto.' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
        cameraType: ImagePicker.CameraType.back,
      });
      await saveResult(result);
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível abrir a câmera.' });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fotos dos dados</Text>
            <Text style={styles.subtitle}>Escolha uma das combinações</Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar fotos" hitSlop={12}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.combinationGrid}>
            {diceImageNames.map((imageName) => (
              <Pressable
                key={imageName}
                onPress={() => { setSelected(imageName); setFeedback(null); }}
                style={[styles.combinationButton, selected === imageName && styles.selectedCombination]}
                accessibilityRole="button"
                accessibilityLabel={`Combinação ${imageName}`}
                accessibilityState={{ selected: selected === imageName }}
              >
                <Text style={[styles.combinationText, selected === imageName && styles.selectedCombinationText]}>{imageName.toString()[0] + " - " + imageName.toString()[1]}</Text>
              </Pressable>
            ))}
          </View>

          {selected !== null && (
            <View style={styles.selectedContent}>
              <Text style={styles.selectedTitle}>Combinação {selected.toString()[0] + " - " + selected.toString()[1]}</Text>
              <Image
                key={`${selected}-${revision}`}
                source={getDicePhotoSource(selected)}
                style={styles.preview}
                resizeMode="contain"
                accessibilityLabel={`Foto da combinação ${selected}`}
              />
              <View style={styles.actions}>
                <Pressable style={[styles.actionButton, saving && styles.disabled]} onPress={openGallery} disabled={saving} accessibilityRole="button" accessibilityLabel="Abrir galeria">
                  <Text style={styles.actionText}>Abrir galeria</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.cameraButton, saving && styles.disabled]} onPress={openCamera} disabled={saving} accessibilityRole="button" accessibilityLabel="Abrir câmera">
                  <Text style={styles.actionText}>Abrir câmera</Text>
                </Pressable>
              </View>
            </View>
          )}

          {saving && <ActivityIndicator color="#79d43f" style={styles.loader} />}
          {feedback && <Text accessibilityRole="alert" style={[styles.feedback, feedback.kind === 'error' ? styles.error : styles.success]}>{feedback.text}</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  header: { minHeight: 78, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#282828' },
  title: { color: '#f0f0f2', fontSize: 22, fontWeight: '600' },
  subtitle: { color: '#929296', fontSize: 13, marginTop: 3 },
  close: { color: '#f0f0f2', fontSize: 34, lineHeight: 40 },
  content: { padding: 20, paddingBottom: 36 },
  combinationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  combinationButton: { width: '21.5%', minWidth: 62, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: '#383838', backgroundColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center' },
  selectedCombination: { borderColor: '#79d43f', backgroundColor: '#315b25' },
  combinationText: { color: '#f0f0f2', fontSize: 17, fontWeight: '600' },
  selectedCombinationText: { color: '#ffffff' },
  emptyText: { color: '#929296', fontSize: 15, lineHeight: 22, textAlign: 'center', paddingVertical: 48 },
  selectedContent: { marginTop: 24 },
  selectedTitle: { color: '#f0f0f2', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  preview: { width: '100%', height: 300, borderRadius: 18, backgroundColor: '#151515' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, minHeight: 52, borderRadius: 26, backgroundColor: '#315b25', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cameraButton: { backgroundColor: '#369900' },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  loader: { marginTop: 18 },
  feedback: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 16 },
  error: { color: '#fb6969' },
  success: { color: '#79d43f' },
});
