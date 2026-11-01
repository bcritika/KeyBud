import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

const IMAGE_DIR_NAME = 'board-images';

// Only the file name is stored with an item: iOS can change the absolute Documents path
// between app updates, so the full URI is rebuilt each time it's needed.
export function resolvePhotoUri(file: string): string {
  return new File(Paths.document, IMAGE_DIR_NAME, file).uri;
}

export function ensurePhotoDir() {
  new Directory(Paths.document, IMAGE_DIR_NAME).create({ intermediates: true, idempotent: true });
}

/** Copies a picked image (which lives in a temporary cache) into permanent app storage. */
export async function savePhoto(sourceUri: string): Promise<string> {
  ensurePhotoDir();

  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  // Unique across devices too, since the same name is used for the copy in the cloud.
  const fileName = `${randomUUID()}${extension.startsWith('.') ? extension : `.${extension}`}`;
  await source.copy(new File(Paths.document, IMAGE_DIR_NAME, fileName));
  return fileName;
}

export function deletePhoto(file: string) {
  try {
    new File(Paths.document, IMAGE_DIR_NAME, file).delete();
  } catch {
    // Already gone: nothing to clean up.
  }
}
