import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useCharacterStore } from '../store/characterStore';
import AffinityControl from '../components/AffinityControl';

type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CharacterDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'CharacterDetail'>;

/** 获取好感度数值的颜色 */
function getAffinityColor(affinity: number): string {
  if (affinity > 0) return '#34C759';
  if (affinity < 0) return '#FF3B30';
  return '#8E8E93';
}

/** 获取头像首字母 */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/** 人物详情页 */
export default function CharacterDetailScreen() {
  const navigation = useNavigation<DetailNavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { characterId } = route.params;

  const {
    currentCharacter,
    events,
    loading,
    error,
    setCurrentCharacter,
    fetchEvents,
  } = useCharacterStore();

  // 页面加载时获取人物详情和事件列表
  useEffect(() => {
    async function loadData() {
      try {
        const { getCharacter } = await import('../api/client');
        const character = await getCharacter(characterId);
        setCurrentCharacter(character);
        fetchEvents(characterId);
      } catch {
        // 错误由 store 处理
      }
    }
    loadData();

    return () => {
      setCurrentCharacter(null);
    };
  }, [characterId, setCurrentCharacter, fetchEvents]);

  // 配置右上角编辑按钮
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('CharacterEdit', { characterId })
          }
        >
          <Text style={styles.editButton}>编辑</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, characterId]);

  if (loading && !currentCharacter) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && !currentCharacter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentCharacter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>人物不存在</Text>
      </View>
    );
  }

  const affinityValue = currentCharacter.affinity;
  const affinityDisplay =
    affinityValue > 0 ? `+${affinityValue}` : `${affinityValue}`;

  return (
    <ScrollView style={styles.container}>
      {/* 人物信息区域 */}
      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {getInitial(currentCharacter.name)}
          </Text>
        </View>
        <Text style={styles.characterName}>{currentCharacter.name}</Text>
        {currentCharacter.note ? (
          <Text style={styles.characterNote}>{currentCharacter.note}</Text>
        ) : null}
      </View>

      {/* 好感度显示和控制区域（占位符） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>好感度</Text>
        <View style={styles.affinityCard}>
          <Text
            style={[
              styles.affinityValue,
              { color: getAffinityColor(affinityValue) },
            ]}
          >
            {affinityDisplay}
          </Text>
          <AffinityControl characterId={characterId} />
        </View>
      </View>

      {/* 好感度事件历史列表（占位符） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>好感度事件</Text>
        <View style={styles.eventsPlaceholder}>
          <Text style={styles.placeholderText}>
            事件列表组件（EventList）将在后续任务中实现
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  characterName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  characterNote: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 6,
  },
  affinityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  affinityValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 12,
  },
  eventsPlaceholder: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});
