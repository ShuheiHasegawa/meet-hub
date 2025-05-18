interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<string>;
}

interface DeviceOrientationEventStatic extends EventTarget {
  requestPermission?: () => Promise<string>;
}

// DeviceOrientationEventコンストラクタにiOS用のメソッドを追加
interface Window {
  DeviceOrientationEvent: DeviceOrientationEventStatic & {
    new(type: string, eventInitDict?: DeviceOrientationEventInit): DeviceOrientationEvent;
    prototype: DeviceOrientationEvent;
    requestPermission?: () => Promise<string>;
  };
} 