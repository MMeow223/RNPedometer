import { NativeEventEmitter } from 'react-native';
import RNPedometer, { type StepCountData } from './NativeRNPedometer';

// Create event emitter for step counter updates
const eventEmitter = new NativeEventEmitter(RNPedometer);

export type { StepCountData };

export function startStepCounterUpdate(): Promise<boolean> {
  return RNPedometer.startStepCounterUpdate();
}

export function stopStepCounterUpdate(): Promise<boolean> {
  return RNPedometer.stopStepCounterUpdate();
}

export function isStepCountingAvailable(): Promise<boolean> {
  return RNPedometer.isStepCountingAvailable();
}

export function addStepCountListener(callback: (event: StepCountData) => void) {
  return eventEmitter.addListener('StepCounterUpdate', callback);
}

export function removeStepCountListener() {
  eventEmitter.removeAllListeners('StepCounterUpdate');
}

const RNPedometerModule = {
  startStepCounterUpdate,
  stopStepCounterUpdate,
  isStepCountingAvailable,
  addStepCountListener,
  removeStepCountListener,
};

export default RNPedometerModule;
