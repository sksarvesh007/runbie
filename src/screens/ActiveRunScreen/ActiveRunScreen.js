import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import { RunMap } from '../../components/map';
import {
  locationService,
  formatDistance,
  formatPace,
  formatTime,
  calculateDistance,
} from '../../services/location.service';
import { zombieService, ZOMBIE_CONSTANTS } from '../../services/zombie.service';
import { sessionService } from '../../services/session.service';
import useSessionStore from '../../store/sessionStore';

const ActiveRunScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [zombieLocation, setZombieLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const {
    currentSession,
    isRunning,
    isPaused,
    routePoints,
    distanceRun,
    currentPace,
    elapsedTime,
    zombieDistance,
    zombieGap,
    isCaught,
    catchCount,
    totalDistanceEaten,
    zombieStatus: storedZombieStatus,
    pauseSession,
    resumeSession,
    stopSession,
    addRoutePoint,
    updateDistance,
    updatePace,
    updateElapsedTime,
    updateZombieDistance,
    updateZombieGap,
    setIsCaught,
    updateZombieStatus,
    addCatchEvent,
    addEatenDistance,
    resetSession,
  } = useSessionStore();

  const lastWarningLevelRef = useRef(0);
  const catchStartTimeRef = useRef(null);

  // Start location tracking when component mounts
  useEffect(() => {
    if (currentSession && isRunning) {
      startTracking();
      startTimer();
    }

    return () => {
      stopTracking();
      stopTimer();
    };
  }, []);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused) {
      stopTimer();
    } else if (isRunning && !isPaused) {
      startTimer();
    }
  }, [isPaused, isRunning]);

  // Update zombie position every second for smoother tracking
  useEffect(() => {
    if (!currentSession || isPaused) return;

    const zombieInterval = setInterval(() => {
      updateZombiePosition();
    }, ZOMBIE_CONSTANTS.ZOMBIE_UPDATE_INTERVAL);

    return () => clearInterval(zombieInterval);
  }, [currentSession, isPaused]);

  // Handle distance eating while caught
  useEffect(() => {
    if (!isCaught || isPaused) {
      catchStartTimeRef.current = null;
      return;
    }

    if (!catchStartTimeRef.current) {
      catchStartTimeRef.current = Date.now();
    }

    const eatingInterval = setInterval(() => {
      // Eat distance every second while caught
      addEatenDistance(ZOMBIE_CONSTANTS.DISTANCE_EATEN_PER_SECOND);
    }, 1000);

    return () => clearInterval(eatingInterval);
  }, [isCaught, isPaused]);

  // Periodic save to Firestore
  useEffect(() => {
    if (!currentSession || !isRunning) return;

    const saveInterval = setInterval(() => {
      const state = useSessionStore.getState();
      sessionService.updateSession({
        distanceRun: state.distanceRun,
        effectiveDistance: Math.max(
          0,
          state.distanceRun - state.totalDistanceEaten
        ),
        totalDistanceEaten: state.totalDistanceEaten,
        elapsedTime: state.elapsedTime,
        currentPace: state.currentPace,
        catchCount: state.catchCount,
        routePointsCount: state.routePoints.length,
        isPaused: state.isPaused,
      });
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [currentSession, isRunning]);

  const startTracking = async () => {
    try {
      await locationService.startTracking(handleLocationUpdate);
      setIsTracking(true);
      startTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert(
        'Error',
        'Failed to start GPS tracking. Please check your location settings.'
      );
    }
  };

  const stopTracking = () => {
    locationService.stopTracking();
    setIsTracking(false);
  };

  /*
   * Timer Logic using Timestamp Delta
   * This ensures the timer remains accurate even if the app goes to the background
   * or the interval execution is paused/throttled by the OS.
   */
  const lastResumeTimeRef = useRef(null);
  const elapsedTimeAtResumeRef = useRef(0);

  const startTimer = () => {
    if (timerRef.current) return;

    // Capture the exact time we started/resumed and the elapsed time at that moment
    lastResumeTimeRef.current = Date.now();
    elapsedTimeAtResumeRef.current = useSessionStore.getState().elapsedTime;

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        const now = Date.now();
        // Calculate seconds passed since resume
        const deltaSeconds = Math.floor(
          (now - lastResumeTimeRef.current) / 1000
        );
        // Update store with total elapsed time
        updateElapsedTime(elapsedTimeAtResumeRef.current + deltaSeconds);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleLocationUpdate = useCallback(
    location => {
      if (isPaused) return;

      setCurrentLocation(location);

      const newPoint = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        speed: location.speed,
      };

      addRoutePoint(newPoint);

      // Calculate distance from previous point
      const points = useSessionStore.getState().routePoints;
      if (points.length >= 2) {
        const totalDistance = locationService.calculateTotalDistance([
          ...points,
          newPoint,
        ]);
        updateDistance(totalDistance);

        // Calculate current pace using smoothed average
        const smoothedPace = locationService.getSmoothedPace([
          ...points,
          newPoint,
        ]);
        updatePace(smoothedPace);
      }
    },
    [isPaused]
  );

  const updateZombiePosition = () => {
    if (!currentSession) return;

    const state = useSessionStore.getState();
    const { zombiePace } = currentSession;
    const elapsed = state.elapsedTime;

    // Calculate zombie distance using zombie service
    const zombieDistanceCovered = zombieService.calculateZombieDistance(
      elapsed,
      zombiePace
    );
    updateZombieDistance(zombieDistanceCovered);

    // Calculate gap (positive = user ahead)
    const gap = zombieService.calculateGap(
      state.distanceRun,
      zombieDistanceCovered
    );
    updateZombieGap(gap);

    // Calculate zombie's position on the route
    if (state.routePoints.length > 1) {
      const zombiePos = zombieService.getZombiePositionOnRoute(
        state.routePoints,
        zombieDistanceCovered
      );
      if (zombiePos) {
        setZombieLocation(zombiePos);
      }
    }

    // Get zombie status and handle warnings
    const status = zombieService.getZombieStatus(gap);
    updateZombieStatus(status.status);

    // Trigger haptic feedback when warning level increases
    if (status.level > lastWarningLevelRef.current) {
      zombieService.triggerHapticFeedback(status);
    }
    lastWarningLevelRef.current = status.level;

    // Check if zombie caught the user
    const wasCaught = state.isCaught;
    if (gap <= ZOMBIE_CONSTANTS.CATCH_DISTANCE) {
      if (!wasCaught) {
        // New catch event!
        setIsCaught(true);
        addCatchEvent({
          timestamp: Date.now(),
          distance: state.distanceRun,
          elapsedTime: elapsed,
        });
        // Strong vibration for catch
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        Alert.alert(
          '🧟 CAUGHT!',
          "The zombie caught you! It's eating your distance! Run faster to escape!",
          [{ text: 'RUN!', style: 'destructive' }]
        );
      }
    } else if (wasCaught && gap > ZOMBIE_CONSTANTS.CATCH_DISTANCE + 5) {
      // Escaped! Need to be 5m+ ahead to escape
      setIsCaught(false);
      Vibration.vibrate([0, 100, 50, 100]);
    }
  };

  // Get position at a specific distance along the route
  const getPositionAtDistance = (points, targetDistance) => {
    if (points.length < 2) return points[0] || null;

    let accumulatedDistance = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const segmentDistance = calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );

      if (accumulatedDistance + segmentDistance >= targetDistance) {
        // Interpolate position within this segment
        const remainingDistance = targetDistance - accumulatedDistance;
        const ratio = remainingDistance / segmentDistance;

        return {
          latitude: prev.latitude + (curr.latitude - prev.latitude) * ratio,
          longitude: prev.longitude + (curr.longitude - prev.longitude) * ratio,
        };
      }

      accumulatedDistance += segmentDistance;
    }

    // If target distance exceeds route, return last point
    return points[points.length - 1];
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  const handleStopRun = () => {
    Alert.alert('End Run', 'Are you sure you want to end this run?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Run',
        style: 'destructive',
        onPress: async () => {
          stopTracking();
          stopTimer();

          // Save session to Firestore
          const state = useSessionStore.getState();
          try {
            await sessionService.completeSession(
              {
                distanceRun: state.distanceRun,
                effectiveDistance: Math.max(
                  0,
                  state.distanceRun - state.totalDistanceEaten
                ),
                totalDistanceEaten: state.totalDistanceEaten,
                elapsedTime: state.elapsedTime,
                averagePace: state.currentPace,
                catchCount: state.catchCount,
                catchEvents: state.catchEvents,
                distanceGoal: state.currentSession?.distanceGoal || 0,
              },
              state.routePoints
            );
          } catch (error) {
            console.error('Failed to save session:', error);
          }

          stopSession();
          // Navigate back to home
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeMain' }],
          });
        },
      },
    ]);
  };

  const getZombieStatusDisplay = () => {
    if (isCaught) {
      return { text: 'CAUGHT!', color: theme.colors.zombie, emoji: '🧟' };
    } else if (zombieGap > 100) {
      return { text: 'Safe', color: theme.colors.success, emoji: '😌' };
    } else if (zombieGap > 50) {
      return { text: 'Warning', color: theme.colors.warning, emoji: '😰' };
    } else if (zombieGap > 10) {
      return { text: 'Danger!', color: theme.colors.error, emoji: '😱' };
    } else {
      return { text: 'DANGER!', color: theme.colors.error, emoji: '😱' };
    }
  };

  const zombieStatus = getZombieStatusDisplay();
  const effectiveDistance = Math.max(0, distanceRun - totalDistanceEaten);
  const progress = currentSession
    ? Math.min((effectiveDistance / currentSession.distanceGoal) * 100, 100)
    : 0;

  // Render expanded map view
  if (isMapExpanded) {
    return (
      <SafeAreaView style={styles.containerExpanded}>
        <RunMap
          routePoints={routePoints}
          currentLocation={currentLocation}
          zombieLocation={zombieLocation}
          zombieDistance={zombieDistance}
          showZombie={true}
          followUser={true}
          style={styles.expandedMap}
        />

        {/* Floating Stats */}
        <View style={styles.floatingStats}>
          <View style={styles.floatingStat}>
            <Text style={styles.floatingValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.floatingLabel}>Time</Text>
          </View>
          <View style={styles.floatingStat}>
            <Text style={styles.floatingValue}>
              {formatDistance(distanceRun)}
            </Text>
            <Text style={styles.floatingLabel}>Distance</Text>
          </View>
          <View style={styles.floatingStat}>
            <Text style={styles.floatingValue}>{formatPace(currentPace)}</Text>
            <Text style={styles.floatingLabel}>Pace</Text>
          </View>
        </View>

        {/* Collapse Button */}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setIsMapExpanded(false)}
        >
          <Ionicons name="contract" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Control Buttons */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[
              styles.floatingControlBtn,
              isPaused && styles.floatingControlBtnActive,
            ]}
            onPress={handlePauseResume}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={28}
              color={isPaused ? '#FFF' : theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingControlBtn, styles.floatingStopBtn]}
            onPress={handleStopRun}
          >
            <Ionicons name="stop" size={28} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with time */}
      <View style={styles.header}>
        <Text style={styles.timeLabel}>Time</Text>
        <Text style={styles.time}>{formatTime(elapsedTime)}</Text>
        {isPaused && <Text style={styles.pausedBadge}>PAUSED</Text>}
      </View>

      {/* Map Preview */}
      <TouchableOpacity
        style={styles.mapPreview}
        onPress={() => setIsMapExpanded(true)}
        activeOpacity={0.9}
      >
        <RunMap
          routePoints={routePoints}
          currentLocation={currentLocation}
          zombieLocation={zombieLocation}
          zombieDistance={zombieDistance}
          showZombie={true}
          followUser={true}
        />
        <View style={styles.mapExpandHint}>
          <Ionicons name="expand" size={16} color="#FFF" />
          <Text style={styles.mapExpandText}>Tap to expand</Text>
        </View>
      </TouchableOpacity>

      {/* Main Stats */}
      <View style={styles.mainStats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {formatDistance(effectiveDistance)}
          </Text>
          <Text style={styles.statLabel}>Effective Distance</Text>
          {totalDistanceEaten > 0 && (
            <Text style={styles.eatenText}>
              -{formatDistance(totalDistanceEaten)} eaten
            </Text>
          )}
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatPace(currentPace)}</Text>
          <Text style={styles.statLabel}>Pace (min/km)</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress.toFixed(0)}% of{' '}
          {formatDistance(currentSession?.distanceGoal || 0)}
        </Text>
      </View>

      {/* Zombie Status */}
      <View
        style={[
          styles.zombieStatusBar,
          {
            backgroundColor: zombieStatus.color + '20',
            borderColor: zombieStatus.color,
          },
          isCaught && styles.caughtStatusBar,
        ]}
      >
        <Text style={styles.zombieEmoji}>{zombieStatus.emoji}</Text>
        <View style={styles.zombieStatusInfo}>
          <Text
            style={[styles.zombieStatusText, { color: zombieStatus.color }]}
          >
            {zombieStatus.text}
          </Text>
          <Text style={styles.zombieDistanceText}>
            {zombieGap > 0
              ? `+${Math.round(zombieGap)}m ahead`
              : `${Math.abs(Math.round(zombieGap))}m behind`}
          </Text>
          {catchCount > 0 && (
            <Text style={styles.catchCountText}>
              Caught {catchCount} time{catchCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {isCaught && (
          <View style={styles.eatingIndicator}>
            <Text style={styles.eatingText}>EATING!</Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <Button
          title={isPaused ? 'Resume' : 'Pause'}
          onPress={handlePauseResume}
          variant={isPaused ? 'primary' : 'outline'}
          style={styles.controlButton}
        />
        <Button
          title="Stop"
          onPress={handleStopRun}
          variant="outline"
          style={[styles.controlButton, styles.stopButton]}
        />
      </View>

      {/* GPS Status */}
      <View style={styles.gpsStatus}>
        <View
          style={[
            styles.gpsIndicator,
            {
              backgroundColor: isTracking
                ? theme.colors.success
                : theme.colors.error,
            },
          ]}
        />
        <Text style={styles.gpsText}>
          {isTracking ? 'GPS Active' : 'GPS Inactive'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  pausedBadge: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    fontWeight: 'bold',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  zombieCard: {
    borderWidth: 2,
    marginBottom: theme.spacing.xl,
  },
  zombieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  zombieEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.sm,
  },
  zombieStatusText: {
    ...theme.typography.h2,
    fontWeight: 'bold',
  },
  zombieStats: {
    alignItems: 'center',
  },
  zombieStat: {
    alignItems: 'center',
  },
  zombieStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  zombieStatValue: {
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  controlButton: {
    flex: 1,
  },
  stopButton: {
    borderColor: theme.colors.error,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  gpsText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  // Map styles
  mapPreview: {
    height: 180,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  mapExpandHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  mapExpandText: {
    ...theme.typography.caption,
    color: '#FFF',
    marginLeft: 4,
  },
  // Expanded map styles
  containerExpanded: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  expandedMap: {
    flex: 1,
  },
  floatingStats: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    ...theme.shadows.medium,
  },
  floatingStat: {
    alignItems: 'center',
  },
  floatingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  floatingLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  collapseButton: {
    position: 'absolute',
    top: 60,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  floatingControlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  floatingControlBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  floatingStopBtn: {
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  // Zombie status bar
  zombieStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  zombieStatusInfo: {
    flex: 1,
  },
  zombieDistanceText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  catchCountText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: 2,
  },
  caughtStatusBar: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  eatingIndicator: {
    backgroundColor: theme.colors.zombie,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  eatingText: {
    ...theme.typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
  },
  eatenText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: 2,
  },
});

export default ActiveRunScreen;
