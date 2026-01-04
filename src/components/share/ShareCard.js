import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../../theme';
import {
    formatDistance,
    formatTime,
    formatPace,
} from '../../services/location.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = SCREEN_WIDTH * 1.5; // Taller ratio for share image

// Clean map style - hide ALL text labels for a minimal look
const cleanMapStyle = [
    {
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#3a3a3a' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#1a2634' }],
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#2d2d2d' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#1e3d1e' }],
    },
];

const ShareCard = forwardRef(({ session, routePoints = [] }, ref) => {
    // Calculate bounds to fit route with proper padding
    const getRegion = () => {
        if (!routePoints || routePoints.length === 0) {
            return {
                latitude: 12.9716,
                longitude: 77.5946,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        const lats = routePoints.map(p => p.latitude);
        const lngs = routePoints.map(p => p.longitude);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Calculate deltas with extra padding (2x) to ensure trail fits nicely
        const latSpan = maxLat - minLat;
        const lngSpan = maxLng - minLng;

        // Use the larger span and add generous padding (2.5x)
        const maxSpan = Math.max(latSpan, lngSpan);
        const paddedDelta = maxSpan * 2.5 || 0.01;

        // Ensure minimum zoom level for short routes
        const finalDelta = Math.max(paddedDelta, 0.008);

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: finalDelta,
            longitudeDelta: finalDelta,
        };
    };

    const routeCoordinates = (routePoints || []).map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
    }));

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <View ref={ref} style={styles.container} collapsable={false}>
            {/* Map Section - Takes upper portion */}
            <View style={styles.mapSection}>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={getRegion()}
                    customMapStyle={cleanMapStyle}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    showsScale={false}
                    showsBuildings={false}
                    showsTraffic={false}
                    showsIndoors={false}
                    mapType="standard"
                >
                    {routeCoordinates.length > 1 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeColor={theme.colors.primary}
                            strokeWidth={5}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}
                </MapView>
            </View>

            {/* Stats Section - Bottom portion */}
            <View style={styles.statsSection}>
                {/* Main Stats Row */}
                <View style={styles.mainStatsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {formatDistance(session?.effectiveDistance || 0)}
                        </Text>
                        <Text style={styles.statLabel}>DISTANCE</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {formatTime(session?.elapsedTime || 0)}
                        </Text>
                        <Text style={styles.statLabel}>TIME</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {formatPace(session?.averagePace || 0)}
                        </Text>
                        <Text style={styles.statLabel}>PACE</Text>
                    </View>
                </View>

                {/* Zombie Stats Row */}
                {(session?.catchCount > 0 || session?.totalDistanceEaten > 0) && (
                    <View style={styles.zombieRow}>
                        <Text style={styles.zombieText}>
                            🧟 Caught {session?.catchCount || 0}x • {formatDistance(session?.totalDistanceEaten || 0)} eaten
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.dateText}>{formatDate(session?.startedAt)}</Text>
                    <Text style={styles.brandText}>🏃 Runbie</Text>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#1A1A1A',
    },
    mapSection: {
        flex: 1,
        backgroundColor: '#2d2d2d',
    },
    map: {
        flex: 1,
    },
    statsSection: {
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    mainStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 1,
    },
    zombieRow: {
        marginBottom: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 77, 77, 0.15)',
        borderRadius: 20,
        alignSelf: 'center',
    },
    zombieText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    dateText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
    },
    brandText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ShareCard;
