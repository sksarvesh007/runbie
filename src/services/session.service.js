import { db, auth } from '../config/firebase.config';

// Session document structure
const createSessionDocument = sessionData => ({
  sessionId: sessionData.sessionId || null,
  oderId: sessionData.userId || auth.currentUser?.uid || null,
  userId: sessionData.userId || auth.currentUser?.uid || null,
  status: sessionData.status || 'active', // active, paused, completed, abandoned

  // Run settings
  distanceGoal: sessionData.distanceGoal || 0,
  paceMin: sessionData.paceMin || 0,
  paceMax: sessionData.paceMax || 0,
  zombiePace: sessionData.zombiePace || 0,

  // Run stats
  distanceRun: sessionData.distanceRun || 0,
  effectiveDistance: sessionData.effectiveDistance || 0,
  totalDistanceEaten: sessionData.totalDistanceEaten || 0,
  elapsedTime: sessionData.elapsedTime || 0,
  averagePace: sessionData.averagePace || 0,
  maxPace: sessionData.maxPace || 0,
  minPace: sessionData.minPace || 0,

  // Zombie stats
  catchCount: sessionData.catchCount || 0,
  catchEvents: sessionData.catchEvents || [],
  zombieDistance: sessionData.zombieDistance || 0,

  // Route data (stored separately for large routes)
  routePointsCount: sessionData.routePointsCount || 0,
  startLocation: sessionData.startLocation || null,
  endLocation: sessionData.endLocation || null,

  // Timestamps
  startedAt: sessionData.startedAt || new Date(),
  completedAt: sessionData.completedAt || null,
  lastUpdatedAt: new Date(),

  // Completion info
  completionPercentage: sessionData.completionPercentage || 0,
  wasCompleted: sessionData.wasCompleted || false,
});

class SessionService {
  constructor() {
    this.currentSessionId = null;
    this.lastSaveTime = 0;
    this.saveInterval = 30000; // Save every 30 seconds
  }

  // Generate unique session ID
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${randomStr}`;
  }

  // Start a new session
  async startSession(sessionData) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const sessionId = this.generateSessionId();
      this.currentSessionId = sessionId;

      const sessionDoc = createSessionDocument({
        ...sessionData,
        sessionId,
        userId,
        status: 'active',
        startedAt: new Date(),
      });

      await db.collection('sessions').doc(sessionId).set(sessionDoc);

      console.log('Session started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  // Update session (called periodically during run)
  async updateSession(sessionData) {
    try {
      if (!this.currentSessionId) {
        console.warn('No active session to update');
        return;
      }

      // Throttle updates to every 30 seconds
      const now = Date.now();
      if (now - this.lastSaveTime < this.saveInterval) {
        return;
      }
      this.lastSaveTime = now;

      const updateData = {
        distanceRun: sessionData.distanceRun || 0,
        effectiveDistance: sessionData.effectiveDistance || 0,
        totalDistanceEaten: sessionData.totalDistanceEaten || 0,
        elapsedTime: sessionData.elapsedTime || 0,
        currentPace: sessionData.currentPace || 0,
        catchCount: sessionData.catchCount || 0,
        routePointsCount: sessionData.routePointsCount || 0,
        status: sessionData.isPaused ? 'paused' : 'active',
        lastUpdatedAt: new Date(),
      };

      await db
        .collection('sessions')
        .doc(this.currentSessionId)
        .update(updateData);
      console.log('Session updated:', this.currentSessionId);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  // Complete session
  async completeSession(sessionData, routePoints = []) {
    try {
      if (!this.currentSessionId) {
        console.warn('No active session to complete');
        return null;
      }

      const completionPercentage =
        sessionData.distanceGoal > 0
          ? Math.min(
              (sessionData.effectiveDistance / sessionData.distanceGoal) * 100,
              100
            )
          : 0;

      const finalData = {
        status: 'completed',
        distanceRun: sessionData.distanceRun || 0,
        effectiveDistance: sessionData.effectiveDistance || 0,
        totalDistanceEaten: sessionData.totalDistanceEaten || 0,
        elapsedTime: sessionData.elapsedTime || 0,
        averagePace: sessionData.averagePace || 0,
        maxPace: sessionData.maxPace || 0,
        minPace: sessionData.minPace || 0,
        catchCount: sessionData.catchCount || 0,
        catchEvents: sessionData.catchEvents || [],
        routePointsCount: routePoints.length,
        startLocation:
          routePoints.length > 0
            ? {
                latitude: routePoints[0].latitude,
                longitude: routePoints[0].longitude,
              }
            : null,
        endLocation:
          routePoints.length > 0
            ? {
                latitude: routePoints[routePoints.length - 1].latitude,
                longitude: routePoints[routePoints.length - 1].longitude,
              }
            : null,
        completedAt: new Date(),
        lastUpdatedAt: new Date(),
        completionPercentage,
        wasCompleted: true,
      };

      await db
        .collection('sessions')
        .doc(this.currentSessionId)
        .update(finalData);

      // Store route points in subcollection if there are many
      if (routePoints.length > 0) {
        await this.saveRoutePoints(this.currentSessionId, routePoints);
      }

      console.log('Session completed:', this.currentSessionId);
      const completedSessionId = this.currentSessionId;
      this.currentSessionId = null;
      this.lastSaveTime = 0;

      return completedSessionId;
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  // Abandon session
  async abandonSession() {
    try {
      if (!this.currentSessionId) {
        return;
      }

      await db.collection('sessions').doc(this.currentSessionId).update({
        status: 'abandoned',
        lastUpdatedAt: new Date(),
      });

      console.log('Session abandoned:', this.currentSessionId);
      this.currentSessionId = null;
      this.lastSaveTime = 0;
    } catch (error) {
      console.error('Failed to abandon session:', error);
    }
  }

  // Save route points to subcollection (chunked for large routes)
  async saveRoutePoints(sessionId, routePoints) {
    try {
      const chunkSize = 100;
      const chunks = [];

      for (let i = 0; i < routePoints.length; i += chunkSize) {
        chunks.push(routePoints.slice(i, i + chunkSize));
      }

      const batch = db.batch();
      chunks.forEach((chunk, index) => {
        const chunkRef = db
          .collection('sessions')
          .doc(sessionId)
          .collection('routeChunks')
          .doc(`chunk_${index}`);
        batch.set(chunkRef, {
          chunkIndex: index,
          points: chunk.map(p => ({
            lat: p.latitude,
            lng: p.longitude,
            ts: p.timestamp,
            spd: p.speed || 0,
          })),
        });
      });

      await batch.commit();
      console.log(
        `Saved ${routePoints.length} route points in ${chunks.length} chunks`
      );
    } catch (error) {
      console.error('Failed to save route points:', error);
    }
  }

  // Get user's session history
  async getSessionHistory(limit = 20, lastDoc = null) {
    try {
      const oderId = auth.currentUser?.uid;
      if (!oderId) {
        throw new Error('User not authenticated');
      }

      // Simple query without orderBy to avoid composite index requirement
      const snapshot = await db
        .collection('sessions')
        .where('oderId', '==', oderId)
        .get();

      const sessions = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter to only completed or abandoned sessions
        if (data.status === 'completed' || data.status === 'abandoned') {
          sessions.push({
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate?.() || data.startedAt,
            completedAt: data.completedAt?.toDate?.() || data.completedAt,
          });
        }
      });

      // Sort client-side by startedAt descending
      sessions.sort((a, b) => {
        const dateA =
          a.startedAt instanceof Date ? a.startedAt : new Date(a.startedAt);
        const dateB =
          b.startedAt instanceof Date ? b.startedAt : new Date(b.startedAt);
        return dateB - dateA;
      });

      // Limit to requested amount
      const limitedSessions = sessions.slice(0, limit);

      return {
        sessions: limitedSessions,
        lastDoc: null,
        hasMore: sessions.length > limit,
      };
    } catch (error) {
      console.error('Failed to get session history:', error);
      throw error;
    }
  }

  // Get single session details
  async getSessionDetails(sessionId) {
    try {
      const doc = await db.collection('sessions').doc(sessionId).get();

      if (!doc.exists) {
        throw new Error('Session not found');
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
      };
    } catch (error) {
      console.error('Failed to get session details:', error);
      throw error;
    }
  }

  // Get route points for a session
  async getRoutePoints(sessionId) {
    try {
      const snapshot = await db
        .collection('sessions')
        .doc(sessionId)
        .collection('routeChunks')
        .orderBy('chunkIndex')
        .get();

      const allPoints = [];
      snapshot.forEach(doc => {
        const chunk = doc.data();
        chunk.points.forEach(p => {
          allPoints.push({
            latitude: p.lat,
            longitude: p.lng,
            timestamp: p.ts,
            speed: p.spd,
          });
        });
      });

      return allPoints;
    } catch (error) {
      console.error('Failed to get route points:', error);
      return [];
    }
  }

  // Check for incomplete session (crash recovery)
  async checkIncompleteSession() {
    try {
      const oderId = auth.currentUser?.uid;
      if (!oderId) {
        return null;
      }

      // Simple query without orderBy to avoid composite index
      const snapshot = await db
        .collection('sessions')
        .where('oderId', '==', oderId)
        .get();

      if (snapshot.empty) {
        return null;
      }

      // Find first active or paused session
      let incompleteSession = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (
          !incompleteSession &&
          (data.status === 'active' || data.status === 'paused')
        ) {
          incompleteSession = {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate?.() || data.startedAt,
          };
        }
      });

      return incompleteSession;
    } catch (error) {
      console.error('Failed to check incomplete session:', error);
      return null;
    }
  }

  // Get user stats summary
  async getUserStats() {
    try {
      const oderId = auth.currentUser?.uid;
      if (!oderId) {
        throw new Error('User not authenticated');
      }

      // Simplified query - filter completed sessions client-side
      const snapshot = await db
        .collection('sessions')
        .where('oderId', '==', oderId)
        .get();

      let totalDistance = 0;
      let totalTime = 0;
      let totalRuns = 0;
      let totalCatches = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        // Only count completed sessions
        if (data.status === 'completed') {
          totalDistance += data.effectiveDistance || 0;
          totalTime += data.elapsedTime || 0;
          totalRuns += 1;
          totalCatches += data.catchCount || 0;
        }
      });

      return {
        totalDistance,
        totalTime,
        totalRuns,
        totalCatches,
        averageDistance: totalRuns > 0 ? totalDistance / totalRuns : 0,
        averageTime: totalRuns > 0 ? totalTime / totalRuns : 0,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalDistance: 0,
        totalTime: 0,
        totalRuns: 0,
        totalCatches: 0,
        averageDistance: 0,
        averageTime: 0,
      };
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;
