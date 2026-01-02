import * as Location from 'expo-location';

// Haversine formula to calculate distance between two GPS coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Calculate pace in min/km from speed in m/s
export const calculatePace = (speedMs) => {
  if (!speedMs || speedMs <= 0) return 0;
  // Convert m/s to min/km
  // 1 km = 1000m, 1 min = 60s
  // pace (min/km) = 1000 / (speed * 60) = 16.667 / speed
  return 16.6667 / speedMs;
};

// Format pace as MM:SS
export const formatPace = (paceMinPerKm) => {
  if (!paceMinPerKm || paceMinPerKm <= 0 || paceMinPerKm > 30) return '--:--';
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format distance in km or m
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

// Format time as HH:MM:SS or MM:SS
export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Location service class
class LocationService {
  constructor() {
    this.locationSubscription = null;
    this.isTracking = false;
  }

  // Request location permissions
  async requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return { granted: false, error: 'Foreground location permission denied' };
      }

      // Request background permission for tracking while app is minimized
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        granted: true,
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  // Check if location permissions are granted
  async checkPermissions() {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return { foreground: false, background: false };
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  // Start tracking location
  async startTracking(onLocationUpdate, options = {}) {
    if (this.isTracking) {
      console.warn('Location tracking already started');
      return;
    }

    const defaultOptions = {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000, // Update every 1 second
      distanceInterval: 5, // Update every 5 meters
      ...options,
    };

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        defaultOptions,
        (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed || 0,
            timestamp: location.timestamp,
          };
          
          // Filter out inaccurate readings
          if (locationData.accuracy <= 20) {
            onLocationUpdate(locationData);
          }
        }
      );
      
      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  // Stop tracking location
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  // Calculate total distance from route points
  calculateTotalDistance(routePoints) {
    if (routePoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      totalDistance += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }
    
    return totalDistance;
  }

  // Calculate average pace from route points
  calculateAveragePace(routePoints) {
    if (routePoints.length < 2) return 0;
    
    const totalDistance = this.calculateTotalDistance(routePoints);
    const firstPoint = routePoints[0];
    const lastPoint = routePoints[routePoints.length - 1];
    const totalTimeSeconds = (lastPoint.timestamp - firstPoint.timestamp) / 1000;
    
    if (totalTimeSeconds <= 0 || totalDistance <= 0) return 0;
    
    // Average speed in m/s
    const avgSpeed = totalDistance / totalTimeSeconds;
    return calculatePace(avgSpeed);
  }

  // Get smoothed current pace using moving average
  getSmoothedPace(routePoints, windowSize = 5) {
    if (routePoints.length < windowSize + 1) {
      return this.calculateAveragePace(routePoints);
    }
    
    const recentPoints = routePoints.slice(-windowSize - 1);
    return this.calculateAveragePace(recentPoints);
  }
}

export const locationService = new LocationService();
export default locationService;
