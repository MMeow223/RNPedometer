import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  startStepCounterUpdate,
  stopStepCounterUpdate,
  isStepCountingAvailable,
  addStepCountListener,
  removeStepCountListener,
  type StepCountData,
} from 'rnpedometer';

export default function App() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  useEffect(() => {
    checkAvailability();

    // Request permissions on Android
    if (Platform.OS === 'android') {
      requestPermissions();
    }

    // Cleanup function
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step Counter Permission',
          message: 'This app needs access to count your steps',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Failed to request permission:', err);
      return false;
    }
  };

  const checkAvailability = async () => {
    try {
      const available = await isStepCountingAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Failed to check pedometer availability:', error);
    }
  };

  const startTracking = async () => {
    try {
      await startStepCounterUpdate();
      setIsTracking(true);

      // Add step count listener
      const subscription = addStepCountListener((data: StepCountData) => {
        setSteps(data.steps);
        setTotalSteps(data.totalSteps);
      });

      // Store the subscription for cleanup
      return subscription;
    } catch (error) {
      console.error('Failed to start step tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      await stopStepCounterUpdate();
      removeStepCountListener();
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop step tracking:', error);
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text>Step counting is not available on this device</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Step Counter</Text>
        <Text style={styles.stepText}>Steps this session: {steps}</Text>
        <Text style={styles.stepText}>Total steps: {totalSteps}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <Button title="Start Tracking" onPress={startTracking} />
        ) : (
          <Button title="Stop Tracking" onPress={stopTracking} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepText: {
    fontSize: 18,
    marginVertical: 5,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
});
