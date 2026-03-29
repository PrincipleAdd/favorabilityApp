import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';

import { View, Text, StyleSheet } from 'react-native';
import CharacterListScreen from './src/screens/CharacterListScreen';
import CharacterCreateScreen from './src/screens/CharacterCreateScreen';

// 占位页面，后续任务中实现
function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text>好感度管理系统</Text>
    </View>
  );
}

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
          component={PlaceholderScreen}
          options={{ title: '人物详情' }}
        />
        <Stack.Screen
          name="CharacterEdit"
          component={PlaceholderScreen}
          options={{ title: '编辑人物' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
