import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useCharacterStore } from '../store/characterStore';

interface AffinityControlProps {
  characterId: string;
}

/**
 * 好感度控制组件
 * - 点击 +1/-1 按钮快捷调整好感度
 * - 长按弹出自定义数值输入框（1-100 整数）
 * - 调整后弹出事件描述输入框（选填）
 */
export default function AffinityControl({ characterId }: AffinityControlProps) {
  const adjustAffinity = useCharacterStore((s) => s.adjustAffinity);

  // 自定义数值输入 Modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customError, setCustomError] = useState('');
  /** 长按方向：1 表示增加，-1 表示减少 */
  const customDirectionRef = useRef<1 | -1>(1);

  // 事件描述输入 Modal
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonText, setReasonText] = useState('');
  /** 待提交的 delta 值 */
  const pendingDeltaRef = useRef<number>(0);

  // 长按计时器
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  /**
   * 校验自定义数值输入：必须为 1-100 的正整数
   */
  const validateCustomValue = useCallback((value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1 || num > 100) return null;
    return num;
  }, []);

  /**
   * 开始调整流程：弹出事件描述输入框
   */
  const startAdjust = useCallback((delta: number) => {
    pendingDeltaRef.current = delta;
    setReasonText('');
    setReasonModalVisible(true);
  }, []);

  /**
   * 确认调整：调用 store action
   */
  const confirmAdjust = useCallback(async () => {
    const delta = pendingDeltaRef.current;
    const reason = reasonText.trim() || undefined;
    setReasonModalVisible(false);
    setReasonText('');
    try {
      await adjustAffinity(characterId, { delta, reason });
    } catch {
      Alert.alert('调整失败', '好感度调整失败，请稍后重试');
    }
  }, [adjustAffinity, characterId, reasonText]);

  /**
   * 按下按钮：启动长按检测
   */
  const handlePressIn = useCallback((direction: 1 | -1) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      customDirectionRef.current = direction;
      setCustomValue('');
      setCustomError('');
      setCustomModalVisible(true);
    }, 500);
  }, []);

  /**
   * 松开按钮：如果不是长按则执行 ±1 调整
   */
  const handlePressOut = useCallback(
    (direction: 1 | -1) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!isLongPressRef.current) {
        startAdjust(direction);
      }
    },
    [startAdjust],
  );

  /**
   * 确认自定义数值输入
   */
  const confirmCustomValue = useCallback(() => {
    const num = validateCustomValue(customValue);
    if (num === null) {
      setCustomError('请输入 1-100 之间的整数');
      return;
    }
    setCustomModalVisible(false);
    const delta = customDirectionRef.current * num;
    startAdjust(delta);
  }, [customValue, validateCustomValue, startAdjust]);

  return (
    <View style={styles.container}>
      {/* -1 / 长按自定义减少 */}
      <TouchableOpacity
        style={[styles.button, styles.decreaseButton]}
        activeOpacity={0.7}
        onPressIn={() => handlePressIn(-1)}
        onPressOut={() => handlePressOut(-1)}
      >
        <Text style={styles.buttonText}>-1</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>长按可输入自定义数值</Text>

      {/* +1 / 长按自定义增加 */}
      <TouchableOpacity
        style={[styles.button, styles.increaseButton]}
        activeOpacity={0.7}
        onPressIn={() => handlePressIn(1)}
        onPressOut={() => handlePressOut(1)}
      >
        <Text style={styles.buttonText}>+1</Text>
      </TouchableOpacity>

      {/* 自定义数值输入 Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              输入自定义{customDirectionRef.current === 1 ? '增加' : '减少'}数值
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入 1-100 的整数"
              keyboardType="number-pad"
              value={customValue}
              onChangeText={(text) => {
                setCustomValue(text);
                setCustomError('');
              }}
              autoFocus
            />
            {customError ? (
              <Text style={styles.errorText}>{customError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmCustomValue}
              >
                <Text style={styles.confirmButtonText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 事件描述输入 Modal */}
      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>事件描述（选填）</Text>
            <Text style={styles.modalSubtitle}>
              好感度将{pendingDeltaRef.current > 0 ? '增加' : '减少'}{' '}
              {Math.abs(pendingDeltaRef.current)}
            </Text>
            <TextInput
              style={[styles.modalInput, styles.reasonInput]}
              placeholder="记录本次变化的原因..."
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReasonModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAdjust}
              >
                <Text style={styles.confirmButtonText}>确认调整</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decreaseButton: {
    backgroundColor: '#FF3B30',
  },
  increaseButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: '#C7C7CC',
    textAlign: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
