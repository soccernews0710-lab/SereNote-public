// src/storage/uploadProfileImage.ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase';

export async function uploadProfileImageAsync(localUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ユーザー情報が見つかりませんでした（未ログイン）。');
  }

  console.log('[uploadProfileImage] uid =', user.uid, 'uri =', localUri);

  // file:// から Blob を作成
  const response = await fetch(localUri);
  const blob = await response.blob();

  const extMatch = localUri.match(/\.(\w+)$/);
  const ext = extMatch?.[1] ?? 'jpg';

  const fileRef = ref(storage, `profileImages/${user.uid}.${ext}`);

  try {
    // アップロード
    const snap = await uploadBytes(fileRef, blob);
    console.log('[uploadProfileImage] uploaded to', snap.metadata.fullPath);

    // ダウンロードURL
    const url = await getDownloadURL(fileRef);
    console.log('[uploadProfileImage] downloadURL =', url);
    return url;
  } catch (e: any) {
    console.error(
      '[uploadProfileImage] upload error:',
      e,
      'code =',
      e?.code,
      'message =',
      e?.message,
      'serverResponse =',
      e?.customData?.serverResponse
    );
    throw e;
  }
}