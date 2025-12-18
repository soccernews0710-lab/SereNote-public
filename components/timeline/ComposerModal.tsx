// components/timeline/ComposerModal.tsx
import React, { memo, useMemo } from 'react';
import {
    Image,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { SerenoteTheme } from '../../src/theme/theme';

type Props = {
  theme: SerenoteTheme;
  visible: boolean;
  onClose: () => void;

  text: string;
  onChangeText: (v: string) => void;
  maxLength: number;

  selectedImageUri: string | null;
  onPickImage: () => void;
  onClearImage: () => void;

  submitting: boolean;
  uploadingImage: boolean;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
};

function ComposerModal({
  theme,
  visible,
  onClose,
  text,
  onChangeText,
  maxLength,
  selectedImageUri,
  onPickImage,
  onClearImage,
  submitting,
  uploadingImage,
  onSubmit,
  isSubmitDisabled,
}: Props) {
  const charCount = text.length;
  const isOverLimit = charCount > maxLength;

  const buttonLabel = useMemo(() => {
    if (submitting || uploadingImage) return '投稿中…';
    return 'この内容を投稿する';
  }, [submitting, uploadingImage]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={() => Keyboard.dismiss()} />

      <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
        <View style={styles.topRow}>
          <Text style={[styles.sheetTitle, { color: theme.colors.textMain }]}>投稿する</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.closeText, { color: theme.colors.textSub }]}>閉じる</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.desc, { color: theme.colors.textSub }]}>
          画像だけでも、短い文章だけでもOKです（{maxLength}文字まで）
        </Text>

        {/* image */}
        <View style={styles.imageRow}>
          {selectedImageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: selectedImageUri }} style={styles.preview} />
              <TouchableOpacity
                onPress={onClearImage}
                style={[styles.pill, { backgroundColor: theme.colors.surfaceAlt }]}
              >
                <Text style={[styles.pillText, { color: theme.colors.textSub }]}>画像を削除</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.hint, { color: theme.colors.textSub }]}>
              画像を選ばない場合は、テキストだけの投稿もできます。
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onPickImage}
          activeOpacity={0.85}
          style={[
            styles.pickButton,
            {
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}
        >
          <Text style={[styles.pickText, { color: theme.colors.textMain }]}>
            {selectedImageUri ? '別の画像を選ぶ' : '画像を選ぶ'}
          </Text>
        </TouchableOpacity>

        {/* text */}
        <TextInput
          style={[
            styles.input,
            {
              borderColor: isOverLimit ? theme.colors.primary : theme.colors.borderSoft,
              backgroundColor: theme.colors.surfaceAlt,
              color: theme.colors.textMain,
            },
          ]}
          multiline
          placeholder="例：「今日は夕方の空がきれいだった」"
          placeholderTextColor={theme.colors.textSub}
          value={text}
          onChangeText={onChangeText}
          maxLength={200}
          autoFocus={Platform.OS !== 'ios'} // iOSは勝手にフォーカスするとズレる時があるので控えめ
        />

        <View style={styles.counterRow}>
          <Text style={[styles.counter, { color: isOverLimit ? theme.colors.primary : theme.colors.textSub }]}>
            {charCount}/{maxLength} 文字
          </Text>
          {isOverLimit ? (
            <Text style={[styles.warn, { color: theme.colors.primary }]}>少し短くしてみましょう</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.85}
          style={[
            styles.submit,
            {
              backgroundColor: isSubmitDisabled ? theme.colors.surfaceAlt : theme.colors.primary,
              borderColor: theme.colors.borderSoft,
            },
          ]}
        >
          <Text style={[styles.submitText, { color: isSubmitDisabled ? theme.colors.textSub : '#FFFFFF' }]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default memo(ComposerModal);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },

  imageRow: { marginBottom: 8 },
  previewWrap: { alignItems: 'flex-start' },
  preview: {
    width: 220,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  hint: { fontSize: 11 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: { fontSize: 11 },

  pickButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  pickText: {
    fontSize: 12,
    fontWeight: '600',
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  counter: { fontSize: 11 },
  warn: { fontSize: 11, fontWeight: '600' },

  submit: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
  },
});