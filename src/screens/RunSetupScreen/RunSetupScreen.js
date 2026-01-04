import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { locationService } from '../../services/location.service';
import { sessionService } from '../../services/session.service';
import { subscriptionService } from '../../services/subscription.service';
import useSessionStore from '../../store/sessionStore';
import { useTheme } from '../../context/ThemeContext';

const RunSetupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [distanceGoal, setDistanceGoal] = useState('5');
  const [paceMin, setPaceMin] = useState('5');
  const [paceMax, setPaceMax] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [sessionLimit, setSessionLimit] = useState(null);

  const startSession = useSessionStore(state => state.startSession);

  useEffect(() => {
    checkPermissions();
    checkSessionLimit();
  }, []);

  const checkSessionLimit = async () => {
    const limit = await subscriptionService.canStartSession();
    setSessionLimit(limit);
  };

  const checkPermissions = async () => {
    const permissions = await locationService.checkPermissions();
    setHasLocationPermission(permissions.foreground);
  };

  const requestPermissions = async () => {
    const result = await locationService.requestPermissions();
    setHasLocationPermission(result.granted);
    if (!result.granted) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to track your run. Please enable it in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const calculateZombiePace = () => {
    const maxPace = parseFloat(paceMax);
    if (isNaN(maxPace)) return '--:--';
    // Zombie pace is 0.15 min/km faster than your max pace
    const zombiePace = maxPace + 0.15;
    const minutes = Math.floor(zombiePace);
    const seconds = Math.round((zombiePace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const validateInputs = () => {
    const distance = parseFloat(distanceGoal);
    const minPace = parseFloat(paceMin);
    const maxPace = parseFloat(paceMax);

    if (isNaN(distance) || distance <= 0 || distance > 100) {
      Alert.alert(
        'Invalid Distance',
        'Please enter a distance between 0.1 and 100 km'
      );
      return false;
    }

    if (isNaN(minPace) || minPace <= 0 || minPace > 30) {
      Alert.alert(
        'Invalid Pace',
        'Please enter a valid minimum pace (1-30 min/km)'
      );
      return false;
    }

    if (isNaN(maxPace) || maxPace <= 0 || maxPace > 30) {
      Alert.alert(
        'Invalid Pace',
        'Please enter a valid maximum pace (1-30 min/km)'
      );
      return false;
    }

    if (minPace >= maxPace) {
      Alert.alert(
        'Invalid Pace Range',
        'Minimum pace should be faster (lower number) than maximum pace'
      );
      return false;
    }

    return true;
  };

  const handleStartRun = async () => {
    // Check session limit first
    if (sessionLimit && !sessionLimit.allowed) {
      Alert.alert(
        'Session Limit Reached',
        'You have used all your free sessions. Upgrade to Premium for unlimited zombie runs!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => navigation.navigate('Subscription'),
          },
        ]
      );
      return;
    }

    if (!hasLocationPermission) {
      await requestPermissions();
      return;
    }

    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const sessionData = {
        id: Date.now().toString(),
        distanceGoal: parseFloat(distanceGoal) * 1000, // Convert to meters
        paceMin: parseFloat(paceMin),
        paceMax: parseFloat(paceMax),
        zombiePace: parseFloat(paceMax) + 0.15,
        startTime: Date.now(),
        status: 'active',
      };

      // Start session in Firestore
      await sessionService.startSession({
        distanceGoal: sessionData.distanceGoal,
        paceMin: sessionData.paceMin,
        paceMax: sessionData.paceMax,
        zombiePace: sessionData.zombiePace,
      });

      // Increment session count for free users
      await subscriptionService.incrementSessionCount();

      startSession(sessionData);
      navigation.navigate('ActiveRun');
    } catch (error) {
      console.error('Error starting run:', error);
      Alert.alert('Error', 'Failed to start run. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Setup Your Run 🏃‍♂️</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Configure your run settings and outrun the zombie!
      </Text>

      {/* Session Limit Warning */}
      {sessionLimit && sessionLimit.remaining !== -1 && (
        <Card
          style={[
            styles.limitCard,
            sessionLimit.remaining <= 1 && styles.limitCardWarning,
          ]}
        >
          <Text style={[styles.limitTitle, { color: theme.colors.text }]}>
            {sessionLimit.remaining > 0
              ? `🎫 ${sessionLimit.remaining} free session${sessionLimit.remaining > 1 ? 's' : ''} remaining`
              : '🚫 No sessions remaining'}
          </Text>
          {sessionLimit.remaining <= 2 && (
            <Button
              title="Upgrade to Premium"
              variant="outline"
              onPress={() => navigation.navigate('Subscription')}
              style={styles.upgradeButton}
            />
          )}
        </Card>
      )}

      {!hasLocationPermission && (
        <Card style={styles.permissionCard}>
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            📍 Location Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            We need access to your location to track your run distance and pace.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermissions}
            style={styles.permissionButton}
          />
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Distance Goal</Text>
        <Input
          placeholder="Enter distance"
          value={distanceGoal}
          onChangeText={setDistanceGoal}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>kilometers</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Your Pace Zone</Text>
        <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
          Set your comfortable pace range (min/km). The zombie will chase you
          based on your max pace!
        </Text>

        <View style={styles.paceRow}>
          <View style={styles.paceInput}>
            <Text style={[styles.paceLabel, { color: theme.colors.text }]}>Min Pace (Fast)</Text>
            <Input
              placeholder="5"
              value={paceMin}
              onChangeText={setPaceMin}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.paceUnit, { color: theme.colors.textSecondary }]}>min/km</Text>
          </View>

          <View style={styles.paceInput}>
            <Text style={[styles.paceLabel, { color: theme.colors.text }]}>Max Pace (Slow)</Text>
            <Input
              placeholder="7"
              value={paceMax}
              onChangeText={setPaceMax}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.paceUnit, { color: theme.colors.textSecondary }]}>min/km</Text>
          </View>
        </View>
      </Card>

      <Card style={[styles.card, styles.zombieCard]}>
        {/* Header with Icon */}
        <View style={styles.zombieHeader}>
          <View style={styles.zombieIconContainer}>
            <Text style={styles.zombieIcon}>🧟</Text>
          </View>
          <Text style={styles.zombieTitle}>Zombie Threat</Text>
        </View>

        {/* Pace Display - Centered and Prominent */}
        <View style={styles.zombiePaceContainer}>
          <Text style={styles.zombiePaceLabel}>CHASE SPEED</Text>
          <View style={styles.zombiePaceValueContainer}>
            <Text style={[styles.zombiePaceValue, { color: theme.colors.zombie }]}>
              {calculateZombiePace()}
            </Text>
            <Text style={[styles.zombiePaceUnit, { color: theme.colors.zombie }]}>min/km</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.zombieDivider, { backgroundColor: theme.colors.zombie + '30' }]} />

        {/* Info Bullets */}
        <View style={styles.zombieFeatures}>
          <View style={styles.zombieFeatureItem}>
            <Text style={styles.zombieFeatureDot}>⚡</Text>
            <Text style={[styles.zombieFeatureText, { color: theme.colors.textSecondary }]}>
              Starts chasing after 30 second head start
            </Text>
          </View>
          <View style={styles.zombieFeatureItem}>
            <Text style={styles.zombieFeatureDot}>🎯</Text>
            <Text style={[styles.zombieFeatureText, { color: theme.colors.textSecondary }]}>
              Catches you within 10 meters range
            </Text>
          </View>
          <View style={styles.zombieFeatureItem}>
            <Text style={styles.zombieFeatureDot}>💀</Text>
            <Text style={[styles.zombieFeatureText, { color: theme.colors.textSecondary }]}>
              Eats your distance when caught!
            </Text>
          </View>
        </View>
      </Card>

      <Button
        title={hasLocationPermission ? 'Start Run' : 'Enable Location First'}
        onPress={handleStartRun}
        loading={isLoading}
        style={styles.startButton}
        disabled={!hasLocationPermission}
      />
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
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  permissionCard: {
    backgroundColor: theme.colors.warning + '20',
    borderColor: theme.colors.warning,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  permissionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  permissionButton: {
    marginTop: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.xs,
  },
  unit: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  paceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  paceInput: {
    flex: 1,
  },
  paceLabel: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  paceUnit: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  zombieCard: {
    backgroundColor: theme.colors.zombie + '08',
    borderColor: theme.colors.zombie + '40',
    borderWidth: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  zombieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  zombieIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.zombie + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  zombieIcon: {
    fontSize: 28,
  },
  zombieTitle: {
    ...theme.typography.h2,
    color: theme.colors.zombie,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  zombiePaceContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.zombie + '10',
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
  },
  zombiePaceLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.zombie + '90',
    marginBottom: theme.spacing.xs,
  },
  zombiePaceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  zombiePaceValue: {
    fontSize: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  zombiePaceUnit: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    opacity: 0.8,
  },
  zombieDivider: {
    height: 1,
    marginBottom: theme.spacing.lg,
  },
  zombieFeatures: {
    gap: theme.spacing.sm,
  },
  zombieFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zombieFeatureDot: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  zombieFeatureText: {
    ...theme.typography.body2,
    flex: 1,
  },
  zombieInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  zombieLabel: {
    ...theme.typography.body1,
    color: theme.colors.text,
  },
  zombiePace: {
    ...theme.typography.h2,
  },
  zombieDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  startButton: {
    marginTop: theme.spacing.lg,
  },
  limitCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  limitCardWarning: {
    backgroundColor: theme.colors.warning + '10',
    borderColor: theme.colors.warning + '30',
  },
  limitTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: theme.spacing.md,
  },
});

export default RunSetupScreen;
