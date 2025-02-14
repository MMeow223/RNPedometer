import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface StepCountData {
  steps: number;
  totalSteps: number;
  timestamp: number;
}

export interface Spec extends TurboModule {
  // Core pedometer methods
  startStepCounterUpdate(): Promise<boolean>;
  stopStepCounterUpdate(): Promise<boolean>;
  isStepCountingAvailable(): Promise<boolean>;

  // Event emitter methods required by NativeEventEmitter
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNPedometer');
