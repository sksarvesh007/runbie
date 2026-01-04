import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { sessionService } from '../../services/session.service';
import { formatDistance, formatTime, formatPace } from '../../services/location.service';

const SessionHistoryScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const result = await sessionService.getSessionHistory(20, refresh ? null : null);
      setSessions(result.sessions);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMoreSessions = async () => {
    if (!hasMore || isLoading) return;

    try {
      const result = await sessionService.getSessionHistory(20, lastDoc);
      setSessions(prev => [...prev, ...result.sessions]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more sessions:', error);
    }
  };

  const onRefresh = useCallback(() => {
    loadSessions(true);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'abandoned': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
      activeOpacity={0.7}
    >
      <Card style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionDate}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>{formatDate(item.startedAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === 'completed' ? '✓ Completed' : '✗ Abandoned'}
            </Text>
          </View>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDistance(item.effectiveDistance || 0)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(item.elapsedTime || 0)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(item.averagePace || 0)}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
        </View>

        {item.catchCount > 0 && (
          <View style={styles.zombieInfo}>
            <Text style={styles.zombieText}>
              🧟 Caught {item.catchCount} time{item.catchCount > 1 ? 's' : ''}
            </Text>
            {item.totalDistanceEaten > 0 && (
              <Text style={styles.eatenText}>
                -{formatDistance(item.totalDistanceEaten)} eaten
              </Text>
            )}
          </View>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(item.completionPercentage || 0, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {(item.completionPercentage || 0).toFixed(0)}% of goal
          </Text>
        </View>

        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="fitness-outline" size={64} color={theme.colors.gray300} />
      <Text style={styles.emptyTitle}>No Runs Yet</Text>
      <Text style={styles.emptyText}>
        Start your first run to see your history here!
      </Text>
    </View>
  );

  if (isLoading && sessions.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreSessions}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          <Text style={styles.headerTitle}>Run History</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  sessionCard: {
    marginBottom: theme.spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  zombieInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.zombie + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  zombieText: {
    ...theme.typography.caption,
    color: theme.colors.zombie,
  },
  eatenText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
  progressContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  viewDetailsText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});

export default SessionHistoryScreen;
