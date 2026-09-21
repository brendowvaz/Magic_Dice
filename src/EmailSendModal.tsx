import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { isValidEmail, isValidImageUrl, sendImageEmail } from './brevo';
import { isPlaceholderImageUrl, loadMailSettings, s3ImageUrl, saveMailSettings, type MailSettings } from './mailSettings';

type Feedback = { kind: 'error' | 'success'; text: string } | null;

export function EmailSendModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [page, setPage] = useState<'compose' | 'settings'>('compose');
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('');
  const [awsAccessKeyIdInput, setAwsAccessKeyIdInput] = useState('');
  const [awsSecretAccessKeyInput, setAwsSecretAccessKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setPage('compose');
    setFeedback(null);
    setLoading(true);
    loadMailSettings()
      .then((saved) => {
        if (!active) return;
        setSettings(saved);
        setSenderEmail(saved.senderEmail);
        setImageUrl(saved.imageUrl);
        setApiKeyInput('');
        setS3Bucket(saved.s3Bucket);
        setS3Region(saved.s3Region);
        setAwsAccessKeyIdInput('');
        setAwsSecretAccessKeyInput('');
      })
      .catch(() => {
        if (active) setFeedback({ kind: 'error', text: 'Não foi possível ler as configurações de envio.' });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visible]);

  function close() {
    if (sending) return;
    onClose();
  }

  function openSettings(message?: string) {
    setSenderEmail(settings?.senderEmail ?? '');
    setImageUrl(settings?.imageUrl ?? '');
    setApiKeyInput('');
    setS3Bucket(settings?.s3Bucket ?? '');
    setS3Region(settings?.s3Region ?? '');
    setAwsAccessKeyIdInput('');
    setAwsSecretAccessKeyInput('');
    setPage('settings');
    setFeedback(message ? { kind: 'error', text: message } : null);
  }

  async function saveSettings() {
    const bucket = s3Bucket.trim();
    const region = s3Region.trim().toLowerCase();
    const configuredImageUrl = imageUrl.trim();
    const next: MailSettings = {
      senderEmail: senderEmail.trim(),
      imageUrl: isPlaceholderImageUrl(configuredImageUrl) && bucket && region
        ? s3ImageUrl(bucket, region)
        : configuredImageUrl,
      apiKey: apiKeyInput.trim() || settings?.apiKey || '',
      s3Bucket: bucket,
      s3Region: region,
      awsAccessKeyId: awsAccessKeyIdInput.trim() || settings?.awsAccessKeyId || '',
      awsSecretAccessKey: awsSecretAccessKeyInput.trim() || settings?.awsSecretAccessKey || '',
    };
    if (!isValidEmail(next.senderEmail)) {
      setFeedback({ kind: 'error', text: 'Digite um remetente válido e verificado na Brevo.' });
      return;
    }
    if (!isValidImageUrl(next.imageUrl)) {
      setFeedback({ kind: 'error', text: 'Digite um link HTTPS válido para a imagem.' });
      return;
    }
    const hasS3Values = Boolean(next.s3Bucket || next.s3Region || next.awsAccessKeyId || next.awsSecretAccessKey);
    if (hasS3Values && (!next.s3Bucket || !next.s3Region || !next.awsAccessKeyId || !next.awsSecretAccessKey)) {
      setFeedback({ kind: 'error', text: 'Preencha bucket, região e as duas chaves AWS para ativar o envio ao S3.' });
      return;
    }
    if (hasS3Values && !/^[a-z]{2}(?:-gov)?-[a-z]+-\d+$/.test(next.s3Region)) {
      setFeedback({ kind: 'error', text: 'Digite uma região AWS válida, como sa-east-1.' });
      return;
    }
    if (hasS3Values && (isPlaceholderImageUrl(next.imageUrl) || !new URL(next.imageUrl).pathname.endsWith('/image'))) {
      setFeedback({ kind: 'error', text: 'O link público precisa apontar para o objeto image, sem extensão.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await saveMailSettings(next);
      setSettings(next);
      setImageUrl(next.imageUrl);
      setApiKeyInput('');
      setAwsAccessKeyIdInput('');
      setAwsSecretAccessKeyInput('');
      setPage('compose');
      setFeedback({
        kind: isPlaceholderImageUrl(next.imageUrl) ? 'error' : 'success',
        text: isPlaceholderImageUrl(next.imageUrl)
          ? 'Configuração salva. Substitua o link de exemplo antes de enviar.'
          : 'Configuração salva no aparelho.',
      });
    } catch {
      setFeedback({ kind: 'error', text: 'Não foi possível salvar a configuração no aparelho.' });
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const recipient = recipientEmail.trim();
    setFeedback(null);
    if (!isValidEmail(recipient)) {
      setFeedback({ kind: 'error', text: 'Digite um e-mail de destino válido.' });
      return;
    }
    if (!settings?.apiKey) {
      openSettings('Configure a chave Brevo antes de enviar.');
      return;
    }
    if (isPlaceholderImageUrl(settings.imageUrl)) {
      openSettings('Substitua o link de exemplo por uma imagem pública da AWS.');
      return;
    }

    setSending(true);
    try {
      await sendImageEmail({
        apiKey: settings.apiKey,
        senderEmail: settings.senderEmail,
        recipientEmail: recipient,
        imageUrl: settings.imageUrl,
      });
      setRecipientEmail('');
      setFeedback({ kind: 'success', text: 'E-mail aceito pela Brevo para envio.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fechar envio" />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{page === 'compose' ? 'Enviar imagem' : 'Configurar envio'}</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {loading && !settings ? <ActivityIndicator color="#79d43f" style={styles.loader} /> : page === 'compose' ? <>
                <Text style={styles.label}>E-mail de destino</Text>
                <TextInput
                  style={styles.input}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="exemplo@email.com"
                  placeholderTextColor="#777777"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="E-mail de destino"
                  returnKeyType="send"
                  onSubmitEditing={send}
                />
                <Pressable style={[styles.primaryButton, sending && styles.disabledButton]} onPress={send} disabled={sending || loading} accessibilityRole="button" accessibilityLabel="Enviar">
                  {sending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Enviar</Text>}
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => openSettings()} accessibilityRole="button" accessibilityLabel="Configurar envio">
                  <Text style={styles.secondaryText}>Configurar envio</Text>
                </Pressable>
              </> : <>
                <Text style={styles.label}>Remetente verificado na Brevo</Text>
                <TextInput
                  style={styles.input}
                  value={senderEmail}
                  onChangeText={setSenderEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="E-mail remetente"
                />
                <Text style={styles.label}>Link fixo da imagem na AWS</Text>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://..."
                  placeholderTextColor="#777777"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Link da imagem na AWS"
                />
                <Text style={styles.hint}>O mesmo link será usado em todos os e-mails. Ele precisa ser público e permanente.</Text>
                <Text style={styles.sectionTitle}>Envio direto ao S3</Text>
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
                  placeholder={settings?.awsAccessKeyId ? 'Chave salva; deixe em branco para manter' : 'Cole o Access Key ID'}
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
                  placeholder={settings?.awsSecretAccessKey ? 'Chave salva; deixe em branco para manter' : 'Cole o Secret Access Key'}
                  placeholderTextColor="#777777"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  accessibilityLabel="AWS Secret Access Key"
                />
                <Text style={styles.hint}>Use uma credencial IAM com permissão de gravação apenas em bucket/image. As chaves ficam no aparelho.</Text>
                <Text style={styles.label}>Chave da API Brevo</Text>
                <TextInput
                  style={styles.input}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder={settings?.apiKey ? 'Chave salva; deixe em branco para manter' : 'Cole sua chave da API'}
                  placeholderTextColor="#777777"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  accessibilityLabel="Chave da API Brevo"
                />
                <Text style={styles.hint}>A chave é guardada no aparelho e enviada somente à API da Brevo.</Text>
                <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={saveSettings} disabled={loading} accessibilityRole="button" accessibilityLabel="Salvar configuração">
                  {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Salvar</Text>}
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => { setPage('compose'); setFeedback(null); }} accessibilityRole="button" accessibilityLabel="Voltar para envio">
                  <Text style={styles.secondaryText}>Voltar</Text>
                </Pressable>
              </>}
              {feedback && <Text accessibilityRole="alert" style={[styles.feedback, feedback.kind === 'error' ? styles.error : styles.success]}>{feedback.text}</Text>}
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
  sheet: { backgroundColor: '#151515', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, maxHeight: '88%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#f0f0f2', fontSize: 22, fontWeight: '600' },
  close: { color: '#929296', fontSize: 32, lineHeight: 34 },
  content: { paddingBottom: 8 },
  loader: { paddingVertical: 36 },
  label: { color: '#e6e6e8', fontSize: 15, fontWeight: '500', marginBottom: 8, marginTop: 10 },
  input: { minHeight: 52, borderRadius: 14, backgroundColor: '#252525', borderWidth: 1, borderColor: '#383838', color: '#ffffff', paddingHorizontal: 15, fontSize: 16 },
  hint: { color: '#929296', fontSize: 12, lineHeight: 18, marginTop: 7 },
  sectionTitle: { color: '#f0f0f2', fontSize: 18, fontWeight: '600', marginTop: 24 },
  primaryButton: { minHeight: 52, borderRadius: 26, backgroundColor: '#369900', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', paddingVertical: 15 },
  secondaryText: { color: '#79d43f', fontSize: 15, fontWeight: '600' },
  feedback: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  error: { color: '#fb6969' },
  success: { color: '#79d43f' },
});
