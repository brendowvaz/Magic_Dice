import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { diceImages, type DiceImageName } from './diceImages';
import { getDicePhotoOverrideUri } from './dicePhotoOverrides';
import { loadMailSettings, S3_IMAGE_KEY } from './mailSettings';

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

  if (!asset.localUri) throw new Error('A imagem selecionada não está disponível no aparelho.');
  return new File(asset.localUri).bytes();
}

export async function uploadDiceImage(imageName: DiceImageName): Promise<void> {
  const settings = await loadMailSettings();
  if (!settings.s3Bucket || !settings.s3Region || !settings.awsAccessKeyId || !settings.awsSecretAccessKey) {
    throw new Error('Configure o S3 em +/− → Configurar envio.');
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
    await client.send(new PutObjectCommand({
      Bucket: settings.s3Bucket,
      Key: S3_IMAGE_KEY,
      Body: body,
      ContentType: 'image/jpeg',
      CacheControl: 'no-cache, max-age=0, must-revalidate',
    }));
  } finally {
    client.destroy();
  }
}
