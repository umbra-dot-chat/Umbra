import AVFoundation
import UIKit

/// Manages AVCaptureSession for real-time camera frame capture.
///
/// Delivers CVPixelBuffer frames at 30fps via the `onFrame` callback.
/// Supports front/back camera switching without restarting the session.
class CameraManager: NSObject {

    // MARK: - Properties

    private let session = AVCaptureSession()
    private let outputQueue = DispatchQueue(label: "com.umbra.videoeffects.camera", qos: .userInteractive)
    private var currentInput: AVCaptureDeviceInput?
    private var currentPosition: AVCaptureDevice.Position = .front
    private var isRunning = false

    /// Called on `outputQueue` for each captured frame.
    var onFrame: ((CVPixelBuffer, CMTime) -> Void)?

    // MARK: - Lifecycle

    /// Start camera capture with the given position and resolution.
    func start(position: AVCaptureDevice.Position = .front, width: Int = 1280, height: Int = 720) {
        guard !isRunning else { return }

        session.beginConfiguration()
        session.sessionPreset = .hd1280x720

        // Add camera input
        currentPosition = position
        if let device = cameraDevice(for: position),
           let input = try? AVCaptureDeviceInput(device: device) {
            if session.canAddInput(input) {
                session.addInput(input)
                currentInput = input
            }
        }

        // Add video data output
        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: outputQueue)

        if session.canAddOutput(output) {
            session.addOutput(output)
        }

        // Fix orientation for front camera (mirror)
        if let connection = output.connection(with: .video) {
            if connection.isVideoMirroringSupported {
                connection.isVideoMirrored = (position == .front)
            }
        }

        session.commitConfiguration()

        outputQueue.async { [weak self] in
            self?.session.startRunning()
        }
        isRunning = true
    }

    /// Stop camera capture and release resources.
    func stop() {
        guard isRunning else { return }
        outputQueue.async { [weak self] in
            self?.session.stopRunning()
        }
        isRunning = false

        // Remove all inputs and outputs
        session.beginConfiguration()
        for input in session.inputs {
            session.removeInput(input)
        }
        for output in session.outputs {
            session.removeOutput(output)
        }
        session.commitConfiguration()
        currentInput = nil
    }

    /// Switch between front and back camera.
    func switchCamera() {
        let newPosition: AVCaptureDevice.Position = (currentPosition == .front) ? .back : .front

        guard let newDevice = cameraDevice(for: newPosition),
              let newInput = try? AVCaptureDeviceInput(device: newDevice) else {
            return
        }

        session.beginConfiguration()

        // Remove current input
        if let current = currentInput {
            session.removeInput(current)
        }

        // Add new input
        if session.canAddInput(newInput) {
            session.addInput(newInput)
            currentInput = newInput
            currentPosition = newPosition
        }

        // Update mirroring for the new camera
        if let output = session.outputs.first as? AVCaptureVideoDataOutput,
           let connection = output.connection(with: .video),
           connection.isVideoMirroringSupported {
            connection.isVideoMirrored = (newPosition == .front)
        }

        session.commitConfiguration()
    }

    /// Current camera position.
    var cameraPosition: AVCaptureDevice.Position {
        return currentPosition
    }

    // MARK: - Helpers

    private func cameraDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        // Prefer wide-angle camera
        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position) {
            return device
        }
        return AVCaptureDevice.default(for: .video)
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

extension CameraManager: AVCaptureVideoDataOutputSampleBufferDelegate {

    func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
        onFrame?(pixelBuffer, timestamp)
    }

    func captureOutput(
        _ output: AVCaptureOutput,
        didDrop sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        // Frame dropped due to processing backpressure — this is expected and fine.
    }
}
