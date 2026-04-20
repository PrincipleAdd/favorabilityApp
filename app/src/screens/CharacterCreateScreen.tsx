import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useCharacterStore } from '../store/characterStore';
import AvatarPicker from '../components/AvatarPicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CharacterCreate'>;

/** 人物创建页 */
export default function CharacterCreateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { createCharacter, fetchCharacters, loading } = useCharacterStore();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [note, setNote] = useState('');
  const [nameError, setNameError] = useState('');

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (nameError) setNameError('');
  }, [nameError]);

  const handleSubmit = useCallback(async () => {
    // 姓名非空校验
    if (!name.trim()) {
      setNameError('姓名不能为空');
      return;
    }

    try {
      await createCharacter({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
        note: note.trim() || undefined,
      });
      // 创建成功，返回列表页并刷新
      await fetchCharacters();
      navigation.goBack();
    } catch (err) {
      // 提取失败原因
      let message = '创建失败，请稍后重试';
      if (
        typeof err === 'object' &&
        err !== null &&
        'isAxiosError' in err &&
        (err as any).isAxiosError
      ) {
        const axiosErr = err as any;
        if (axiosErr.response?.data?.error) {
          message = axiosErr.response.data.error;
        } else if (axiosErr.message) {
          message = axiosErr.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert('创建失败', message);
    }
  }, [name, avatar, note, createCharacter, fetchCharacters, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 姓名 */}
        <Text style={styles.label}>姓名 *</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          placeholder="请输入人物姓名"
          value={name}
          onChangeText={handleNameChange}
          maxLength={50}
          autoFocus
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        {/* 头像 */}
        <Text style={styles.label}>头像</Text>
        <AvatarPicker uri={avatar} name={name} onPick={setAvatar} />

        {/* 备注 */}
        <Text style={styles.label}>备注</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="选填，添加备注信息"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>创建</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
