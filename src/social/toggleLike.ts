// src/social/toggleLike.ts
import {
    doc,
    increment,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase'; // ← もしパス違うなら合わせて

export async function toggleLike(postId: string, userId: string) {
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'posts', postId, 'likes', userId);

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);

    if (likeSnap.exists()) {
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: increment(-1) });
    } else {
      tx.set(likeRef, { createdAt: serverTimestamp() });
      tx.update(postRef, { likeCount: increment(1) });
    }
  });
}