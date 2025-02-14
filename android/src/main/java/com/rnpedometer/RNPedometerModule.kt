package com.rnpedometer

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.module.annotations.ReactModule


@ReactModule(name = RNPedometerModule.NAME)
class RNPedometerModule(reactContext: ReactApplicationContext) :
  NativeRNPedometerSpec(reactContext), SensorEventListener, LifecycleEventListener {

  private var sensorManager: SensorManager? = null
  private var stepCounter: Sensor? = null
  private var isListening = false
  private var lastStepCount: Float = 0f
  private var initialStepCount: Float = -1f
  private var listenerCount = 0

  init {
    reactContext.addLifecycleEventListener(this)
    sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepCounter = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  }


  override fun addListener(eventName: String) {
    listenerCount += 1
  }

  override fun removeListeners(count: Double) {
    listenerCount = Math.max(0, listenerCount - count.toInt())
    if (listenerCount == 0) {
      val dummyPromise = object : Promise {
        override fun resolve(value: Any?) {}
        override fun reject(code: String, throwable: Throwable?) {}
        override fun reject(code: String, message: String?, throwable: Throwable?) {}
        override fun reject(throwable: Throwable) {}
        override fun reject(throwable: Throwable, userInfo: WritableMap) {}
        override fun reject(code: String, userInfo: WritableMap) {}
        override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) {}
        override fun reject(code: String, message: String?, userInfo: WritableMap) {}
        override fun reject(
          code: String?,
          message: String?,
          throwable: Throwable?,
          userInfo: WritableMap?
        ) {}
        override fun reject(message: String) {}
        override fun reject(code: String, message: String?) {}
      }
      stopStepCounterUpdate(dummyPromise)
    }
  }

  override fun startStepCounterUpdate(promise: Promise) {
    if (stepCounter == null) {
      promise.reject("E_STEP_COUNTER", "Step counter sensor not available on this device")
      return
    }

    if (!isListening) {
      sensorManager?.registerListener(
        this,
        stepCounter,
        SensorManager.SENSOR_DELAY_NORMAL
      )
      isListening = true
      promise.resolve(true)
    } else {
      promise.resolve(false)
    }
  }

  override fun stopStepCounterUpdate(promise: Promise) {
    if (isListening) {
      sensorManager?.unregisterListener(this)
      isListening = false
      promise.resolve(true)
    } else {
      promise.resolve(false)
    }
  }

  override fun isStepCountingAvailable(promise: Promise) {
    promise.resolve(stepCounter != null)
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_STEP_COUNTER) {
      val steps = event.values[0]

      if (initialStepCount < 0) {
        initialStepCount = steps
        lastStepCount = steps
      }

      val stepsDelta = steps - lastStepCount
      lastStepCount = steps

      val totalSteps = steps - initialStepCount

      sendStepUpdate(stepsDelta.toInt(), totalSteps.toInt())
    }
  }

  private fun sendStepUpdate(stepsDelta: Int, totalSteps: Int) {
    // Only send updates if we have listeners
    if (listenerCount > 0) {
      val params = Arguments.createMap().apply {
        putInt("steps", stepsDelta)
        putInt("totalSteps", totalSteps)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }

      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("StepCounterUpdate", params)
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    // Handle accuracy changes if needed
  }

  override fun onHostResume() {
    if (isListening) {
      sensorManager?.registerListener(
        this,
        stepCounter,
        SensorManager.SENSOR_DELAY_NORMAL
      )
    }
  }

  override fun onHostPause() {
    if (isListening) {
      sensorManager?.unregisterListener(this)
    }
  }

  override fun onHostDestroy() {
    sensorManager?.unregisterListener(this)
    listenerCount = 0
  }

  companion object {
    const val NAME = "RNPedometer"
  }
}
