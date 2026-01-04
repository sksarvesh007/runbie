import { auth, db, firebase } from '../config/firebase.config';

export const authService = {
  // Sign up with email and password
  signUp: async (email, password, displayName) => {
    try {
      console.log('Starting signup for:', email);
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;
      console.log('User created:', user.uid);

      // Create user document in Firestore
      await db.collection('users').doc(user.uid).set({
        userId: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: null,
        authProvider: 'email',
        accountType: 'free',
        subscriptionPlan: null,
        subscriptionStatus: null,
        sessionsUsed: 0,
        maxSessions: 5,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log('User document created in Firestore');

      return user;
    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      throw error;
    }
  },

  // Log in with email and password
  login: async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );

      // Update last login
      await db.collection('users').doc(userCredential.user.uid).update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Log out
  logout: async () => {
    try {
      await auth.signOut();
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async email => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async userId => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      throw error;
    }
  },
};
