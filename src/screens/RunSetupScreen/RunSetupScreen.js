import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { locationService } from '../../services/location.service';
import useSessionStore from '../../store/sessionStore';

const RunSetupScreen = ({ navigation }) => {
  const [distanceGoal, setDistanceGoal] = useState('5');
  const [paceMin, setPaceMin] = useState('5');
  const [paceMax, setPaceMax] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  
  const startSession = useSessionStore((state) => state.startSession);

  useEffect(() => {
    checkPermissions();
  }, []);

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
      Alert.alert('Invalid Distance', 'Please enter a distance between 0.1 and 100 km');
      return false;
    }

    if (isNaN(minPace) || minPace <= 0 || minPace > 30) {
      Alert.alert('Invalid Pace', 'Please enter a valid minimum pace (1-30 min/km)');
      return false;
    }

    if (isNaN(maxPace) || maxPace <= 0 || maxPace > 30) {
      Alert.alert('Invalid Pace', 'Please enter a valid maximum pace (1-30 min/km)');
      return false;
    }

    if (minPace >= maxPace) {
      Alert.alert('Invalid Pace Range', 'Minimum pace should be faster (lower number) than maximum pace');
      return false;
    }

    return true;
  };

  const handleStartRun = async () => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Setup Your Run 🏃‍♂️</Text>
      <Text style={styles.subtitle}>Configure your run settings and outrun the zombie!</Text>

      {!hasLocationPermission && (
        <Card style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>📍 Location Permission Required</Text>
          <Text style={styles.permissionText}>
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
        <Text style={styles.cardTitle}>Distance Goal</Text>
        <Input
          placeholder="Enter distance"
          value={distanceGoal}
          onChangeText={setDistanceGoal}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={styles.unit}>kilometers</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Your Pace Zone</Text>
        <Text style={styles.cardDescription}>
          Set your comfortable pace range (min/km). The zombie will chase you based on your max pace!
        </Text>
        
        <View style={styles.paceRow}>
          <View style={styles.paceInput}>
            <Text style={styles.paceLabel}>Min Pace (Fast)</Text>
            <Input
              placeholder="5"
              value={paceMin}
              onChangeText={setPaceMin}
              keyboardType="decimal-pad"
            />
            <Text style={styles.paceUnit}>min/km</Text>
          </View>
          
          <View style={styles.paceInput}>
            <Text style={styles.paceLabel}>Max Pace (Slow)</Text>
            <Input
              placeholder="7"
              value={paceMax}
              onChangeText={setPaceMax}
              keyboardType="decimal-pad"
            />
            <Text style={styles.paceUnit}>min/km</Text>
          </View>
        </View>
      </Card>

      <Card style={[styles.card, styles.zombieCard]}>
        <Text style={styles.zombieTitle}>🧟 Zombie Info</Text>
        <View style={styles.zombieInfo}>
          <Text style={styles.zombieLabel}>Zombie Pace:</Text>
          <Text style={styles.zombiePace}>{calculateZombiePace()} min/km</Text>
        </View>
        <Text style={styles.zombieDescription}>
          The zombie will chase you at this pace. If it catches you (within 10m), it will start eating your distance!
        </Text>
      </Card>

      <Button
        title={hasLocationPermission ? "Start Run" : "Enable Location First"}
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
    backgroundColor: theme.colors.zombie + '15',
    borderColor: theme.colors.zombie,
    borderWidth: 1,
  },
  zombieTitle: {
    ...theme.typography.h3,
    color: theme.colors.zombie,
    marginBottom: theme.spacing.md,
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
    color: theme.colors.zombie,
  },
  zombieDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  startButton: {
    marginTop: theme.spacing.lg,
  },
});

export default RunSetupScreen;
