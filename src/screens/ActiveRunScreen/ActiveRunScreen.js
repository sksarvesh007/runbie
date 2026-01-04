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
import { theme as defaultTheme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
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
  const zombieStartDistanceRef = useRef(null);

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
      // Check effective distance before eating
      const state = useSessionStore.getState();
      const effectiveDistance = Math.max(
        0,
        state.distanceRun - state.totalDistanceEaten
      );

      if (effectiveDistance > 0) {
        addEatenDistance(ZOMBIE_CONSTANTS.DISTANCE_EATEN_PER_SECOND);
      }
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

    // Handle Zombie Start Delay
    if (elapsed < ZOMBIE_CONSTANTS.ZOMBIE_START_DELAY) {
      updateZombieDistance(0);
      updateZombieGap(0); // Show 0m gap during start delay
      setZombieLocation(null);
      updateZombieStatus('safe');
      return;
    }

    // Set drop distance if not set
    if (zombieStartDistanceRef.current === null) {
      zombieStartDistanceRef.current = state.distanceRun;
    }

    // Calculate zombie distance using zombie service
    let zombieDistanceCovered = zombieService.calculateZombieDistance(
      elapsed,
      zombiePace,
      zombieStartDistanceRef.current
    );

    // CLAMP: Zombie cannot pass the user
    // If calculated distance > user distance, clamp it to user distance
    if (zombieDistanceCovered > state.distanceRun) {
      zombieDistanceCovered = state.distanceRun;
    }

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

    // Trigger haptic feedback when warning level increases (Only if moving)
    if (state.distanceRun > 0 && status.level > lastWarningLevelRef.current) {
      zombieService.triggerHapticFeedback(status);
    }
    lastWarningLevelRef.current = status.level;

    // Check if zombie caught the user
    const wasCaught = state.isCaught;
    if (gap <= ZOMBIE_CONSTANTS.CATCH_DISTANCE) {
      // ONLY trigger penalties if user has moved
      if (state.distanceRun > 0) {
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
      } else {
        // Silent catch (no penalty)
        // ensure we don't think we are caught in terms of state if we want to avoid "EATING" text
        // But the zombie is effectively there.
        // User asked: "dont do anything".
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
          showOverlay={false}
        />

        {/* Zombie Start Countdown Overlay */}
        {elapsedTime < ZOMBIE_CONSTANTS.ZOMBIE_START_DELAY && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Zombie approaching in</Text>
            <Text style={styles.countdownValue}>
              {Math.max(0, ZOMBIE_CONSTANTS.ZOMBIE_START_DELAY - elapsedTime)}s
            </Text>
          </View>
        )}

        {/* Collapse Button - Moved to Top Left */}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setIsMapExpanded(false)}
        >
          <Ionicons name="contract" size={24} color={defaultTheme.colors.primary} />
        </TouchableOpacity>

        {/* Bottom Overlay Container */}
        <View style={styles.bottomOverlay}>
          {/* Stats Panel */}
          <View
            style={[
              styles.expandedStatsPanel,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Time Header */}
            <View
              style={[
                styles.expandedTimeContainer,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={styles.expandedTimeLabel}>TIME</Text>
              <Text style={[styles.expandedTime, { color: theme.colors.text }]}>
                {formatTime(elapsedTime)}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.expandedStatsGrid}>
              <View style={styles.expandedStatItem}>
                <Text
                  style={[
                    styles.expandedStatValue,
                    { color: zombieStatus.color },
                  ]}
                >
                  {zombieGap > 0
                    ? `+${Math.round(zombieGap)}m`
                    : `${Math.round(zombieGap)}m`}
                </Text>
                <Text style={styles.expandedStatLabel}>Gap</Text>
              </View>

              <View style={styles.expandedStatItem}>
                <Text
                  style={[
                    styles.expandedStatValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {formatPace(currentPace)}
                </Text>
                <Text style={styles.expandedStatLabel}>Pace</Text>
              </View>

              <View style={styles.expandedStatItem}>
                <Text
                  style={[
                    styles.expandedStatValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {formatDistance(distanceRun)}
                </Text>
                <Text style={styles.expandedStatLabel}>Distance</Text>
              </View>
            </View>
          </View>

          {/* Controls Below Panel */}
          <View style={styles.expandedControls}>
            <TouchableOpacity
              style={[
                styles.expandedControlBtn,
                isPaused && styles.expandedControlBtnActive,
            <TouchableOpacity
              style={[
                styles.expandedControlBtn,
                isPaused && styles.expandedControlBtnActive,
                { borderColor: defaultTheme.colors.primary, borderWidth: 1 }
              ]}
              onPress={handlePauseResume}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={32}
                color={defaultTheme.colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.expandedControlBtn, styles.expandedStopBtn]}
              onPress={handleStopRun}
            >
              <Ionicons name="stop" size={32} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with time */}
      {/* Header with time and Zombie Status - Layout Change */}
      <View style={styles.headerRow}>
        <View style={styles.headerTimeContainer}>
          <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Time</Text>
          <Text style={[styles.time, { color: theme.colors.text }]}>{formatTime(elapsedTime)}</Text>
        </View>

        {/* Header Right: Zombie Countdown (Side of Time) */}
        <View style={styles.headerRightContainer}>
          {elapsedTime < ZOMBIE_CONSTANTS.ZOMBIE_START_DELAY && (
            <View style={styles.headerCountdown}>
              <Text style={[styles.countdownLabel, { color: theme.colors.textSecondary }]}>Zombie approaching in</Text>
              <Text style={[styles.countdownValue, { color: theme.colors.primary }]}>
                {Math.max(0, ZOMBIE_CONSTANTS.ZOMBIE_START_DELAY - elapsedTime)}s
              </Text>
            </View>
          )}
        </View>
      </View>

      {isPaused && <View style={styles.pausedContainer}><Text style={styles.pausedBadge}>PAUSED</Text></View>}

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
      {/* Main Stats Grid */}
      <View style={styles.mainStatsGrid}>
        {/* Row 1 */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {formatDistance(effectiveDistance)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Effective Dist</Text>
            {totalDistanceEaten > 0 && (
              <Text style={styles.eatenText}>-{formatDistance(totalDistanceEaten)}</Text>
            )}
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatDistance(distanceRun)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Raw Dist</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatPace(currentPace)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pace</Text>
          </View>

          {/* Zombie Status Box */}
          <View style={styles.statBox}>
            <View style={[styles.statusBadge, { backgroundColor: zombieStatus.color + '20', borderColor: zombieStatus.color }]}>
              <Text style={styles.statusEmoji}>{zombieStatus.emoji}</Text>
              <Text style={[styles.statusText, { color: zombieStatus.color }]}>{zombieStatus.text}</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {zombieGap > 0 ? `+${Math.round(zombieGap)}m` : `${Math.round(zombieGap)}m`}
            </Text>
          </View>
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
      {/* Zombie Status - Removed from bottom as it's now in top bar */}
      {/* 
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
      */}

      {/* Control Buttons */}
      <View style={styles.controls}>
        <Button
          title={isPaused ? 'Resume' : 'Pause'}
          onPress={handlePauseResume}
          variant={'outline'} // Always outline to show orange border/text
          style={[styles.controlButton, { borderColor: defaultTheme.colors.primary }]}
          textStyle={{ color: defaultTheme.colors.primary }}
        />
        <Button
          title="Stop"
          onPress={handleStopRun}
          variant="outline"
          style={[styles.controlButton, styles.stopButton]}
          textStyle={{ color: defaultTheme.colors.error }}
        />
      </View>

      {/* GPS Status */}
      <View style={styles.gpsStatus}>
        <View
          style={[
            styles.gpsIndicator,
            {
              backgroundColor: isTracking
                ? defaultTheme.colors.success
                : defaultTheme.colors.error,
            },
          ]}
        />
        <Text style={[styles.gpsText, { color: theme.colors.textSecondary }]}>
          {isTracking ? 'GPS Active' : 'GPS Inactive'}
        </Text>
      </View>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: defaultTheme.colors.background, // Handled via style prop or wrapper
    padding: defaultTheme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: defaultTheme.spacing.md,
    marginTop: defaultTheme.spacing.lg,
  },
  headerTimeContainer: {
    alignItems: 'flex-start',
  },
  headerRightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 60,
  },
  headerCountdown: {
    alignItems: 'flex-end',
  },
  countdownLabel: {
    ...defaultTheme.typography.caption,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pausedContainer: {
    alignItems: 'center',
    marginBottom: defaultTheme.spacing.lg,
  },
  timeLabel: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
    marginBottom: defaultTheme.spacing.xs,
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    color: defaultTheme.colors.text, // Overridden inline
  },
  pausedBadge: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.warning,
    backgroundColor: defaultTheme.colors.warning + '20',
    paddingHorizontal: defaultTheme.spacing.md,
    paddingVertical: defaultTheme.spacing.xs,
    borderRadius: defaultTheme.borderRadius.sm,
    marginTop: defaultTheme.spacing.sm,
    fontWeight: 'bold',
  },
  mainStats: {
    // Deprecated, use mainStatsGrid
  },
  mainStatsGrid: {
    marginBottom: defaultTheme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 2,
  },
  statusEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    // color: defaultTheme.colors.primary, // Inline
  },
  statLabel: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
    marginTop: defaultTheme.spacing.xs,
  },
  progressContainer: {
    marginBottom: defaultTheme.spacing.xl,
  },
  progressBar: {
    height: 12,
    backgroundColor: defaultTheme.colors.gray200,
    borderRadius: defaultTheme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: defaultTheme.colors.primary,
    borderRadius: defaultTheme.borderRadius.sm,
  },
  progressText: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: defaultTheme.spacing.sm,
  },
  zombieCard: {
    borderWidth: 2,
    marginBottom: defaultTheme.spacing.xl,
  },
  zombieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: defaultTheme.spacing.md,
  },
  zombieEmoji: {
    fontSize: 32,
    marginRight: defaultTheme.spacing.sm,
  },
  zombieStatusText: {
    ...defaultTheme.typography.h2,
    fontWeight: 'bold',
  },
  zombieStats: {
    alignItems: 'center',
  },
  zombieStat: {
    alignItems: 'center',
  },
  zombieStatLabel: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
  },
  zombieStatValue: {
    ...defaultTheme.typography.h3,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: defaultTheme.spacing.md,
    marginBottom: defaultTheme.spacing.lg,
  },
  controlButton: {
    flex: 1,
  },
  stopButton: {
    borderColor: defaultTheme.colors.error,
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
    marginRight: defaultTheme.spacing.xs,
  },
  gpsText: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
  },
  // Map styles
  mapPreview: {
    height: 180,
    borderRadius: defaultTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: defaultTheme.spacing.lg,
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
    borderRadius: defaultTheme.borderRadius.sm,
  },
  mapExpandText: {
    ...defaultTheme.typography.caption,
    color: '#FFF',
    marginLeft: 4,
  },
  // Expanded map styles
  containerExpanded: {
    flex: 1,
    backgroundColor: defaultTheme.colors.background,
  },
  expandedMap: {
    flex: 1,
  },
  collapseButton: {
    position: 'absolute',
    top: 60,
    left: 20, // Moved to left
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...defaultTheme.shadows.medium,
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  expandedStatsPanel: {
    // backgroundColor: '#1A1A1A', // Removed static color, will use inline style
    borderRadius: 24,
    padding: 16, // Reduced padding
    marginBottom: 16, // Reduced margin
    ...defaultTheme.shadows.lg,
  },
  expandedTimeContainer: {
    alignItems: 'center',
    marginBottom: 16, // Reduced margin
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12, // Reduced padding
  },
  expandedTimeLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  expandedTime: {
    color: '#FFF',
    fontSize: 48, // Reduced font size slightly
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  expandedStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  expandedStatValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expandedStatLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  expandedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  expandedControlBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...defaultTheme.shadows.lg,
  },
  expandedControlBtnActive: {
    backgroundColor: defaultTheme.colors.primary,
  },
  expandedStopBtn: {
    borderWidth: 2,
    borderColor: defaultTheme.colors.error,
  },

  floatingControlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...defaultTheme.shadows.large,
  },
  floatingControlBtnActive: {
    backgroundColor: defaultTheme.colors.primary,
  },
  floatingStopBtn: {
    borderWidth: 2,
    borderColor: defaultTheme.colors.error,
  },
  // Zombie status bar
  zombieStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: defaultTheme.spacing.md,
    borderRadius: defaultTheme.borderRadius.md,
    borderWidth: 1,
    marginBottom: defaultTheme.spacing.lg,
  },
  zombieStatusInfo: {
    flex: 1,
  },
  zombieDistanceText: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.textSecondary,
  },
  catchCountText: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.error,
    marginTop: 2,
  },
  caughtStatusBar: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  eatingIndicator: {
    backgroundColor: defaultTheme.colors.zombie,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: defaultTheme.borderRadius.sm,
  },
  eatingText: {
    ...defaultTheme.typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
  },
  eatenText: {
    ...defaultTheme.typography.caption,
    color: defaultTheme.colors.error,
    marginTop: 2,
  },
  countdownContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  countdownLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownValue: {
    color: defaultTheme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ActiveRunScreen;
