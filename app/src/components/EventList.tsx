import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import type { AffinityEvent } from '../types';

interface EventListProps {
  events: AffinityEvent[];
  /** 事件保存失败时的错误信息 */
  error?: string | null;
  /** 重试回调 */
  onRetry?: () => void;
}

/** 格式化时间戳为可读时间 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 格式化变化值显示（+5 / -3） */
function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/** 好感度事件列表组件 */
export default function EventList({ events, error, onRetry }: EventListProps) {
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无好感度事件</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.eventItem}>
          <View style={styles.eventHeader}>
            <Text
              style={[
                styles.eventDelta,
                { color: item.delta > 0 ? '#34C759' : item.delta < 0 ? '#FF3B30' : '#8E8E93' },
              ]}
            >
              {formatDelta(item.delta)}
            </Text>
            <Text style={styles.eventAfter}>→ {item.affinityAfter}</Text>
          </View>
          {item.reason ? (
            <Text style={styles.eventReason}>{item.reason}</Text>
          ) : null}
          <Text style={styles.eventTime}>{formatTime(item.createdAt)}</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}


const styles = StyleSheet.create({
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDelta: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  eventAfter: {
    fontSize: 14,
    color: '#8E8E93',
  },
  eventReason: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  separator: {
    height: 6,
  },
});
