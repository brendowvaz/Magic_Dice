import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { copyAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { diceImages, type DiceImageName } from './diceImages';
import { getDicePhotoOverrideUri } from './dicePhotoOverrides';
import { loadS3Settings, S3_IMAGE_KEY } from './s3Settings';

function hasUriScheme(uri: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(uri);
}

async function imageBytes(imageName: DiceImageName): Promise<Uint8Array<ArrayBuffer>> {
  const overrideUri = getDicePhotoOverrideUri(imageName);
  if (overrideUri) {
    if (Platform.OS === 'web') {
      const response = await fetch(overrideUri);
      return new Uint8Array(await response.arrayBuffer());
    }
    return new File(overrideUri).bytes();
  }

  const asset = await Asset.fromModule(diceImages[imageName]).downloadAsync();

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error('Não foi possível ler a imagem selecionada.');
    return new Uint8Array(await response.arrayBuffer());
  }

  const assetUri = asset.localUri ?? asset.uri;
  if (hasUriScheme(assetUri)) return new File(assetUri).bytes();

  // Em APKs Android, imagens empacotadas podem ser resolvidas apenas pelo nome
  // do recurso (sem file://). Copie o recurso para o cache antes de usar a API
  // moderna de File, que exige uma URI absoluta.
  const cachedAsset = new File(Paths.cache, `dice-upload-${imageName}.${asset.type || 'jpg'}`);
  await copyAsync({ from: assetUri, to: cachedAsset.uri });
  return cachedAsset.bytes();
}

export async function uploadDiceImage(imageName: DiceImageName): Promise<void> {
  const settings = await loadS3Settings();
  if (
    !settings.s3Bucket ||
    !settings.s3Region ||
    !settings.awsAccessKeyId ||
    !settings.awsSecretAccessKey
  ) {
    throw new Error('Configure o S3 em +/− → Configurar S3.');
  }

  const body = await imageBytes(imageName);
  const client = new S3Client({
    region: settings.s3Region,
    // O S3 informa a região correta em respostas 301 quando o bucket está em
    // outro endpoint. O SDK refaz o upload automaticamente nessa região.
    followRegionRedirects: true,
    credentials: {
      accessKeyId: settings.awsAccessKeyId,
      secretAccessKey: settings.awsSecretAccessKey,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: settings.s3Bucket,
        Key: S3_IMAGE_KEY,
        Body: body,
        ContentType: 'image/jpeg',
        CacheControl: 'no-cache, max-age=0, must-revalidate',
      }),
    );
  } finally {
    client.destroy();
  }
}
