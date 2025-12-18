// components/social/LikeButton.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { usePostLike } from '../../hooks/usePostLike';
import { toggleLike } from '../../src/social/toggleLike';

type Props = {
  postId: string;
  userId: string | null;
};

export function LikeButton({ postId, userId }: Props) {
  const { likedByMe, likeCount, ready } = usePostLike(postId, userId);
  const [busy, setBusy] = useState(false);

  const label = useMemo(() => (likedByMe ? '♥' : '♡'), [likedByMe]);

  const onPress = useCallback(async () => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      await toggleLike(postId, userId);
    } finally {
      setBusy(false);
    }
  }, [postId, userId, busy]);

  return (
    <Pressable onPress={onPress} disabled={!userId || busy} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {!ready ? <ActivityIndicator /> : <Text style={{ fontSize: 18 }}>{label}</Text>}
      <View>
        <Text style={{ fontSize: 12 }}>{likeCount}</Text>
      </View>
    </Pressable>
  );
}