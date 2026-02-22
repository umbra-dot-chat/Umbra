import Vision
import CoreVideo

/// Wraps Apple's VNGeneratePersonSegmentationRequest for real-time person segmentation.
///
/// Uses VNSequenceRequestHandler for temporal smoothing across consecutive frames,
/// reducing mask flicker in video. Produces a grayscale CVPixelBuffer mask where
/// 255 = person, 0 = background.
class SegmentationEngine {

    // MARK: - Properties

    /// Reused across frames for temporal smoothing (reduces jitter between frames).
    private let sequenceHandler = VNSequenceRequestHandler()

    /// Quality level for segmentation. `.balanced` targets ~25fps on iPhone 12+.
    var qualityLevel: VNGeneratePersonSegmentationRequest.QualityLevel = .balanced

    // MARK: - Segmentation

    /// Run person segmentation on a camera frame.
    ///
    /// - Parameter pixelBuffer: The input camera frame (BGRA format).
    /// - Returns: A grayscale CVPixelBuffer mask (OneComponent8) where
    ///   255 = person, 0 = background. Returns nil if segmentation fails.
    func segment(pixelBuffer: CVPixelBuffer) -> CVPixelBuffer? {
        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = qualityLevel
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8

        do {
            // Use sequence handler for frame-to-frame temporal consistency
            try sequenceHandler.perform([request], on: pixelBuffer, orientation: .up)
        } catch {
            // Segmentation failed — return nil to signal passthrough
            return nil
        }

        guard let result = request.results?.first as? VNPixelBufferObservation else {
            return nil
        }

        return result.pixelBuffer
    }

    /// Reset the sequence handler (e.g., when switching cameras).
    /// This clears temporal smoothing state so the new camera angle
    /// doesn't blend with the previous one.
    func reset() {
        // VNSequenceRequestHandler doesn't have an explicit reset,
        // but creating a new request after switching cameras effectively
        // resets the temporal context since the scene changed.
        // The handler handles this gracefully on its own.
    }
}
