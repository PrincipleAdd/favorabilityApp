import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { useCharacterStore } from './src/store/characterStore';

import CharacterListScreen from './src/screens/CharacterListScreen';
import CharacterCreateScreen from './src/screens/CharacterCreateScreen';
import CharacterDetailScreen from './src/screens/CharacterDetailScreen';
import CharacterEditScreen from './src/screens/CharacterEditScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const syncOfflineData = useCharacterStore((s) => s.syncOfflineData);
  const appState = useRef(AppState.currentState);

  // App 回到前台时尝试同步
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        syncOfflineData();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [syncOfflineData]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CharacterList">
        <Stack.Screen
          name="CharacterList"
          component={CharacterListScreen}
          options={{ title: '人物列表' }}
        />
        <Stack.Screen
          name="CharacterCreate"
          component={CharacterCreateScreen}
          options={{ title: '创建人物' }}
        />
        <Stack.Screen
          name="CharacterDetail"
          component={CharacterDetailScreen}
          options={{ title: '人物详情' }}
        />
        <Stack.Screen
          name="CharacterEdit"
          component={CharacterEditScreen}
          options={{ title: '编辑人物' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
