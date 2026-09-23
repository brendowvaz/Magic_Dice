import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type MailSettings = {
  apiKey: string;
  senderEmail: string;
  imageUrl: string;
  s3Bucket: string;
  s3Region: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
};

export const PLACEHOLDER_IMAGE_URL = 'https://seu-bucket.s3.amazonaws.com/imagem.jpg';
export const S3_IMAGE_KEY = 'image.jpg';

export function isPlaceholderImageUrl(url: string): boolean {
  return url === PLACEHOLDER_IMAGE_URL;
}

export function s3ImageUrl(bucket: string, region: string): string {
  const base = bucket.includes('.')
    ? `https://s3.${region}.amazonaws.com/${bucket}`
    : `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base}/${S3_IMAGE_KEY}`;
}

const DEFAULT_SETTINGS: MailSettings = {
  apiKey: '',
  senderEmail: '',
  imageUrl: PLACEHOLDER_IMAGE_URL,
  s3Bucket: '',
  s3Region: '',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
};

const STORAGE_KEYS = {
  apiKey: 'brevo.apiKey',
  senderEmail: 'brevo.senderEmail',
  imageUrl: 'brevo.imageUrl',
  s3Bucket: 's3.bucket',
  s3Region: 's3.region',
  awsAccessKeyId: 's3.accessKeyId',
  awsSecretAccessKey: 's3.secretAccessKey',
} as const;

// SecureStore não está disponível no navegador; a prévia web mantém os dados
// somente em memória, sem gravar a chave em localStorage.
let webSettings: MailSettings | null = null;

export async function loadMailSettings(): Promise<MailSettings> {
  if (Platform.OS === 'web') return webSettings ?? { ...DEFAULT_SETTINGS };

  const [apiKey, senderEmail, imageUrl, s3Bucket, s3Region, awsAccessKeyId, awsSecretAccessKey] =
    await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.apiKey),
      SecureStore.getItemAsync(STORAGE_KEYS.senderEmail),
      SecureStore.getItemAsync(STORAGE_KEYS.imageUrl),
      SecureStore.getItemAsync(STORAGE_KEYS.s3Bucket),
      SecureStore.getItemAsync(STORAGE_KEYS.s3Region),
      SecureStore.getItemAsync(STORAGE_KEYS.awsAccessKeyId),
      SecureStore.getItemAsync(STORAGE_KEYS.awsSecretAccessKey),
    ]);

  return {
    apiKey: apiKey ?? DEFAULT_SETTINGS.apiKey,
    senderEmail: senderEmail ?? DEFAULT_SETTINGS.senderEmail,
    imageUrl: imageUrl ?? DEFAULT_SETTINGS.imageUrl,
    s3Bucket: s3Bucket ?? DEFAULT_SETTINGS.s3Bucket,
    s3Region: s3Region ?? DEFAULT_SETTINGS.s3Region,
    awsAccessKeyId: awsAccessKeyId ?? DEFAULT_SETTINGS.awsAccessKeyId,
    awsSecretAccessKey: awsSecretAccessKey ?? DEFAULT_SETTINGS.awsSecretAccessKey,
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
  await SecureStore.setItemAsync(STORAGE_KEYS.s3Bucket, settings.s3Bucket);
  await SecureStore.setItemAsync(STORAGE_KEYS.s3Region, settings.s3Region);
  await SecureStore.setItemAsync(STORAGE_KEYS.awsAccessKeyId, settings.awsAccessKeyId);
  await SecureStore.setItemAsync(STORAGE_KEYS.awsSecretAccessKey, settings.awsSecretAccessKey);
}
