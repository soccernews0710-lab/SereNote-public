// components/timeline/PostCard.tsx
import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TimelinePost } from '../../app/(tabs)/timeline';
import type { SerenoteTheme } from '../../src/theme/theme';

type Props = {
  theme: SerenoteTheme;
  post: TimelinePost;
  currentUid: string | null;

  likeBusy: boolean;
  onLike: () => void;

  onDelete: () => void;
  onHide: () => void;
  onReport: () => void;
};

function formatDate(date: Date | null): string {
  if (!date) return '';
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function getInitial(name: string) {
  if (!name) return 'S';
  return name.trim().charAt(0);
}

function PostCard({ theme, post, currentUid, likeBusy, onLike, onDelete, onHide, onReport }: Props) {
  const isOwnPost = !!currentUid && currentUid === post.authorUid;
  const canLike = !!currentUid && !isOwnPost && !likeBusy;

  const likeIconColor = useMemo(() => {
    return post.likedByMe ? theme.colors.primary : theme.colors.textSub;
  }, [post.likedByMe, theme.colors.primary, theme.colors.textSub]);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      {/* header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {post.authorProfileImageUrl ? (
            <Image source={{ uri: post.authorProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={[styles.avatarInitial, { color: theme.colors.textSub }]}>
                {getInitial(post.nickname || 'S')}
              </Text>
            </View>
          )}
          <Text style={[styles.nickname, { color: theme.colors.textMain }]}>
            {post.nickname || 'SereNoteユーザー'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {!!post.createdAt && (
            <Text style={[styles.time, { color: theme.colors.textSub }]}>{formatDate(post.createdAt)}</Text>
          )}

          {isOwnPost ? (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={[styles.actionText, { color: theme.colors.textSub }]}>削除</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.safetyRow}>
              <TouchableOpacity onPress={onHide} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={[styles.actionText, { color: theme.colors.textSub }]}>非表示</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onReport} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={[styles.actionText, { color: theme.colors.textSub }]}>通報</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* image */}
      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} /> : null}

      {/* text */}
      {post.text ? <Text style={[styles.postText, { color: theme.colors.textMain }]}>{post.text}</Text> : null}

      {/* like */}
      <View style={styles.likeRow}>
        <TouchableOpacity
          onPress={onLike}
          disabled={!canLike}
          activeOpacity={0.85}
          style={[
            styles.likeButton,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderSoft,
              opacity: canLike ? 1 : 0.5,
            },
          ]}
        >
          <Text style={[styles.likeIcon, { color: likeIconColor }]}>{post.likedByMe ? '♥' : '♡'}</Text>
          <Text style={[styles.likeCount, { color: theme.colors.textSub }]}>{post.likeCount ?? 0}</Text>
        </TouchableOpacity>

        {isOwnPost ? (
          <Text style={[styles.likeHint, { color: theme.colors.textSub }]}>※自分の投稿にはいいねできません</Text>
        ) : null}
      </View>
    </View>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  nickname: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  time: { fontSize: 11 },

  actionText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },

  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  postText: {
    fontSize: 13,
    lineHeight: 18,
  },

  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  likeIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  likeHint: {
    fontSize: 11,
  },
});