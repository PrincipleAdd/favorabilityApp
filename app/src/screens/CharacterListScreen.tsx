import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Character } from '../types';
import { useCharacterStore } from '../store/characterStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CharacterList'>;

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

/** 人物列表项组件 */
function CharacterItem({
  character,
  onPress,
  onLongPress,
}: {
  character: Character;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {character.avatar ? (
        <Image source={{ uri: character.avatar }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(character.name)}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {character.name}
      </Text>
      <Text
        style={[styles.affinity, { color: getAffinityColor(character.affinity) }]}
      >
        {character.affinity > 0 ? `+${character.affinity}` : character.affinity}
      </Text>
    </TouchableOpacity>
  );
}

/** 空列表引导提示组件 */
function EmptyList({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👤</Text>
      <Text style={styles.emptyTitle}>还没有人物</Text>
      <Text style={styles.emptySubtitle}>点击下方按钮创建第一个人物吧</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onCreatePress}>
        <Text style={styles.emptyButtonText}>创建人物</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 人物列表页 */
export default function CharacterListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { characters, loading, error, fetchCharacters, deleteCharacter, clearError } =
    useCharacterStore();

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // 网络异常时显示提示信息
  useEffect(() => {
    if (error) {
      Alert.alert('加载失败', error, [
        { text: '重试', onPress: () => { clearError(); fetchCharacters(); } },
        { text: '关闭', style: 'cancel', onPress: clearError },
      ]);
    }
  }, [error, clearError, fetchCharacters]);

  const handleRefresh = useCallback(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handlePress = useCallback(
    (character: Character) => {
      navigation.navigate('CharacterDetail', { characterId: character.id });
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (character: Character) => {
      Alert.alert(
        '删除人物',
        `确定要删除「${character.name}」吗？该操作不可撤销，所有好感度记录也将被删除。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => {
              deleteCharacter(character.id).catch(() => {
                Alert.alert('删除失败', '请稍后重试');
              });
            },
          },
        ],
      );
    },
    [deleteCharacter],
  );

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CharacterCreate');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Character }) => (
      <CharacterItem
        character={item}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      />
    ),
    [handlePress, handleLongPress],
  );

  const keyExtractor = useCallback((item: Character) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          characters.length === 0 ? styles.emptyListContent : undefined
        }
        ListEmptyComponent={<EmptyList onCreatePress={handleCreatePress} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  affinity: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
});
