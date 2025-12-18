// components/timeline/InfoModal.tsx
import React, { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { SerenoteTheme } from '../../src/theme/theme';

type Props = {
  theme: SerenoteTheme;
  visible: boolean;
  onClose: () => void;
};

function InfoModal({ theme, visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.textMain }]}>
            v1.0 のタイムラインについて
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.close, { color: theme.colors.textSub }]}>閉じる</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSoft },
          ]}
        >
          <Text style={[styles.text, { color: theme.colors.textSub }]}>
            ・投稿はニックネームベースの匿名として扱われます。{'\n'}
            ・他のユーザーと直接チャットする機能はありません。{'\n'}
            ・このタイムラインは「共感のきっかけ」を目的としており、医療行為やカウンセリングの代わりではありません。{'\n'}
            ・今すぐ命の危険を感じる場合は、このアプリではなく、医療機関や地域の相談窓口など公的支援を優先してください。
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={[
            styles.okButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default memo(InfoModal);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 120,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  close: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  body: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
  },
  okButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  okText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});