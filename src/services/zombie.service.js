import { Vibration } from 'react-native';

// Zombie chase mechanics constants
export const ZOMBIE_CONSTANTS = {
  CATCH_DISTANCE: 10, // meters - zombie catches user when within this distance
  WARNING_DISTANCE_DANGER: 30, // meters - danger zone
  WARNING_DISTANCE_CLOSE: 50, // meters - close warning
  WARNING_DISTANCE_FAR: 100, // meters - far warning
  DISTANCE_EATEN_PER_SECOND: 1, // meters eaten per second while caught
  CATCH_COOLDOWN: 5000, // ms - cooldown between catch events
  ZOMBIE_UPDATE_INTERVAL: 1000, // ms - how often zombie position updates
};

class ZombieService {
  constructor() {
    this.lastCatchTime = 0;
    this.isCaught = false;
    this.catchStartTime = 0;
  }

  // Calculate zombie's distance covered based on elapsed time and pace
  calculateZombieDistance(elapsedTimeSeconds, zombiePaceMinPerKm) {
    // zombiePace is in min/km
    // Distance = (time in minutes) / pace * 1000 meters
    const timeInMinutes = elapsedTimeSeconds / 60;
    return (timeInMinutes / zombiePaceMinPerKm) * 1000;
  }

  // Calculate the gap between user and zombie (positive = user ahead)
  calculateGap(userDistance, zombieDistance) {
    return userDistance - zombieDistance;
  }

  // Get zombie status based on gap
  getZombieStatus(gap) {
    if (gap <= ZOMBIE_CONSTANTS.CATCH_DISTANCE) {
      return {
        status: 'caught',
        level: 4,
        message: 'CAUGHT! 🧟',
        color: '#8B0000', // dark red
        vibrationPattern: [0, 500, 200, 500],
      };
    } else if (gap <= ZOMBIE_CONSTANTS.WARNING_DISTANCE_DANGER) {
      return {
        status: 'danger',
        level: 3,
        message: 'DANGER! Run faster!',
        color: '#FF0000', // red
        vibrationPattern: [0, 200, 100, 200],
      };
    } else if (gap <= ZOMBIE_CONSTANTS.WARNING_DISTANCE_CLOSE) {
      return {
        status: 'close',
        level: 2,
        message: 'Zombie is close!',
        color: '#FFA500', // orange
        vibrationPattern: [0, 100],
      };
    } else if (gap <= ZOMBIE_CONSTANTS.WARNING_DISTANCE_FAR) {
      return {
        status: 'warning',
        level: 1,
        message: 'Zombie approaching...',
        color: '#FFD700', // gold
        vibrationPattern: null,
      };
    } else {
      return {
        status: 'safe',
        level: 0,
        message: 'Safe distance',
        color: '#00FF00', // green
        vibrationPattern: null,
      };
    }
  }

  // Check if zombie has caught the user
  checkCatch(gap, currentTime) {
    const wasCaught = this.isCaught;
    
    if (gap <= ZOMBIE_CONSTANTS.CATCH_DISTANCE) {
      if (!this.isCaught) {
        // New catch event
        this.isCaught = true;
        this.catchStartTime = currentTime;
        this.lastCatchTime = currentTime;
        return {
          justCaught: true,
          isCaught: true,
          catchDuration: 0,
        };
      } else {
        // Still caught
        const catchDuration = (currentTime - this.catchStartTime) / 1000;
        return {
          justCaught: false,
          isCaught: true,
          catchDuration,
        };
      }
    } else {
      // Escaped
      if (wasCaught) {
        const catchDuration = (currentTime - this.catchStartTime) / 1000;
        this.isCaught = false;
        return {
          justEscaped: true,
          isCaught: false,
          catchDuration,
        };
      }
      return {
        isCaught: false,
        catchDuration: 0,
      };
    }
  }

  // Calculate distance eaten while caught
  calculateDistanceEaten(catchDurationSeconds) {
    return catchDurationSeconds * ZOMBIE_CONSTANTS.DISTANCE_EATEN_PER_SECOND;
  }

  // Trigger haptic feedback based on zombie status
  triggerHapticFeedback(status) {
    if (status.vibrationPattern) {
      Vibration.vibrate(status.vibrationPattern);
    }
  }

  // Get encouraging message based on situation
  getEncouragingMessage(gap, userPace, zombiePace) {
    if (gap > 100) {
      return "Great pace! Keep it up! 💪";
    } else if (gap > 50) {
      return "Good job! Stay focused! 🏃";
    } else if (gap > 30) {
      return "Pick up the pace! 😰";
    } else if (gap > 10) {
      return "RUN! It's right behind you! 😱";
    } else {
      return "ESCAPE! Sprint now! 🧟‍♂️";
    }
  }

  // Calculate effective distance (total distance - eaten distance)
  calculateEffectiveDistance(totalDistance, eatenDistance) {
    return Math.max(0, totalDistance - eatenDistance);
  }

  // Reset zombie state for new session
  reset() {
    this.isCaught = false;
    this.catchStartTime = 0;
    this.lastCatchTime = 0;
  }

  // Get zombie pace from user's max pace
  calculateZombiePace(userMaxPace) {
    // Zombie is slightly slower than user's slowest pace
    // Adding 0.15 min/km means zombie is slower
    return userMaxPace + 0.15;
  }

  // Interpolate zombie position along route
  getZombiePositionOnRoute(routePoints, zombieDistance) {
    if (!routePoints || routePoints.length < 2) {
      return routePoints?.[0] || null;
    }

    let accumulatedDistance = 0;

    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      
      const segmentDistance = this.haversineDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );

      if (accumulatedDistance + segmentDistance >= zombieDistance) {
        // Interpolate within this segment
        const remainingDistance = zombieDistance - accumulatedDistance;
        const ratio = segmentDistance > 0 ? remainingDistance / segmentDistance : 0;

        return {
          latitude: prev.latitude + (curr.latitude - prev.latitude) * ratio,
          longitude: prev.longitude + (curr.longitude - prev.longitude) * ratio,
        };
      }

      accumulatedDistance += segmentDistance;
    }

    // Zombie hasn't started yet or is at the beginning
    return routePoints[0];
  }

  // Haversine distance calculation
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const zombieService = new ZombieService();
export default zombieService;
