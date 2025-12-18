// app/(tabs)/timeline.tsx
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings } from '../../hooks/useUserSettings';
import { auth, db, storage } from '../../src/firebase';
import { useTheme } from '../../src/theme/useTheme';

import ComposerModal from '../../components/timeline/ComposerModal';
import FloatingActionButton from '../../components/timeline/FloatingActionButton';
import InfoModal from '../../components/timeline/InfoModal';
import TimelineList from '../../components/timeline/TimelineList';

const MAX_LENGTH = 100;
const PAGE_SIZE = 30;

type ReportReason = 'spam' | 'harassment' | 'selfharm' | 'illegal' | 'other';

export type TimelinePost = {
  id: string;
  authorUid: string;
  nickname: string;
  text: string;
  createdAt: Date | null;
  imageUrl?: string | null;
  authorProfileImageUrl?: string | null;

  likeCount: number;
  likedByMe: boolean;
};

export default function TimelineScreen() {
  const { theme } = useTheme();
  const { nickname, profileImageUri } = useUserSettings();

  const currentUid = auth.currentUser?.uid ?? null;

  // ===== Info Modal =====
  const [infoOpen, setInfoOpen] = useState(false);

  // ===== Composer Modal（投稿） =====
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ===== Feed =====
  const [allPosts, setAllPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ページング用
  const [lastDocSnap, setLastDocSnap] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Like 連打防止
  const [likingPostIds, setLikingPostIds] = useState<Record<string, boolean>>({});

  // Hide（非表示投稿ID）
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>({});

  const charCount = text.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const hasContent = text.trim().length > 0 || !!selectedImageUri;
  const isSubmitDisabled = submitting || uploadingImage || !hasContent || isOverLimit;

  const visiblePosts = useMemo(() => {
    return allPosts.filter((p) => !hiddenPostIds[p.id]);
  }, [allPosts, hiddenPostIds]);

  // ===== HiddenPosts（自分の非表示） =====
  const fetchHiddenPosts = useCallback(async () => {
    if (!currentUid) {
      setHiddenPostIds({});
      return;
    }
    try {
      const hiddenRef = collection(db, 'users', currentUid, 'hiddenPosts');
      const snap = await getDocs(hiddenRef);
      const map: Record<string, boolean> = {};
      snap.docs.forEach((d) => (map[d.id] = true));
      setHiddenPostIds(map);
    } catch (e) {
      console.warn('Failed to fetch hiddenPosts', e);
      setHiddenPostIds({});
    }
  }, [currentUid]);

  // ===== posts -> TimelinePost 変換 =====
  const mapPostDoc = useCallback((docSnap: any): TimelinePost => {
    const data = docSnap.data() as any;

    let createdAt: Date | null = null;
    if (data.createdAt) {
      if (typeof data.createdAt.toDate === 'function') createdAt = data.createdAt.toDate();
      else createdAt = new Date(data.createdAt);
    }

    return {
      id: docSnap.id,
      authorUid: data.authorUid ?? data.uid ?? '',
      nickname: data.nickname ?? 'SereNoteユーザー',
      text: data.text ?? '',
      createdAt,
      imageUrl: data.imageUrl ?? null,
      authorProfileImageUrl: data.authorProfileImageUrl ?? null,
      likeCount: typeof data.likeCount === 'number' ? data.likeCount : 0,
      likedByMe: false,
    };
  }, []);

  // ===== Like 状態（今はN+1のまま：30件なら許容） =====
  const attachLikedByMe = useCallback(
    async (base: TimelinePost[]) => {
      if (!currentUid) return base;

      const likedFlags = await Promise.all(
        base.map(async (p) => {
          try {
            const likeRef = doc(db, 'posts', p.id, 'likes', currentUid);
            const likeSnap = await getDoc(likeRef);
            return likeSnap.exists();
          } catch {
            return false;
          }
        })
      );

      return base.map((p, i) => ({ ...p, likedByMe: likedFlags[i] ?? false }));
    },
    [currentUid]
  );

  // ===== 初回/リフレッシュ =====
  const fetchFirstPage = useCallback(async () => {
    try {
      setLoading(true);
      setHasMore(true);

      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const base = snapshot.docs.map(mapPostDoc);
      const withLiked = await attachLikedByMe(base);

      setAllPosts(withLiked);
      setLastDocSnap(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to fetch posts', e);
    } finally {
      setLoading(false);
    }
  }, [attachLikedByMe, mapPostDoc]);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchFirstPage();
      await fetchHiddenPosts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchFirstPage, fetchHiddenPosts]);

  // ===== 次ページ =====
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocSnap) return;

    try {
      setLoadingMore(true);

      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDocSnap),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const base = snapshot.docs.map(mapPostDoc);
      const withLiked = await attachLikedByMe(base);

      setAllPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of withLiked) {
          if (!seen.has(p.id)) merged.push(p);
        }
        return merged;
      });

      setLastDocSnap(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : lastDocSnap);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to fetch next posts', e);
    } finally {
      setLoadingMore(false);
    }
  }, [attachLikedByMe, hasMore, lastDocSnap, loadingMore, mapPostDoc]);

  // ===== 初回 effect =====
  useEffect(() => {
    fetchHiddenPosts();
  }, [fetchHiddenPosts]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // ===== 画像選択（Modal内から呼ぶ） =====
  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) return;

      setSelectedImageUri(asset.uri);
    } catch (e) {
      console.warn('Failed to pick image', e);
      Alert.alert('エラー', '画像の選択に失敗しました。もう一度お試しください。');
    }
  }, []);

  const clearImage = useCallback(() => setSelectedImageUri(null), []);

  // ===== Delete（自分の投稿のみ） =====
  const deletePost = useCallback((postId: string) => {
    Alert.alert('投稿を削除しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'posts', postId));
            setAllPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (e) {
            console.warn('Failed to delete post', e);
            Alert.alert('エラー', '投稿の削除に失敗しました。もう一度お試しください。');
          }
        },
      },
    ]);
  }, []);

  // ===== Like（他人の投稿のみ） =====
  const toggleLike = useCallback(
    async (postId: string) => {
      const user = auth.currentUser;
      if (!user?.uid) return;

      const target = allPosts.find((p) => p.id === postId);
      if (!target) return;

      if (target.authorUid === user.uid) return;

      if (likingPostIds[postId]) return;
      setLikingPostIds((prev) => ({ ...prev, [postId]: true }));

      setAllPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const nextLiked = !p.likedByMe;
          const nextCount = Math.max(0, (p.likeCount ?? 0) + (nextLiked ? 1 : -1));
          return { ...p, likedByMe: nextLiked, likeCount: nextCount };
        })
      );

      try {
        const postRef = doc(db, 'posts', postId);
        const likeRef = doc(db, 'posts', postId, 'likes', user.uid);

        await runTransaction(db, async (tx) => {
          const likeSnap = await tx.get(likeRef);
          if (likeSnap.exists()) {
            tx.delete(likeRef);
            tx.update(postRef, { likeCount: increment(-1) });
          } else {
            tx.set(likeRef, { createdAt: new Date() });
            tx.update(postRef, { likeCount: increment(1) });
          }
        });
      } catch (e) {
        console.warn('Failed to toggle like', e);
        Alert.alert('エラー', 'いいねの更新に失敗しました。もう一度お試しください。');
        fetchFirstPage();
      } finally {
        setLikingPostIds((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }
    },
    [allPosts, fetchFirstPage, likingPostIds]
  );

  // ===== Hide =====
  const hidePost = useCallback(
    async (postId: string) => {
      const user = auth.currentUser;
      if (!user?.uid) return;

      Alert.alert('この投稿を非表示にしますか？', 'あなたの画面からこの投稿を見えなくします。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '非表示にする',
          style: 'destructive',
          onPress: async () => {
            try {
              setHiddenPostIds((prev) => ({ ...prev, [postId]: true }));
              await setDoc(
                doc(db, 'users', user.uid, 'hiddenPosts', postId),
                { createdAt: new Date() },
                { merge: true }
              );
            } catch (e) {
              console.warn('Failed to hide post', e);
              Alert.alert('エラー', '非表示に失敗しました。もう一度お試しください。');
              fetchHiddenPosts();
            }
          },
        },
      ]);
    },
    [fetchHiddenPosts]
  );

  // ===== Report（posts/{postId}/reports に入る） =====
  const reportPost = useCallback(async (post: TimelinePost) => {
    const user = auth.currentUser;
    if (!user?.uid) return;

    const doReport = async (reason: ReportReason) => {
      try {
        const reportsRef = collection(db, 'posts', post.id, 'reports');
        await addDoc(reportsRef, {
          reporterUid: user.uid,
          reason,
          createdAt: new Date(),
        });

        Alert.alert('通報しました', 'ご協力ありがとうございます。内容を確認します。');
      } catch (e) {
        console.warn('Failed to report post', e);
        Alert.alert('エラー', '通報に失敗しました。もう一度お試しください。');
      }
    };

    Alert.alert('通報理由を選んでください', '不適切な投稿を運営に知らせます。', [
      { text: 'スパム', onPress: () => doReport('spam') },
      { text: '嫌がらせ/攻撃', onPress: () => doReport('harassment') },
      { text: '自傷/危険', onPress: () => doReport('selfharm') },
      { text: '違法/不正', onPress: () => doReport('illegal') },
      { text: 'その他', onPress: () => doReport('other') },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  }, []);

  // ===== Submit（Modalから） =====
  const submitPost = useCallback(async () => {
    const trimmed = text.trim();

    if (!trimmed && !selectedImageUri) {
      Alert.alert('内容がありません', 'テキストか画像のどちらかを入力・選択してください。');
      return;
    }

    const user = auth.currentUser;
    if (!user?.uid) {
      Alert.alert('エラー', 'ユーザー情報が取得できませんでした。');
      return;
    }

    if (isOverLimit) {
      Alert.alert('文字数オーバー', `投稿は${MAX_LENGTH}文字までにしてください。`);
      return;
    }

    try {
      setSubmitting(true);

      const postsRef = collection(db, 'posts');
      const created = await addDoc(postsRef, {
        authorUid: user.uid,
        uid: user.uid,
        nickname: nickname ?? 'SereNoteユーザー',
        text: trimmed,
        createdAt: new Date(),
        isPublic: true,
        imageUrl: null,
        authorProfileImageUrl: profileImageUri ?? null,
        likeCount: 0,
      });

      if (selectedImageUri) {
        setUploadingImage(true);

        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const response = await fetch(manipulated.uri);
        const blob = await response.blob();

        const filename = `${user.uid}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `postImages/${created.id}/${filename}`);

        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);

        await updateDoc(doc(db, 'posts', created.id), {
          imageUrl,
        });
      }

      setText('');
      setSelectedImageUri(null);
      setComposerOpen(false);

      await fetchFirstPage();

      Alert.alert('投稿しました', 'あなたの一言がタイムラインに追加されました。');
    } catch (e) {
      console.warn('Failed to add post', e);
      Alert.alert('エラー', '投稿の保存に失敗しました。もう一度お試しください。');
    } finally {
      setUploadingImage(false);
      setSubmitting(false);
    }
  }, [fetchFirstPage, isOverLimit, nickname, profileImageUri, selectedImageUri, text]);

  // ===== 画面 =====
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header + info button */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: theme.colors.textMain }]}>みんなのタイムライン</Text>

            <TouchableOpacity
              onPress={() => setInfoOpen(true)}
              activeOpacity={0.85}
              style={[
                styles.infoButton,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSoft },
              ]}
            >
              <Text style={[styles.infoButtonText, { color: theme.colors.textSub }]}>i</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.textSub }]}>
            小さな「できた」や「つらかった」を、画像や一言でゆるく共有する場所です。
          </Text>
        </View>

        <TimelineList
          theme={theme}
          posts={visiblePosts}
          loading={loading}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={fetchNextPage}
          loadingMore={loadingMore}
          canLoadMore={hasMore}
          currentUid={currentUid}
          likingPostIds={likingPostIds}
          onLike={toggleLike}
          onDelete={deletePost}
          onHide={hidePost}
          onReport={reportPost}
        />

        {/* FAB */}
        <FloatingActionButton
          theme={theme}
          onPress={() => setComposerOpen(true)}
          disabled={submitting || uploadingImage}
        />

        {/* 投稿モーダル */}
        <ComposerModal
          theme={theme}
          visible={composerOpen}
          onClose={() => setComposerOpen(false)}
          text={text}
          onChangeText={setText}
          maxLength={MAX_LENGTH}
          selectedImageUri={selectedImageUri}
          onPickImage={pickImage}
          onClearImage={clearImage}
          submitting={submitting}
          uploadingImage={uploadingImage}
          onSubmit={submitPost}
          isSubmitDisabled={isSubmitDisabled}
        />

        {/* 情報モーダル（ここに移動） */}
        <InfoModal theme={theme} visible={infoOpen} onClose={() => setInfoOpen(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: -1,
  },
});