import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';

import CharacterListScreen from './src/screens/CharacterListScreen';
import CharacterCreateScreen from './src/screens/CharacterCreateScreen';
import CharacterDetailScreen from './src/screens/CharacterDetailScreen';
import CharacterEditScreen from './src/screens/CharacterEditScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
