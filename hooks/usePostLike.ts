// hooks/usePostLike.ts
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../src/firebase'; // ← パスはプロジェクトに合わせて

export function usePostLike(postId: string, userId: string | null | undefined) {
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const postRef = doc(db, 'posts', postId);
    const unsubPost = onSnapshot(postRef, (snap) => {
      const data = snap.data() as any;
      setLikeCount(typeof data?.likeCount === 'number' ? data.likeCount : 0);
      setReady(true);
    });

    let unsubLike = () => {};
    if (userId) {
      const likeRef = doc(db, 'posts', postId, 'likes', userId);
      unsubLike = onSnapshot(likeRef, (snap) => {
        setLikedByMe(snap.exists());
      });
    } else {
      setLikedByMe(false);
    }

    return () => {
      unsubPost();
      unsubLike();
    };
  }, [postId, userId]);

  return { likedByMe, likeCount, ready };
}