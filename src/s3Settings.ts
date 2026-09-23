import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type S3Settings = {
  s3Bucket: string;
  s3Region: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
};

export const S3_IMAGE_KEY = 'image.jpg';

export function s3ImageUrl(bucket: string, region: string): string {
  const base = bucket.includes('.')
    ? `https://s3.${region}.amazonaws.com/${bucket}`
    : `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base}/${S3_IMAGE_KEY}`;
}

const DEFAULT_SETTINGS: S3Settings = {
  s3Bucket: '',
  s3Region: '',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
};

const STORAGE_KEYS = {
  s3Bucket: 's3.bucket',
  s3Region: 's3.region',
  awsAccessKeyId: 's3.accessKeyId',
  awsSecretAccessKey: 's3.secretAccessKey',
} as const;

// SecureStore não está disponível no navegador; a prévia web mantém os dados
// somente em memória, sem gravar as chaves em localStorage.
let webSettings: S3Settings | null = null;

export async function loadS3Settings(): Promise<S3Settings> {
  if (Platform.OS === 'web') return webSettings ?? { ...DEFAULT_SETTINGS };

  const [s3Bucket, s3Region, awsAccessKeyId, awsSecretAccessKey] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.s3Bucket),
    SecureStore.getItemAsync(STORAGE_KEYS.s3Region),
    SecureStore.getItemAsync(STORAGE_KEYS.awsAccessKeyId),
    SecureStore.getItemAsync(STORAGE_KEYS.awsSecretAccessKey),
  ]);

  return {
    s3Bucket: s3Bucket ?? DEFAULT_SETTINGS.s3Bucket,
    s3Region: s3Region ?? DEFAULT_SETTINGS.s3Region,
    awsAccessKeyId: awsAccessKeyId ?? DEFAULT_SETTINGS.awsAccessKeyId,
    awsSecretAccessKey: awsSecretAccessKey ?? DEFAULT_SETTINGS.awsSecretAccessKey,
  };
}

export async function saveS3Settings(settings: S3Settings): Promise<void> {
  if (Platform.OS === 'web') {
    webSettings = { ...settings };
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.s3Bucket, settings.s3Bucket);
  await SecureStore.setItemAsync(STORAGE_KEYS.s3Region, settings.s3Region);
  await SecureStore.setItemAsync(STORAGE_KEYS.awsAccessKeyId, settings.awsAccessKeyId);
  await SecureStore.setItemAsync(STORAGE_KEYS.awsSecretAccessKey, settings.awsSecretAccessKey);
}
