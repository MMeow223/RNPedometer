# @mmeow223/rnpedometer

## React Native Pedometer

`@mmeow223/rnpedometer` is a React Native module that provides access to the pedometer of a mobile device, allowing you to listen for step count updates in real-time.

⚠ **iOS Implementation Not Available Yet** Currently, this package only supports Android. iOS support is not implemented yet. Contributions are welcome!

## Features

* Start and stop step counting.
* Check if step counting is available on the device.
* Listen for real-time step count updates.
* Uses the native pedometer APIs for both iOS and Android.

## Installation

```sh
npm install @mmeow223/rnpedometer
```

or using Yarn:

```sh
yarn add @mmeow223/rnpedometer
```

### iOS Setup

For iOS, ensure that `NSMotionUsageDescription` is added to your `Info.plist` file:

```xml
<key>NSMotionUsageDescription</key>
<string>We use motion data to count your steps.</string>
```

Then, run:

```sh
cd ios
pod install
```

### Android Setup

For Android, you need to request the `ACTIVITY_RECOGNITION` permission in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
```

## Usage

Here's an example implementation of how to use `@mmeow223/rnpedometer` in your React Native app:

```tsx
import React, { useEffect, useState } from 'react';
import { Text, View, Button, PermissionsAndroid, Platform } from 'react-native';
import {
  startStepCounterUpdate,
  stopStepCounterUpdate,
  isStepCountingAvailable,
  addStepCountListener,
  removeStepCountListener,
  type StepCountData,
} from '@mmeow223/rnpedometer';

export default function App() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  useEffect(() => {
    checkAvailability();

    if (Platform.OS === 'android') {
      requestPermissions();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
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

      const subscription = addStepCountListener((data: StepCountData) => {
        setSteps(data.steps);
        setTotalSteps(data.totalSteps);
      });
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
      <View>
        <Text>Step counting is not available on this device</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>Steps this session: {steps}</Text>
      <Text>Total steps: {totalSteps}</Text>
      {!isTracking ? (
        <Button title="Start Tracking" onPress={startTracking} />
      ) : (
        <Button title="Stop Tracking" onPress={stopTracking} />
      )}
    </View>
  );
}
```

## API

### `startStepCounterUpdate(): Promise<boolean>`

Starts step counting and returns a promise resolving to `true` if successful.

### `stopStepCounterUpdate(): Promise<boolean>`

Stops step counting.

### `isStepCountingAvailable(): Promise<boolean>`

Checks if step counting is available on the device.

### `addStepCountListener(callback: (event: StepCountData) => void): void`

Registers a listener to receive step count updates.

### `removeStepCountListener(): void`

Removes all registered step count listeners.

## License

MIT

