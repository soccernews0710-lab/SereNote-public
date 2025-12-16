// src/storage/uploadProfileImage.ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase';

/**
 * プロフィール画像を Storage にアップロードして downloadURL を返す
 * 保存先: profileImages/<uid>/avatar.<ext>
 */
export async function uploadProfileImageAsync(localUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ユーザー情報が見つかりませんでした（未ログイン）。');
  }

  console.log('[uploadProfileImage] uid =', user.uid, 'uri =', localUri);

  // file:// から Blob を作成
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error(
      `[uploadProfileImage] fetch failed: ${response.status} ${response.statusText}`
    );
  }
  const blob = await response.blob();

  // 拡張子推定（なくてもOK）
  const extMatch = localUri.match(/\.(\w+)$/);
  let ext = (extMatch?.[1] ?? 'jpg').toLowerCase();

  // よくある揺れを正規化
  if (ext === 'jpeg') ext = 'jpg';

  // iOS の ImagePicker だと heic/heif が来ることがある
  // Storage 的には contentType を正しく入れればOKだが、
  // 互換性のため jpg 扱いに寄せたい場合はここで変換する（※変換は別処理が必要）
  // ここでは拡張子だけは heic のまま許容する
  // if (ext === 'heic' || ext === 'heif') ext = 'jpg';

  // ✅ フォルダ形式に統一
  const filename = `avatar.${ext}`;
  const fullPath = `profileImages/${user.uid}/${filename}`;
  const fileRef = ref(storage, fullPath);

  // contentType をなるべく正しく付与（これが後々効く）
  const contentType =
    blob.type ||
    (ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'heic'
          ? 'image/heic'
          : ext === 'heif'
            ? 'image/heif'
            : 'image/jpeg');

  try {
    // アップロード
    const snap = await uploadBytes(fileRef, blob, { contentType });
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