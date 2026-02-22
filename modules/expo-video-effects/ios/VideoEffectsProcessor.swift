import AVFoundation
import CoreVideo

/// Pipeline orchestrator: Camera → Segmentation → Compositing → Output.
///
/// Wires CameraManager, SegmentationEngine, and FrameCompositor into a single
/// real-time processing pipeline. When effect is "none", bypasses ML + compositing
/// entirely for zero-overhead passthrough.
class VideoEffectsProcessor {

    // MARK: - Properties

    let camera = CameraManager()
    let segmentation = SegmentationEngine()
    let compositor = FrameCompositor()

    /// Current effect mode.
    private(set) var effect: FrameCompositor.Effect = .none

    /// Blur intensity (1-30).
    private(set) var blurIntensity: Int = 10

    /// Whether the pipeline is running.
    private(set) var isRunning = false

    /// Called for each processed frame. Invoked on the camera's output queue.
    var onProcessedFrame: ((CVPixelBuffer, CMTime) -> Void)?

    // MARK: - Lifecycle

    /// Start the processing pipeline.
    ///
    /// - Parameters:
    ///   - position: Camera position (.front or .back).
    ///   - effect: Initial effect to apply.
    ///   - blurIntensity: Initial blur intensity (1-30).
    ///   - backgroundImage: Optional background image URL for virtual-background mode.
    func start(
        position: AVCaptureDevice.Position = .front,
        effect: FrameCompositor.Effect = .none,
        blurIntensity: Int = 10,
        backgroundImage: String? = nil
    ) {
        guard !isRunning else { return }

        self.effect = effect
        self.blurIntensity = blurIntensity

        if let url = backgroundImage {
            compositor.setBackgroundImage(url: url)
        }

        // Wire camera frames to the processing pipeline
        camera.onFrame = { [weak self] pixelBuffer, timestamp in
            self?.processFrame(pixelBuffer, timestamp: timestamp)
        }

        camera.start(position: position)
        isRunning = true
    }

    /// Stop the pipeline and release resources.
    func stop() {
        guard isRunning else { return }
        camera.stop()
        camera.onFrame = nil
        isRunning = false
    }

    // MARK: - Configuration (can be changed while running)

    /// Change the active effect without restarting the camera.
    func setEffect(_ newEffect: FrameCompositor.Effect) {
        effect = newEffect
    }

    /// Change the active effect from a string identifier.
    func setEffectFromString(_ effectString: String) {
        effect = FrameCompositor.Effect(rawValue: effectString) ?? .none
    }

    /// Update blur intensity (1-30).
    func setBlurIntensity(_ intensity: Int) {
        blurIntensity = max(1, min(30, intensity))
    }

    /// Set or change the background image URL.
    func setBackgroundImage(url: String) {
        compositor.setBackgroundImage(url: url)
    }

    /// Clear the background image.
    func clearBackgroundImage() {
        compositor.clearBackgroundImage()
    }

    /// Switch between front and back camera.
    func switchCamera() {
        camera.switchCamera()
        segmentation.reset() // Clear temporal smoothing for new camera angle
    }

    // MARK: - Frame Processing

    private func processFrame(_ pixelBuffer: CVPixelBuffer, timestamp: CMTime) {
        // Fast path: no effect → pass through raw camera frame
        if effect == .none {
            onProcessedFrame?(pixelBuffer, timestamp)
            return
        }

        // Run person segmentation
        guard let mask = segmentation.segment(pixelBuffer: pixelBuffer) else {
            // Segmentation failed — pass through raw frame as fallback
            onProcessedFrame?(pixelBuffer, timestamp)
            return
        }

        // Composite the frame with the mask
        if let composited = compositor.composite(
            frame: pixelBuffer,
            mask: mask,
            effect: effect,
            blurIntensity: blurIntensity
        ) {
            onProcessedFrame?(composited, timestamp)
        } else {
            // Compositing failed — pass through raw frame
            onProcessedFrame?(pixelBuffer, timestamp)
        }
    }
}
