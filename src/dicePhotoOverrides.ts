import { Directory, File, Paths } from 'expo-file-system';
import { Platform, type ImageSourcePropType } from 'react-native';
import { diceImages, type DiceImageName } from './diceImages';

const OVERRIDES_DIRECTORY = 'dice-photo-overrides';
const webOverrides = new Map<DiceImageName, string>();

function overrideFile(imageName: DiceImageName): File {
  return new File(Paths.document, OVERRIDES_DIRECTORY, `${imageName}.jpg`);
}

export function getDicePhotoOverrideUri(imageName: DiceImageName): string | null {
  if (Platform.OS === 'web') return webOverrides.get(imageName) ?? null;

  const file = overrideFile(imageName);
  return file.exists ? file.uri : null;
}

export function getDicePhotoSource(imageName: DiceImageName): ImageSourcePropType {
  const overrideUri = getDicePhotoOverrideUri(imageName);
  return overrideUri ? { uri: overrideUri, cache: 'reload' } : diceImages[imageName];
}

export async function saveDicePhotoOverride(imageName: DiceImageName, jpegBase64: string): Promise<string> {
  if (Platform.OS === 'web') {
    const uri = `data:image/jpeg;base64,${jpegBase64}`;
    webOverrides.set(imageName, uri);
    return uri;
  }

  const directory = new Directory(Paths.document, OVERRIDES_DIRECTORY);
  directory.create({ idempotent: true, intermediates: true });

  const destination = overrideFile(imageName);
  destination.create({ overwrite: true, intermediates: true });
  destination.write(jpegBase64, { encoding: 'base64' });
  return destination.uri;
}
