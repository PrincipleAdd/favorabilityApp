import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface AvatarPickerProps {
  uri: string;
  name?: string;
  onPick: (uri: string) => void;
}

function getInitial(name?: string): string {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?';
}

export default function AvatarPicker({ uri, name, onPick }: AvatarPickerProps) {
  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册访问权限才能选择头像');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePick} activeOpacity={0.7}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.initial}>{getInitial(name)}</Text>
        </View>
      )}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>📷</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', marginVertical: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  placeholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center',
  },
  initial: { color: '#FFF', fontSize: 36, fontWeight: '600' },
  badge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E5E5EA',
  },
  badgeText: { fontSize: 16 },
});
