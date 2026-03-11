/**
 * DevicePicker — Dropdown selectors for audio/video devices.
 */

export interface DeviceOption {
  deviceId: string;
  label: string;
}

export interface DevicePickerProps {
  /** Available microphones */
  audioInputs: DeviceOption[];
  /** Available cameras */
  videoInputs: DeviceOption[];
  /** Available speakers */
  audioOutputs: DeviceOption[];
  /** Currently selected microphone ID */
  selectedAudioInput?: string;
  /** Currently selected camera ID */
  selectedVideoInput?: string;
  /** Currently selected speaker ID */
  selectedAudioOutput?: string;
  /** Called when mic selection changes */
  onSelectAudioInput: (deviceId: string) => void;
  /** Called when camera selection changes */
  onSelectVideoInput: (deviceId: string) => void;
  /** Called when speaker selection changes */
  onSelectAudioOutput: (deviceId: string) => void;
  /** Custom style */
  style?: object;
}
