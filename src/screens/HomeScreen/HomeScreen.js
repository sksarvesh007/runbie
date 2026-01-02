import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Runbie! 🏃‍♂️🧟</Text>
        <Text style={styles.subtitle}>Run from zombies, track your progress</Text>
        
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <Text style={styles.cardText}>Total Runs: 0</Text>
          <Text style={styles.cardText}>Total Distance: 0 km</Text>
          <Text style={styles.cardText}>Sessions Remaining: 5</Text>
        </Card>

        <Button 
          title="Start New Run" 
          onPress={() => navigation.navigate('RunSetup')}
          style={styles.button}
        />

        <Text style={styles.phaseNote}>
          ✅ Phase 1: Project Setup Complete{'\n'}
          ✅ Phase 2: Authentication Complete{'\n'}
          ✅ Phase 3: GPS Tracking Complete{'\n'}
          ✅ Phase 4: Map Integration Complete{'\n'}
          ✅ Phase 5: Zombie Chase Mechanics Complete
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
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  cardText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
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
