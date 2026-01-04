import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { sessionService } from '../../services/session.service';
import { formatDistance, formatTime } from '../../services/location.service';

import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      }
      const userStats = await sessionService.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadStats(true);
  };

  const sessionsRemaining = user?.maxSessions
    ? user.maxSessions - (user.sessionsUsed || 0)
    : 5;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={[styles.content]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to Runbie! 🏃‍♂️🧟</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Run from zombies, track your progress
        </Text>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons
              name="fitness-outline"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.totalRuns || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Runs</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons
              name="speedometer-outline"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatDistance(stats?.totalDistance || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Distance</Text>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons
              name="time-outline"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatTime(stats?.totalTime || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Time</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.zombieIcon}>🧟</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.totalCatches || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Times Caught</Text>
          </Card>
        </View>

        {/* Sessions Remaining */}
        {user?.accountType === 'free' && (
          <Card style={styles.sessionsCard}>
            <View style={styles.sessionsHeader}>
              <Ionicons
                name="ticket-outline"
                size={24}
                color={theme.colors.warning}
              />
              <Text style={styles.sessionsTitle}>Free Account</Text>
            </View>
            <Text style={[styles.sessionsCount, { color: theme.colors.text }]}>
              {sessionsRemaining} sessions remaining
            </Text>
            <Button
              title="Upgrade to Premium"
              variant="outline"
              onPress={() => navigation.navigate('Subscription')}
              style={styles.upgradeButton}
            />
          </Card>
        )}

        <Button
          title="Start New Run"
          onPress={() => navigation.navigate('RunSetup')}
          style={styles.button}
        />

        <Text style={[styles.phaseNote, { color: theme.colors.textSecondary }]}>
          ✅ Phase 1: Project Setup Complete{'\n'}✅ Phase 2: Authentication
          Complete{'\n'}✅ Phase 3: GPS Tracking Complete{'\n'}✅ Phase 4: Map
          Integration Complete{'\n'}✅ Phase 5: Zombie Chase Mechanics Complete
          {'\n'}✅ Phase 6: Session Management Complete{'\n'}✅ Phase 7:
          Subscriptions & Payments Complete
        </Text>
      </View>
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
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  zombieIcon: {
    fontSize: 28,
  },
  sessionsCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.warning + '10',
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sessionsTitle: {
    ...theme.typography.h4,
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
  sessionsCount: {
    ...theme.typography.body1,
    // color: theme.colors.text, // Handled dynamically
    marginBottom: theme.spacing.md,
  },
  upgradeButton: {
    borderColor: theme.colors.warning,
  },
  button: {
    marginBottom: theme.spacing.lg,
  },
  phaseNote: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 24,
  },
});

export default HomeScreen;
