// app/(tabs)/timeline.tsx
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
} from 'firebase/firestore';
import {
    getDownloadURL,
    ref,
    uploadBytes,
} from 'firebase/storage';
import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings } from '../../hooks/useUserSettings';
import { auth, db, storage } from '../../src/firebase';
import { useTheme } from '../../src/theme/useTheme';

const MAX_LENGTH = 100;

type TimelinePost = {
  id: string;
  authorUid: string;
  nickname: string;
  text: string;
  createdAt: Date | null;
  imageUrl?: string | null;
  authorProfileImageUrl?: string | null;
};

export default function TimelineScreen() {
  const { theme } = useTheme();
  const { nickname, profileImageUri } = useUserSettings();

  // 🔹 現在ログイン中の UID（匿名AuthでもOK）
  const currentUid = auth.currentUser?.uid ?? null;

  // 投稿用状態
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 一覧用状態
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_LENGTH;

  // 画像 or テキストのどちらかは必須
  const hasContent = text.trim().length > 0 || !!selectedImageUri;
  const isDisabled =
    submitting || uploadingImage || !hasContent || isOverLimit;

  // ===== Firestore から投稿一覧を1回だけ取得 =====
  const fetchPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const next: TimelinePost[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        let createdAt: Date | null = null;

        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else {
            createdAt = new Date(data.createdAt);
          }
        }

        return {
          id: docSnap.id,
          authorUid: data.authorUid ?? data.uid ?? '',
          nickname: data.nickname ?? 'SereNoteユーザー',
          text: data.text ?? '',
          createdAt,
          imageUrl: data.imageUrl ?? null,
          authorProfileImageUrl: data.authorProfileImageUrl ?? null,
        };
      });

      setPosts(next);
    } catch (e) {
      console.warn('Failed to fetch posts', e);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ===== 画像選択 =====
  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      setSelectedImageUri(asset.uri);
    } catch (e) {
      console.warn('Failed to pick image', e);
      Alert.alert('エラー', '画像の選択に失敗しました。もう一度お試しください。');
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedImageUri(null);
  }, []);

  // ===== 投稿削除（自分の投稿のみ） =====
  const handleDeletePost = useCallback(
    (postId: string) => {
      Alert.alert(
        '投稿を削除しますか？',
        'この操作は取り消せません。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除する',
            style: 'destructive',
            onPress: async () => {
              try {
                const ref = doc(db, 'posts', postId);
                await deleteDoc(ref);
                setPosts(prev => prev.filter(p => p.id !== postId));
              } catch (e) {
                console.warn('Failed to delete post', e);
                Alert.alert(
                  'エラー',
                  '投稿の削除に失敗しました。通信状況などを確認して、もう一度お試しください。'
                );
              }
            },
          },
        ]
      );
    },
    []
  );

  // ===== 投稿処理 =====
  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();

    if (!trimmed && !selectedImageUri) {
      Alert.alert('内容がありません', 'テキストか画像のどちらかを入力・選択してください。');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert(
        'エラー',
        'ユーザー情報が取得できませんでした。少し時間をおいて再度お試しください。'
      );
      return;
    }

    if (isOverLimit) {
      Alert.alert('文字数オーバー', `投稿は${MAX_LENGTH}文字までにしてください。`);
      return;
    }

    let imageUrl: string | null = null;

    try {
      setSubmitting(true);

      // 画像があれば Storage に圧縮してアップロード
      if (selectedImageUri) {
        setUploadingImage(true);

        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [
            {
              resize: { width: 1280 },
            },
          ],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const response = await fetch(manipulated.uri);
        const blob = await response.blob();

        const filename = `${user.uid}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `timelinePosts/${user.uid}/${filename}`);

        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const postsRef = collection(db, 'posts');

      await addDoc(postsRef, {
        authorUid: user.uid,
        uid: user.uid, // 互換用（将来消してOK）
        nickname: nickname ?? 'SereNoteユーザー',
        text: trimmed,
        createdAt: new Date(),
        isPublic: true,
        imageUrl: imageUrl ?? null,
        authorProfileImageUrl: profileImageUri ?? null,
      });

      setText('');
      setSelectedImageUri(null);

      fetchPosts();

      Alert.alert('投稿しました', 'あなたの一言がタイムラインに追加されました。');
    } catch (e) {
      console.warn('Failed to add post', e);
      Alert.alert(
        'エラー',
        '投稿の保存に失敗しました。通信状況などを確認して、もう一度お試しください。'
      );
    } finally {
      setUploadingImage(false);
      setSubmitting(false);
    }
  }, [
    text,
    nickname,
    selectedImageUri,
    isOverLimit,
    profileImageUri,
    fetchPosts,
  ]);

  // 日付表示用フォーマット
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getMonth() + 1}/${date.getDate()} ${String(
      date.getHours()
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // ニックネームの最初の1文字（プレースホルダー用）
  const getInitial = (name: string) => {
    if (!name) return 'S';
    return name.trim().charAt(0);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            {/* タイトル */}
            <Text
              style={[
                styles.title,
                { color: theme.colors.textMain },
              ]}
            >
              みんなのタイムライン
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.textSub },
              ]}
            >
              ここは、小さな「できた」や「つらかった」を
              画像や一言でゆるく共有するための場所です。
              画像だけでも、短い文章だけでもOKです。
            </Text>

            {/* ===== 投稿カード ===== */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                いまの気持ちを一言と一枚で
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.colors.textSub },
                ]}
              >
                好きな景色やキャラクターの画像だけでもOKです。
                文字は100文字までの短いメッセージにしています。
              </Text>

              {/* 画像プレビュー & ボタン */}
              <View style={styles.imageRow}>
                {selectedImageUri ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={[
                        styles.imageRemoveButton,
                        { backgroundColor: theme.colors.surfaceAlt },
                      ]}
                      onPress={handleClearImage}
                    >
                      <Text
                        style={[
                          styles.imageRemoveText,
                          { color: theme.colors.textSub },
                        ]}
                      >
                        画像を削除
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.imageHint,
                      { color: theme.colors.textSub },
                    ]}
                  >
                    画像を選ばない場合は、テキストだけの投稿もできます。
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.imagePickButton,
                  {
                    borderColor: theme.colors.borderSoft,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.imagePickText,
                    { color: theme.colors.textMain },
                  ]}
                >
                  {selectedImageUri ? '別の画像を選ぶ' : '画像を選ぶ'}
                </Text>
              </TouchableOpacity>

              {/* テキスト入力 */}
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: isOverLimit
                      ? theme.colors.primary
                      : theme.colors.borderSoft,
                    backgroundColor: theme.colors.surfaceAlt,
                    color: theme.colors.textMain,
                  },
                ]}
                multiline
                placeholder="例：「今日は夕方の空がきれいだった」"
                placeholderTextColor={theme.colors.textSub}
                value={text}
                onChangeText={setText}
                maxLength={200}
              />

              {/* 文字数・注意 */}
              <View style={styles.counterRow}>
                <Text
                  style={[
                    styles.counterText,
                    {
                      color: isOverLimit
                        ? theme.colors.primary
                        : theme.colors.textSub,
                    },
                  ]}
                >
                  {charCount}/{MAX_LENGTH} 文字
                </Text>
                {isOverLimit && (
                  <Text
                    style={[
                      styles.warningText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    少し短くしてみましょう
                  </Text>
                )}
              </View>

              {/* 投稿ボタン */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: isDisabled
                      ? theme.colors.surfaceAlt
                      : theme.colors.primary,
                    borderColor: theme.colors.borderSoft,
                  },
                ]}
                activeOpacity={0.8}
                disabled={isDisabled}
                onPress={handleSubmit}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    {
                      color: isDisabled
                        ? theme.colors.textSub
                        : '#FFFFFF',
                    },
                  ]}
                >
                  {submitting || uploadingImage
                    ? '投稿中…'
                    : 'この内容を投稿する'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ===== タイムライン一覧 ===== */}
            <View style={styles.timelineHeaderRow}>
              <Text
                style={[
                  styles.timelineTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                最近の投稿
              </Text>
              <Text
                style={[
                  styles.timelineCount,
                  { color: theme.colors.textSub },
                ]}
              >
                {posts.length} 件
              </Text>
            </View>

            {loadingPosts ? (
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSub },
                ]}
              >
                タイムラインを読み込んでいます…
              </Text>
            ) : posts.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.borderSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.textMain },
                  ]}
                >
                  まだ投稿はありません
                </Text>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSub },
                  ]}
                >
                  はじめの一言や一枚を、あなたが投稿しても大丈夫です。
                  誰かの「自分もそうだな」と感じるきっかけになるかもしれません。
                </Text>
              </View>
            ) : (
              <View style={styles.postsContainer}>
                {posts.map(post => {
                  const isOwnPost =
                    currentUid && currentUid === post.authorUid;

                  return (
                    <View
                      key={post.id}
                      style={[
                        styles.postCard,
                        { backgroundColor: theme.colors.card },
                      ]}
                    >
                      {/* ヘッダー：プロフィール画像 + ニックネーム + 時刻 */}
                      <View style={styles.postHeaderRow}>
                        <View style={styles.postHeaderLeft}>
                          {post.authorProfileImageUrl ? (
                            <Image
                              source={{ uri: post.authorProfileImageUrl }}
                              style={styles.avatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.avatarPlaceholder,
                                { backgroundColor: theme.colors.surfaceAlt },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.avatarInitial,
                                  { color: theme.colors.textSub },
                                ]}
                              >
                                {getInitial(post.nickname || 'S')}
                              </Text>
                            </View>
                          )}
                          <Text
                            style={[
                              styles.postNickname,
                              { color: theme.colors.textMain },
                            ]}
                          >
                            {post.nickname || 'SereNoteユーザー'}
                          </Text>
                        </View>

                        <View style={styles.headerRightRow}>
                          {post.createdAt && (
                            <Text
                              style={[
                                styles.postTime,
                                { color: theme.colors.textSub },
                              ]}
                            >
                              {formatDate(post.createdAt)}
                            </Text>
                          )}

                          {isOwnPost && (
                            <TouchableOpacity
                              onPress={() => handleDeletePost(post.id)}
                              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                              <Text
                                style={[
                                  styles.deleteText,
                                  { color: theme.colors.textSub },
                                ]}
                              >
                                削除
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* 投稿画像 */}
                      {post.imageUrl ? (
                        <Image
                          source={{ uri: post.imageUrl }}
                          style={styles.postImage}
                        />
                      ) : null}

                      {/* 本文 */}
                      {post.text ? (
                        <Text
                          style={[
                            styles.postText,
                            { color: theme.colors.textMain },
                          ]}
                        >
                          {post.text}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 情報カード（ここに「これは治療ではない」も明示） */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.borderSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.infoTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                v1.0 のタイムラインについて
              </Text>
              <Text
                style={[
                  styles.infoText,
                  { color: theme.colors.textSub },
                ]}
              >
                ・投稿はニックネームベースの匿名として扱われます。
                {'\n'}
                ・他のユーザーと直接チャットする機能はありません。
                {'\n'}
                ・このタイムラインは「共感のきっかけ」を目的としており、
                  医療行為やカウンセリングの代わりではありません。
                {'\n'}
                ・今すぐ命の危険を感じるような場合は、このアプリではなく、
                  医療機関や地域の相談窓口などの公的な支援を優先してください。
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  imageRow: { marginBottom: 8 },
  imagePreviewWrapper: { alignItems: 'flex-start' },
  imagePreview: {
    width: 180,
    height: 120,
    borderRadius: 10,
    marginBottom: 6,
  },
  imageRemoveButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  imageRemoveText: { fontSize: 11 },
  imageHint: { fontSize: 11 },
  imagePickButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  imagePickText: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  counterText: { fontSize: 11 },
  warningText: {
    fontSize: 11,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timelineCount: { fontSize: 11 },
  loadingText: {
    fontSize: 12,
    marginBottom: 8,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: { fontSize: 12, lineHeight: 18 },
  postsContainer: { marginTop: 4 },
  postCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '600',
  },
  postNickname: {
    fontSize: 13,
    fontWeight: '600',
  },
  postTime: { fontSize: 11, marginRight: 8 },
  deleteText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  postText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
  },
});