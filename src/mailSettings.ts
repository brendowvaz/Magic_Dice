import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type MailSettings = {
  apiKey: string;
  senderEmail: string;
  imageUrl: string;
};

export const PLACEHOLDER_IMAGE_URL = 'https://seu-bucket.s3.amazonaws.com/imagem.jpg';

const DEFAULT_SETTINGS: MailSettings = {
  apiKey: '',
  senderEmail: '',
  imageUrl: PLACEHOLDER_IMAGE_URL,
};

const STORAGE_KEYS = {
  apiKey: 'brevo.apiKey',
  senderEmail: 'brevo.senderEmail',
  imageUrl: 'brevo.imageUrl',
} as const;

// SecureStore não está disponível no navegador; a prévia web mantém os dados
// somente em memória, sem gravar a chave em localStorage.
let webSettings: MailSettings | null = null;

export async function loadMailSettings(): Promise<MailSettings> {
  if (Platform.OS === 'web') return webSettings ?? { ...DEFAULT_SETTINGS };

  const [apiKey, senderEmail, imageUrl] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.apiKey),
    SecureStore.getItemAsync(STORAGE_KEYS.senderEmail),
    SecureStore.getItemAsync(STORAGE_KEYS.imageUrl),
  ]);

  return {
    apiKey: apiKey ?? DEFAULT_SETTINGS.apiKey,
    senderEmail: senderEmail ?? DEFAULT_SETTINGS.senderEmail,
    imageUrl: imageUrl ?? DEFAULT_SETTINGS.imageUrl,
  };
}

export async function saveMailSettings(settings: MailSettings): Promise<void> {
  if (Platform.OS === 'web') {
    webSettings = { ...settings };
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.apiKey, settings.apiKey);
  await SecureStore.setItemAsync(STORAGE_KEYS.senderEmail, settings.senderEmail);
  await SecureStore.setItemAsync(STORAGE_KEYS.imageUrl, settings.imageUrl);
}
