import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const RunMap = ({
  routePoints = [],
  currentLocation,
  zombieLocation,
  zombieDistance,
  showZombie = true,
  followUser = true,
  style,
  showOverlay = true,
  onPress,
  controlsContainerStyle,
}) => {
  const mapRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(followUser);

  // Center map on user when location updates
  useEffect(() => {
    if (isFollowing && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [currentLocation, isFollowing]);

  const handleCenterOnUser = () => {
    if (currentLocation && mapRef.current) {
      console.log('RunMap: Centering on user', currentLocation);
      setIsFollowing(true);
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  const handleMapDrag = () => {
    setIsFollowing(false);
  };

  // Calculate zombie position on the route
  const getZombiePosition = () => {
    if (!zombieLocation) return null;
    return zombieLocation;
  };

  // Get initial region
  const getInitialRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return null;
  };

  // Convert route points to coordinates for polyline
  const routeCoordinates = routePoints.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  const zombiePos = getZombiePosition();

  // Determine zombie marker color based on distance
  const getZombieColor = () => {
    if (zombieDistance > 100) return theme.colors.success;
    if (zombieDistance > 50) return theme.colors.warning;
    if (zombieDistance > 10) return theme.colors.error;
    return theme.colors.zombie;
  };

  const initialRegion = getInitialRegion();

  if (!initialRegion) {
    return (
      <View style={[styles.container, style, styles.centerContainer]}>
        <Text>Locating...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPanDrag={handleMapDrag}
        mapType="standard"
        scrollEnabled={!onPress} // Disable scroll if we want tap-to-expand
        zoomEnabled={!onPress}
      >
        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* User Marker (3D) */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            width={60}
            height={60}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require('../../../assets/runner_3d.png')}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Zombie Marker (3D) */}
        {showZombie && zombiePos && (
          <Marker
            coordinate={{
              latitude: zombiePos.latitude,
              longitude: zombiePos.longitude,
            }}
            width={60}
            height={60}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require('../../../assets/zombie_3d.png')}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Start Point Marker */}
        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[0]} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.startMarker}>
              <Ionicons name="flag" size={20} color={theme.colors.success} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Tap Overlay for Expand (if onPress provided) */}
      {onPress && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPress}
        />
      )}

      {/* Map Controls - Only show if not in minimap mode (no onPress) */}
      {!onPress && (
        <View style={[styles.controls, controlsContainerStyle]}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isFollowing && styles.controlButtonActive,
            ]}
            onPress={handleCenterOnUser}
          >
            <Ionicons
              name="locate"
              size={24}
              color={isFollowing ? '#FFFFFF' : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Zombie Distance Overlay */}
      {showZombie && showOverlay && (
        <View
          style={[
            styles.zombieOverlay,
            { backgroundColor: getZombieColor() + '20' },
          ]}
        >
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  zombieMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: 50,
    height: 50,
  },
  zombieEmoji: {
    fontSize: 24,
  },
  startMarker: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
    ...theme.shadows.small,
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 60,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  controlButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  zombieOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  zombieOverlayEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  zombieOverlayText: {
    ...theme.typography.body2,
    fontWeight: 'bold',
  },
});

export default RunMap;
