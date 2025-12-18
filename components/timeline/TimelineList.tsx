// components/timeline/TimelineList.tsx
import React, { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { TimelinePost } from '../../app/(tabs)/timeline';
import type { SerenoteTheme } from '../../src/theme/theme';
import PostCard from './PostCard';

type Props = {
  theme: SerenoteTheme;
  posts: TimelinePost[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  loadingMore: boolean;
  canLoadMore: boolean;

  currentUid: string | null;
  likingPostIds: Record<string, boolean>;
  onLike: (postId: string) => void;

  onDelete: (postId: string) => void;
  onHide: (postId: string) => void;
  onReport: (post: TimelinePost) => void;
};

function TimelineList({
  theme,
  posts,
  loading,
  refreshing,
  onRefresh,
  onEndReached,
  loadingMore,
  canLoadMore,
  currentUid,
  likingPostIds,
  onLike,
  onDelete,
  onHide,
  onReport,
}: Props) {
  const keyExtractor = useCallback((item: TimelinePost) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: TimelinePost }) => (
      <PostCard
        theme={theme}
        post={item}
        currentUid={currentUid}
        likeBusy={!!likingPostIds[item.id]}
        onLike={() => onLike(item.id)}
        onDelete={() => onDelete(item.id)}
        onHide={() => onHide(item.id)}
        onReport={() => onReport(item)}
      />
    ),
    [currentUid, likingPostIds, onDelete, onHide, onLike, onReport, theme]
  );

  const ListHeaderComponent = useCallback(() => {
    return (
      <View style={styles.listHeader}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>最近の投稿</Text>
          <Text style={[styles.count, { color: theme.colors.textSub }]}>{posts.length} 件</Text>
        </View>

        {loading ? (
          <Text style={[styles.loadingText, { color: theme.colors.textSub }]}>
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
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>まだ投稿はありません</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSub }]}>
              右下の＋ボタンから、あなたが最初の一言や一枚を投稿しても大丈夫です。
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [loading, posts.length, theme.colors]);

  const ListFooterComponent = useCallback(() => {
    if (!loadingMore) return <View style={{ height: 12 }} />;
    return (
      <View style={styles.footer}>
        <ActivityIndicator />
        <Text style={[styles.footerText, { color: theme.colors.textSub }]}>読み込み中…</Text>
      </View>
    );
  }, [loadingMore, theme.colors.textSub]);

  return (
    <FlatList
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReachedThreshold={0.35}
      onEndReached={() => {
        if (!canLoadMore) return;
        onEndReached();
      }}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default memo(TimelineList);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120, // FABと被らない余白
  },
  listHeader: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  count: { fontSize: 11 },
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
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
  },
});