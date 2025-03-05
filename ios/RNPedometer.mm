#import "RNPedometer.h"
#import <CoreMotion/CoreMotion.h>

@interface RNPedometer()
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, strong) NSNumber *initialStepCount;
@property (nonatomic, strong) NSNumber *currentStepCount;
@property (nonatomic, assign) BOOL isTracking;
@property (nonatomic, assign) NSInteger listenerCount;
@end

@implementation RNPedometer

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    _pedometer = [[CMPedometer alloc] init];
    _initialStepCount = nil;
    _currentStepCount = @0;
    _isTracking = NO;
    _listenerCount = 0;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#pragma mark - RCTEventEmitter Methods

- (NSArray<NSString *> *)supportedEvents {
  return @[@"StepCounterUpdate"];
}

- (void)startObserving {
  self.listenerCount += 1;
}

- (void)stopObserving {
  self.listenerCount -= 1;
  
  // If no listeners, stop tracking
  if (self.listenerCount <= 0) {
    self.listenerCount = 0;
    if (self.isTracking) {
      [self stopPedometerUpdates];
    }
  }
}

#pragma mark - NativeRNPedometerSpec Implementation

- (void)addListener:(NSString *)eventName {
  [super addListener:eventName];
}

- (void)removeListeners:(double)count {
  [super removeListeners:count];
}

- (void)isStepCountingAvailable:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject {
  BOOL isAvailable = [CMPedometer isStepCountingAvailable];
  resolve(@(isAvailable));
}

- (void)startStepCounterUpdate:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
  if (self.isTracking) {
    resolve(@(NO));
    return;
  }
  
  if (![CMPedometer isStepCountingAvailable]) {
    reject(@"E_STEP_COUNTER", @"Step counting is not available on this device", nil);
    return;
  }
  
  NSDate *now = [NSDate date];
  __weak RNPedometer *weakSelf = self;
  [self.pedometer startPedometerUpdatesFromDate:now withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    RNPedometer *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    
    if (error) {
      // Don't reject promise since startPedometerUpdates may have succeeded
      // Just log the error and continue
      NSLog(@"Error receiving pedometer updates: %@", error);
      return;
    }
    
    if (!pedometerData) {
      return;
    }
    
    // Initialize step count tracking
    if (!strongSelf.initialStepCount) {
      strongSelf.initialStepCount = pedometerData.numberOfSteps;
      strongSelf.currentStepCount = pedometerData.numberOfSteps;
    }
    
    // Calculate steps since last update
    NSInteger stepsDelta = [pedometerData.numberOfSteps integerValue] - [strongSelf.currentStepCount integerValue];
    strongSelf.currentStepCount = pedometerData.numberOfSteps;
    
    // Calculate total steps since starting tracking
    NSInteger totalSteps = [pedometerData.numberOfSteps integerValue] - [strongSelf.initialStepCount integerValue];
    
    if (strongSelf.listenerCount > 0) {
      [strongSelf sendEventWithName:@"StepCounterUpdate" body:@{
        @"steps": @(stepsDelta),
        @"totalSteps": @(totalSteps),
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
      }];
    }
  }];
  
  self.isTracking = YES;
  resolve(@(YES));
}

- (void)stopStepCounterUpdate:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
  if (!self.isTracking) {
    resolve(@(NO));
    return;
  }
  
  [self stopPedometerUpdates];
  resolve(@(YES));
}

- (void)stopPedometerUpdates {
  [self.pedometer stopPedometerUpdates];
  self.isTracking = NO;
}

#pragma mark - Turbo Module Requirements

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRNPedometerSpecJSI>(params);
}

@end
