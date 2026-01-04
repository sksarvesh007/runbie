import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { subscriptionService, SUBSCRIPTION_PLANS } from '../../services/subscription.service';
import useAuthStore from '../../store/authStore';

const SubscriptionScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    const status = await subscriptionService.getSubscriptionStatus();
    setSubscriptionStatus(status);
  };

  const handlePurchase = async (planId) => {
    if (planId === 'free') return;

    setIsLoading(true);
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      
      // For now, simulate payment success
      // In production, integrate with Razorpay here
      Alert.alert(
        'Payment Integration',
        `Razorpay integration required.\n\nPlan: ${plan.name}\nPrice: ${plan.priceDisplay}\n\nTo complete integration:\n1. Install react-native-razorpay\n2. Add Razorpay API keys to .env\n3. Implement checkout flow`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Purchase',
            onPress: async () => {
              try {
                // Simulate successful payment
                const result = await subscriptionService.activateSubscription(
                  planId,
                  `pay_simulated_${Date.now()}`,
                  `order_simulated_${Date.now()}`
                );
                
                // Update user state
                setUser({
                  ...user,
                  accountType: result.accountType,
                  subscriptionPlan: planId,
                  maxSessions: -1,
                });

                Alert.alert(
                  '🎉 Success!',
                  `You are now a ${plan.name} subscriber! Enjoy unlimited zombie runs.`,
                  [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to activate subscription. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = subscriptionStatus?.accountType === 'premium' || 
                    subscriptionStatus?.accountType === 'lifetime';

  const renderPlanCard = (plan, planKey) => {
    const isSelected = selectedPlan === plan.id;
    const isCurrent = subscriptionStatus?.subscriptionPlan === plan.id;
    
    if (plan.id === 'free') return null;

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => setSelectedPlan(plan.id)}
        activeOpacity={0.8}
      >
        <Card style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isCurrent && styles.planCardCurrent,
        ]}>
          {plan.savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>{plan.savings}</Text>
            </View>
          )}
          
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.priceDisplay}</Text>
          
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isCurrent ? (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Current Plan</Text>
            </View>
          ) : (
            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Premium 🚀</Text>
        <Text style={styles.subtitle}>
          Unlock unlimited zombie runs and advanced features
        </Text>
      </View>

      {/* Current Status */}
      {!isPremium && (
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="ticket-outline" size={24} color={theme.colors.warning} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Free Account</Text>
              <Text style={styles.statusText}>
                {subscriptionStatus?.maxSessions - subscriptionStatus?.sessionsUsed || 5} sessions remaining
              </Text>
            </View>
          </View>
        </Card>
      )}

      {isPremium && (
        <Card style={styles.premiumCard}>
          <View style={styles.statusRow}>
            <Ionicons name="star" size={24} color={theme.colors.primary} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {subscriptionStatus?.accountType === 'lifetime' ? 'Lifetime Member' : 'Premium Member'}
              </Text>
              <Text style={styles.statusText}>
                {subscriptionStatus?.subscriptionExpiry 
                  ? `Expires: ${new Date(subscriptionStatus.subscriptionExpiry).toLocaleDateString()}`
                  : 'Never expires'}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Plan Cards */}
      <Text style={styles.sectionTitle}>Choose Your Plan</Text>
      
      {renderPlanCard(SUBSCRIPTION_PLANS.MONTHLY, 'MONTHLY')}
      {renderPlanCard(SUBSCRIPTION_PLANS.YEARLY, 'YEARLY')}
      {renderPlanCard(SUBSCRIPTION_PLANS.LIFETIME, 'LIFETIME')}

      {/* Purchase Button */}
      {!isPremium && (
        <Button
          title={`Subscribe to ${SUBSCRIPTION_PLANS[selectedPlan.toUpperCase()]?.name}`}
          onPress={() => handlePurchase(selectedPlan)}
          style={styles.purchaseButton}
        />
      )}

      {/* Terms */}
      <Text style={styles.terms}>
        By subscribing, you agree to our Terms of Service and Privacy Policy.
        Subscriptions auto-renew unless cancelled.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  statusCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.warning + '10',
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  premiumCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: theme.spacing.md,
  },
  statusTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  planCard: {
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
  },
  planCardCurrent: {
    borderColor: theme.colors.success,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  savingsText: {
    ...theme.typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
  },
  planName: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  planPrice: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginVertical: theme.spacing.sm,
  },
  featuresContainer: {
    marginTop: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  radioOuter: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  currentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  currentText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  purchaseButton: {
    marginTop: theme.spacing.lg,
  },
  terms: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});

export default SubscriptionScreen;
