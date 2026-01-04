import { db, auth } from '../config/firebase.config';

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxSessions: 5,
    features: ['5 zombie runs', 'Basic stats tracking', 'Route history'],
  },
  MONTHLY: {
    id: 'monthly',
    name: 'Monthly',
    price: 99,
    priceDisplay: '₹99/month',
    razorpayPlanId: 'plan_monthly', // Replace with actual Razorpay plan ID
    maxSessions: -1, // Unlimited
    features: [
      'Unlimited zombie runs',
      'Advanced stats & analytics',
      'Route history',
      'Priority support',
    ],
  },
  YEARLY: {
    id: 'yearly',
    name: 'Yearly',
    price: 799,
    priceDisplay: '₹799/year',
    razorpayPlanId: 'plan_yearly', // Replace with actual Razorpay plan ID
    maxSessions: -1,
    savings: '33% off',
    features: [
      'Unlimited zombie runs',
      'Advanced stats & analytics',
      'Route history',
      'Priority support',
      '2 months free',
    ],
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 1999,
    priceDisplay: '₹1,999 one-time',
    razorpayPlanId: 'plan_lifetime', // Replace with actual Razorpay plan ID
    maxSessions: -1,
    savings: 'Best value',
    features: [
      'Unlimited zombie runs forever',
      'Advanced stats & analytics',
      'Route history',
      'Priority support',
      'All future features',
    ],
  },
};

// Session limits
export const FREE_SESSION_LIMIT = 5;

class SubscriptionService {
  constructor() {
    this.currentSubscription = null;
  }

  // Get user's current subscription status
  async getSubscriptionStatus() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return {
          accountType: 'free',
          sessionsUsed: 0,
          maxSessions: FREE_SESSION_LIMIT,
        };
      }

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return {
          accountType: 'free',
          sessionsUsed: 0,
          maxSessions: FREE_SESSION_LIMIT,
        };
      }

      const userData = userDoc.data();
      return {
        accountType: userData.accountType || 'free',
        subscriptionPlan: userData.subscriptionPlan || null,
        subscriptionStatus: userData.subscriptionStatus || null,
        subscriptionExpiry: userData.subscriptionExpiry?.toDate?.() || null,
        sessionsUsed: userData.sessionsUsed || 0,
        maxSessions: userData.maxSessions || FREE_SESSION_LIMIT,
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return {
        accountType: 'free',
        sessionsUsed: 0,
        maxSessions: FREE_SESSION_LIMIT,
      };
    }
  }

  // Check if user can start a new session
  async canStartSession() {
    try {
      const status = await this.getSubscriptionStatus();

      // Premium users have unlimited sessions
      if (
        status.accountType === 'premium' ||
        status.accountType === 'lifetime'
      ) {
        return { allowed: true, remaining: -1 };
      }

      // Free users have limited sessions
      const remaining = status.maxSessions - status.sessionsUsed;
      return {
        allowed: remaining > 0,
        remaining,
        maxSessions: status.maxSessions,
        sessionsUsed: status.sessionsUsed,
      };
    } catch (error) {
      console.error('Failed to check session limit:', error);
      return { allowed: true, remaining: -1 }; // Allow on error
    }
  }

  // Increment session count for free users
  async incrementSessionCount() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const status = await this.getSubscriptionStatus();

      // Only increment for free users
      if (status.accountType === 'free') {
        await db
          .collection('users')
          .doc(userId)
          .update({
            sessionsUsed: (status.sessionsUsed || 0) + 1,
          });
      }
    } catch (error) {
      console.error('Failed to increment session count:', error);
    }
  }

  // Update subscription after successful payment
  async activateSubscription(planId, paymentId, orderId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan');
      }

      let subscriptionExpiry = null;
      let accountType = 'premium';

      if (planId === 'monthly') {
        subscriptionExpiry = new Date();
        subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
      } else if (planId === 'yearly') {
        subscriptionExpiry = new Date();
        subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
      } else if (planId === 'lifetime') {
        accountType = 'lifetime';
        subscriptionExpiry = null; // Never expires
      }

      await db.collection('users').doc(userId).update({
        accountType,
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        subscriptionExpiry,
        maxSessions: -1, // Unlimited
        lastPaymentId: paymentId,
        lastOrderId: orderId,
        subscriptionActivatedAt: new Date(),
      });

      // Create subscription record
      await db.collection('subscriptions').add({
        oderId: userId,
        planId,
        paymentId,
        orderId,
        amount: plan.price,
        status: 'active',
        createdAt: new Date(),
        expiresAt: subscriptionExpiry,
      });

      return { success: true, accountType, subscriptionExpiry };
    } catch (error) {
      console.error('Failed to activate subscription:', error);
      throw error;
    }
  }

  // Check if subscription is expired
  async checkSubscriptionExpiry() {
    try {
      const status = await this.getSubscriptionStatus();

      if (status.accountType === 'lifetime') {
        return { expired: false };
      }

      if (status.subscriptionExpiry && new Date() > status.subscriptionExpiry) {
        // Subscription expired, downgrade to free
        const userId = auth.currentUser?.uid;
        if (userId) {
          await db.collection('users').doc(userId).update({
            accountType: 'free',
            subscriptionStatus: 'expired',
            maxSessions: FREE_SESSION_LIMIT,
          });
        }
        return { expired: true };
      }

      return { expired: false };
    } catch (error) {
      console.error('Failed to check subscription expiry:', error);
      return { expired: false };
    }
  }

  // Get remaining days in subscription
  getRemainingDays(expiryDate) {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
