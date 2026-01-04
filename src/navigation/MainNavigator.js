import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import RunSetupScreen from '../screens/RunSetupScreen/RunSetupScreen';
import ActiveRunScreen from '../screens/ActiveRunScreen/ActiveRunScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen/SessionHistoryScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen/SessionDetailScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen/SubscriptionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RunSetup"
        component={RunSetupScreen}
        options={{ title: 'Setup Run' }}
      />
      <Stack.Screen
        name="ActiveRun"
        component={ActiveRunScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Upgrade' }}
      />
    </Stack.Navigator>
  );
};

const HistoryStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SessionHistoryMain"
        component={SessionHistoryScreen}
        options={{ title: 'Run History' }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Run Details' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Subscription' }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
