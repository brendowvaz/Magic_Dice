import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { buildImageHtml } from './imageHtml';
import { loadS3Settings, s3ImageUrl, saveS3Settings, type S3Settings } from './s3Settings';

type Feedback = { kind: 'error' | 'success'; text: string } | null;

export function HtmlCopyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [page, setPage] = useState<'copy' | 'settings'>('copy');
  const [settings, setSettings] = useState<S3Settings | null>(null);
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('');
  const [awsAccessKeyIdInput, setAwsAccessKeyIdInput] = useState('');
  const [awsSecretAccessKeyInput, setAwsSecretAccessKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setPage('copy');
    setFeedback(null);
    setLoading(true);
    loadS3Settings()
      .then((saved) => {
        if (!active) return;
        setSettings(saved);
        setS3Bucket(saved.s3Bucket);
        setS3Region(saved.s3Region);
        setAwsAccessKeyIdInput('');
        setAwsSecretAccessKeyInput('');
      })
      .catch(() => {
        if (active)
          setFeedback({ kind: 'error', text: 'Não foi possível ler as configurações do S3.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible]);

  function openSettings(message?: string) {
    setS3Bucket(settings?.s3Bucket ?? '');
    setS3Region(settings?.s3Region ?? '');
    setAwsAccessKeyIdInput('');
    setAwsSecretAccessKeyInput('');
    setPage('settings');
    setFeedback(message ? { kind: 'error', text: message } : null);
  }

  async function saveSettings() {
    const next: S3Settings = {
      s3Bucket: s3Bucket.trim(),
      s3Region: s3Region.trim().toLowerCase(),
      awsAccessKeyId: awsAccessKeyIdInput.trim() || settings?.awsAccessKeyId || '',
      awsSecretAccessKey: awsSecretAccessKeyInput.trim() || settings?.awsSecretAccessKey || '',
    };

    if (!next.s3Bucket || !next.s3Region || !next.awsAccessKeyId || !next.awsSecretAccessKey) {
      setFeedback({ kind: 'error', text: 'Preencha todos os campos do S3.' });
      return;
    }
    if (!/^[a-z]{2}(?:-gov)?-[a-z]+-\d+$/.test(next.s3Region)) {
      setFeedback({ kind: 'error', text: 'Digite uma região AWS válida, como sa-east-1.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await saveS3Settings(next);
      setSettings(next);
      setAwsAccessKeyIdInput('');
      setAwsSecretAccessKeyInput('');
      setPage('copy');
      setFeedback({ kind: 'success', text: 'Configurações do S3 salvas.' });
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível salvar a configuração no aparelho.' });
    } finally {
      setLoading(false);
    }
  }

  async function copyHtml() {
    setFeedback(null);
    if (!settings?.s3Bucket || !settings.s3Region) {
      openSettings('Configure o bucket e a região para copiar o HTML.');
      return;
    }

    try {
      const html = buildImageHtml(s3ImageUrl(settings.s3Bucket, settings.s3Region));
      const copied = await Clipboard.setStringAsync(html);
      if (!copied) throw new Error('Clipboard unavailable');
      setFeedback({ kind: 'success', text: 'HTML copiado.' });
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível copiar o HTML.' });
    }
  }

  const configuredUrl =
    settings?.s3Bucket && settings.s3Region
      ? s3ImageUrl(settings.s3Bucket, settings.s3Region)
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Fechar"
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{page === 'copy' ? 'Copiar HTML' : 'Configurar S3'}</Text>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {loading && !settings ? (
                <ActivityIndicator color="#79d43f" style={styles.loader} />
              ) : page === 'copy' ? (
                <>
                  <Pressable
                    style={[styles.primaryButton, loading && styles.disabledButton]}
                    onPress={copyHtml}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Copiar HTML"
                  >
                    <Text style={styles.primaryButtonText}>Copiar HTML</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => openSettings()}
                    accessibilityRole="button"
                    accessibilityLabel="Configurar S3"
                  >
                    <Text style={styles.secondaryText}>Configurar S3</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Nome do bucket</Text>
                  <TextInput
                    style={styles.input}
                    value={s3Bucket}
                    onChangeText={setS3Bucket}
                    placeholder="meu-bucket"
                    placeholderTextColor="#777777"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Nome do bucket S3"
                  />
                  <Text style={styles.label}>Região AWS</Text>
                  <TextInput
                    style={styles.input}
                    value={s3Region}
                    onChangeText={setS3Region}
                    placeholder="sa-east-1"
                    placeholderTextColor="#777777"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Região AWS"
                  />
                  <Text style={styles.label}>AWS Access Key ID</Text>
                  <TextInput
                    style={styles.input}
                    value={awsAccessKeyIdInput}
                    onChangeText={setAwsAccessKeyIdInput}
                    placeholder={
                      settings?.awsAccessKeyId
                        ? 'Chave salva; deixe em branco para manter'
                        : 'Cole o Access Key ID'
                    }
                    placeholderTextColor="#777777"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="AWS Access Key ID"
                  />
                  <Text style={styles.label}>AWS Secret Access Key</Text>
                  <TextInput
                    style={styles.input}
                    value={awsSecretAccessKeyInput}
                    onChangeText={setAwsSecretAccessKeyInput}
                    placeholder={
                      settings?.awsSecretAccessKey
                        ? 'Chave salva; deixe em branco para manter'
                        : 'Cole o Secret Access Key'
                    }
                    placeholderTextColor="#777777"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                    accessibilityLabel="AWS Secret Access Key"
                  />
                  <Pressable
                    style={[styles.primaryButton, loading && styles.disabledButton]}
                    onPress={saveSettings}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar configuração do S3"
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Salvar</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setPage('copy');
                      setFeedback(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                  >
                    <Text style={styles.secondaryText}>Voltar</Text>
                  </Pressable>
                </>
              )}
              {feedback && (
                <Text
                  accessibilityRole="alert"
                  style={[
                    styles.feedback,
                    feedback.kind === 'error' ? styles.error : styles.success,
                  ]}
                >
                  {feedback.text}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#151515',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { color: '#f0f0f2', fontSize: 22, fontWeight: '600' },
  close: { color: '#929296', fontSize: 32, lineHeight: 34 },
  content: { paddingBottom: 8 },
  loader: { paddingVertical: 36 },
  label: { color: '#e6e6e8', fontSize: 15, fontWeight: '500', marginBottom: 8, marginTop: 10 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#383838',
    color: '#ffffff',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#369900',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', paddingVertical: 15 },
  secondaryText: { color: '#79d43f', fontSize: 15, fontWeight: '600' },
  feedback: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  error: { color: '#fb6969' },
  success: { color: '#79d43f' },
});
