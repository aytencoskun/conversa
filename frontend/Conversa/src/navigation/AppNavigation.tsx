import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RecordScreen from '../screens/RecordScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import MeetingDetailScreen from '../screens/MeetingDetailScreen';

// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const RecordTabButton = ({ children, onPress }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.recordButtonContainer}
    >
      <View style={styles.recordButton}>{children}</View>
    </TouchableOpacity>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8eab96',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ size }) => <Ionicons name="mic-circle-outline" color="#F9F7F2" size={40} style={{ marginLeft: -5, marginBottom: -8 }} />,
          tabBarButton: (props) => <RecordTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="list" color={color} size={size} />,
          tabBarLabel: 'History'
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  recordButtonContainer: {
    position: 'absolute',
    top: -15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  recordButton: {

    width: 74,
    height: 74,
    borderRadius: 40,
    backgroundColor: '#506e5b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2F23',
    shadowOffset: { width: - 10, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
