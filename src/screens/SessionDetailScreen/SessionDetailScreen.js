import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { RunMap } from '../../components/map';
import { sessionService } from '../../services/session.service';
import {
  formatDistance,
  formatTime,
  formatPace,
} from '../../services/location.service';
import { useTheme } from '../../context/ThemeContext';

const SessionDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { sessionId } = route.params || {};
  const [session, setSession] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    }
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      setIsLoading(true);
      const sessionData = await sessionService.getSessionDetails(sessionId);
      setSession(sessionData);

      // Load route points
      const points = await sessionService.getRoutePoints(sessionId);
      setRoutePoints(points);
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    if (!session) return;

    try {
      const message =
        `🏃 Run completed!\n\n` +
        `📏 Distance: ${formatDistance(session.effectiveDistance || 0)}\n` +
        `⏱️ Time: ${formatTime(session.elapsedTime || 0)}\n` +
        `⚡ Pace: ${formatPace(session.averagePace || 0)} min/km\n` +
        `🎯 Goal: ${(session.completionPercentage || 0).toFixed(0)}% completed\n` +
        (session.catchCount > 0
          ? `🧟 Caught ${session.catchCount} times\n`
          : '') +
        `\n#Runbie #ZombieRun`;

      await Share.share({ message });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const getStatusColor = () => {
    return session.status === 'completed'
      ? theme.colors.success
      : theme.colors.error;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{formatDate(session.startedAt)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {session.status === 'completed' ? '✓ Completed' : '✗ Abandoned'}
          </Text>
        </View>
      </View>

      {/* Map */}
      {routePoints.length > 0 && (
        <Card style={styles.mapCard}>
          <RunMap
            routePoints={routePoints}
            currentLocation={routePoints[routePoints.length - 1]}
            showZombie={false}
            followUser={false}
            style={styles.map}
          />
        </Card>
      )}

      {/* Main Stats */}
      <Card style={styles.statsCard}>
        {/* Row 1: Distance Stats */}
        <View style={styles.statsRow}>
          <View style={styles.mainStat}>
            <Ionicons
              name="footsteps-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.mainStatValue, { color: theme.colors.text }]}>
              {formatDistance(session.distanceRun || session.effectiveDistance || 0)}
            </Text>
            <Text style={[styles.mainStatLabel, { color: theme.colors.textSecondary }]}>Raw Distance</Text>
          </View>
          <View style={styles.mainStat}>
            <Ionicons
              name="speedometer-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.mainStatValue, { color: theme.colors.primary }]}>
              {formatDistance(session.effectiveDistance || 0)}
            </Text>
            <Text style={[styles.mainStatLabel, { color: theme.colors.textSecondary }]}>Effective Dist</Text>
          </View>
        </View>
        {/* Row 2: Time Stats */}
        <View style={[styles.statsRow, { marginTop: 16 }]}>
          <View style={styles.mainStat}>
            <Ionicons
              name="time-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.mainStatValue, { color: theme.colors.text }]}>
              {formatTime(session.elapsedTime || 0)}
            </Text>
            <Text style={[styles.mainStatLabel, { color: theme.colors.textSecondary }]}>Duration</Text>
          </View>
          <View style={styles.mainStat}>
            <Ionicons
              name="flash-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.mainStatValue, { color: theme.colors.text }]}>
              {formatPace(session.averagePace || 0)}
            </Text>
            <Text style={[styles.mainStatLabel, { color: theme.colors.textSecondary }]}>Avg Pace</Text>
          </View>
        </View>
      </Card>

      {/* Goal Progress */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Goal Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(session.completionPercentage || 0, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {(session.completionPercentage || 0).toFixed(1)}% of{' '}
            {formatDistance(session.distanceGoal || 0)}
          </Text>
        </View>
      </Card>

      {/* Zombie Stats */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>🧟 Zombie Stats</Text>
        <View style={styles.zombieStats}>
          <View style={styles.zombieStat}>
            <Text style={[styles.zombieStatValue, { color: theme.colors.text }]}>
              {session.catchCount || 0}
            </Text>
            <Text style={[styles.zombieStatLabel, { color: theme.colors.textSecondary }]}>Times Caught</Text>
          </View>
          <View style={styles.zombieStat}>
            <Text
              style={[styles.zombieStatValue, { color: theme.colors.error }]}
            >
              {formatDistance(session.totalDistanceEaten || 0)}
            </Text>
            <Text style={[styles.zombieStatLabel, { color: theme.colors.textSecondary }]}>Distance Eaten</Text>
          </View>
          <View style={styles.zombieStat}>
            <Text style={[styles.zombieStatValue, { color: theme.colors.text }]}>
              {formatPace(session.zombiePace || 0)}
            </Text>
            <Text style={[styles.zombieStatLabel, { color: theme.colors.textSecondary }]}>Zombie Pace</Text>
          </View>
        </View>
      </Card>

      {/* Pace Stats */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>⚡ Pace Details</Text>
        <View style={styles.paceStats}>
          <View style={styles.paceStat}>
            <Text style={[styles.paceLabel, { color: theme.colors.textSecondary }]}>Target Min</Text>
            <Text style={[styles.paceValue, { color: theme.colors.text }]}>
              {formatPace(session.paceMin || 0)}
            </Text>
          </View>
          <View style={styles.paceStat}>
            <Text style={[styles.paceLabel, { color: theme.colors.textSecondary }]}>Target Max</Text>
            <Text style={[styles.paceValue, { color: theme.colors.text }]}>
              {formatPace(session.paceMax || 0)}
            </Text>
          </View>
          <View style={styles.paceStat}>
            <Text style={[styles.paceLabel, { color: theme.colors.textSecondary }]}>Average</Text>
            <Text style={[styles.paceValue, { color: theme.colors.primary }]}>
              {formatPace(session.averagePace || 0)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Catch Events */}
      {session.catchEvents && session.catchEvents.length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>🎯 Catch Events</Text>
          {session.catchEvents.map((event, index) => (
            <View key={index} style={styles.catchEvent}>
              <Text style={[styles.catchEventTime, { color: theme.colors.text }]}>
                {formatTime(event.elapsedTime || 0)}
              </Text>
              <Text style={[styles.catchEventDistance, { color: theme.colors.textSecondary }]}>
                at {formatDistance(event.distance || 0)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Share Button */}
      <Button
        title="Share Run"
        onPress={handleShare}
        style={styles.shareButton}
        icon={
          <Ionicons
            name="share-outline"
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
        }
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
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  date: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  mapCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  map: {
    height: 200,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mainStat: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  mainStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.gray200,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  progressText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  zombieStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  zombieStat: {
    alignItems: 'center',
  },
  zombieStatValue: {
    ...theme.typography.h3,
    color: theme.colors.zombie,
    fontWeight: 'bold',
  },
  zombieStatLabel: {
    ...theme.typography.caption,
    // color: theme.colors.textSecondary, // Handled dynamically
  },
  paceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paceStat: {
    alignItems: 'center',
  },
  paceLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  paceValue: {
    ...theme.typography.h4,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  catchEvent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  catchEventTime: {
    ...theme.typography.body2,
    color: theme.colors.text,
  },
  catchEventDistance: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  shareButton: {
    marginTop: theme.spacing.md,
  },
});

export default SessionDetailScreen;
