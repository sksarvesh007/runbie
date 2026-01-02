import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from '../config/firebase.config';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth.service';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Loading from '../components/common/Loading';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Timeout fallback in case Firebase auth fails to initialize
    const timeout = setTimeout(() => {
      console.log('Auth initialization timeout - showing login screen');
      setLoading(false);
    }, 5000);

    try {
      // Listen for authentication state changes
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        clearTimeout(timeout);
        try {
          if (user) {
            // User is signed in, fetch profile
            try {
              const userProfile = await authService.getUserProfile(user.uid);
              setUser({ ...user, ...userProfile });
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // Still set the user even if profile fetch fails
              setUser(user);
            }
          } else {
            // User is signed out
            setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Firebase auth initialization error:', error);
      clearTimeout(timeout);
      setLoading(false);
    }

    // Cleanup subscription
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [setUser, setLoading]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
