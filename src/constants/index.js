export const APP_CONFIG = {
  FREE_SESSION_LIMIT: 5,
  ZOMBIE_PACE_OFFSET: 0.15,
  CATCH_DISTANCE_THRESHOLD: 10,
  WARNING_DISTANCE_THRESHOLD: 50,
  DISTANCE_EATEN_PER_SECOND: 1,
  LOCATION_UPDATE_INTERVAL: 5000,
  SESSION_SAVE_INTERVAL: 30000,
  GPS_ACCURACY_THRESHOLD: 50,
  PACE_SMOOTHING_POINTS: 5,
};

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly',
    name: 'Monthly',
    price: 10,
    currency: 'USD',
    duration: '1 month',
    features: ['Unlimited runs', 'All features', 'Priority support'],
  },
  YEARLY: {
    id: 'yearly',
    name: 'Yearly',
    price: 80,
    currency: 'USD',
    duration: '1 year',
    features: ['Unlimited runs', 'All features', 'Priority support', '33% savings'],
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 150,
    currency: 'USD',
    duration: 'Forever',
    features: ['Unlimited runs', 'All features', 'Priority support', 'One-time payment'],
  },
};

export const SESSION_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
};

export const ACCOUNT_TYPE = {
  FREE: 'free',
  PREMIUM: 'premium',
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};
