// src/auth/googleSignIn.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    GoogleAuthProvider,
    linkWithCredential,
    signInWithCredential,
    signOut,
    type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../firebase';

type ConfigureOptions = {
  /**
   * Firebase Auth 連携のための Web Client ID（推奨）
   * 末尾が `.apps.googleusercontent.com` の "Web client" の Client ID
   */
  webClientId: string;

  /**
   * iOS で「既にサインイン済み」を使う場合のみ。未使用なら不要。
   */
  iosClientId?: string;

  /**
   * 必要な場合のみ（省略可）
   */
  forceCodeForRefreshToken?: boolean;
};

/**
 * アプリ起動時に 1回だけ呼ぶ（Root Layout / App.tsx）
 */
export function configureGoogleSignIn(options: ConfigureOptions) {
  GoogleSignin.configure({
    webClientId: options.webClientId,
    ...(options.iosClientId ? { iosClientId: options.iosClientId } : {}),
    ...(typeof options.forceCodeForRefreshToken === 'boolean'
      ? { forceCodeForRefreshToken: options.forceCodeForRefreshToken }
      : {}),
  });
}

/**
 * Web に飛ばないネイティブ Google ログイン
 * - 匿名ユーザーなら linkWithCredential で「同じUIDのまま」昇格してデータ引継ぎ
 * - ただし、その Google が別UIDで既に使われている場合は signInWithCredential にフォールバック
 */
export async function signInWithGoogleNative(): Promise<UserCredential> {
  // Android のみ Play Services 必須（iOS は不要）
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  }

  // サインイン（キャンセル等は例外）
  const result = await GoogleSignin.signIn();

  // idToken の取り出し（環境差で getTokens が必要な場合がある）
  const idToken =
    (result as any)?.idToken ?? (await GoogleSignin.getTokens()).idToken;

  if (!idToken) {
    throw new Error('Google idToken not found');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const user = auth.currentUser;

  // 匿名 → Google に昇格（データ保持）
  if (user?.isAnonymous) {
    try {
      return await linkWithCredential(user, credential);
    } catch (e: any) {
      // 既にその Google が別UIDで使われている → そのアカウントでログイン
      if (e?.code === 'auth/credential-already-in-use') {
        return await signInWithCredential(auth, credential);
      }
      throw e;
    }
  }

  // 通常ログイン
  return await signInWithCredential(auth, credential);
}

/**
 * ログアウト（Google セッション + Firebase セッション）
 * - revoke: true にすると Google 側の権限も取り消し（必要な時だけ）
 */
export async function signOutGoogleNative(options?: { revoke?: boolean }) {
  // Firebase 側を先に切る（どっちでもOKだが、UIの状態管理的に安定しやすい）
  try {
    await signOut(auth);
  } catch {
    // noop
  }

  // Google 側のセッションを切る
  try {
    if (options?.revoke) {
      // アカウント選択を毎回出したい/完全解除したい時だけ
      await GoogleSignin.revokeAccess();
    }
    await GoogleSignin.signOut();
  } catch {
    // noop
  }
}