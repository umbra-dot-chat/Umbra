import CoreImage
import CoreVideo
import Metal

/// GPU-accelerated frame compositor using CIFilter.
///
/// Composites camera frames with segmentation masks to produce:
/// - **Blur mode:** Sharp person over blurred background (CIGaussianBlur + CIBlendWithMask)
/// - **Virtual background:** Person composited over a custom image (CIBlendWithMask)
///
/// Uses a Metal-backed CIContext for all rendering — never touches CPU for pixel work.
class FrameCompositor {

    // MARK: - Types

    enum Effect: String {
        case none
        case blur
        case virtualBackground = "virtual-background"
    }

    // MARK: - Properties

    /// Metal-backed CIContext for GPU rendering. Critical for 30fps performance.
    private let ciContext: CIContext

    /// Metal device for pixel buffer pool allocation.
    private let metalDevice: MTLDevice

    /// Reusable output pixel buffer pool (triple buffering).
    private var outputPool: CVPixelBufferPool?
    private var poolWidth: Int = 0
    private var poolHeight: Int = 0

    /// Cached background image for virtual-background mode.
    private var backgroundCIImage: CIImage?

    /// Loading state for background image.
    private var backgroundLoadTask: URLSessionDataTask?

    // MARK: - Init

    init() {
        guard let device = MTLCreateSystemDefaultDevice() else {
            fatalError("[FrameCompositor] Metal is not available on this device")
        }
        metalDevice = device
        ciContext = CIContext(mtlDevice: device, options: [
            .cacheIntermediates: false,  // Don't cache — we process unique frames
            .priorityRequestLow: false,  // High priority for real-time rendering
        ])
    }

    // MARK: - Background Image

    /// Load a background image from a URL (cached for subsequent frames).
    func setBackgroundImage(url: String) {
        // Cancel any in-flight load
        backgroundLoadTask?.cancel()

        guard let imageURL = URL(string: url) else {
            backgroundCIImage = nil
            return
        }

        // Check if it's a local file or bundled asset
        if imageURL.isFileURL {
            if let image = CIImage(contentsOf: imageURL) {
                backgroundCIImage = image
            }
            return
        }

        // Remote URL — load async
        backgroundLoadTask = URLSession.shared.dataTask(with: imageURL) { [weak self] data, _, error in
            guard let data = data, error == nil,
                  let image = CIImage(data: data) else {
                return
            }
            self?.backgroundCIImage = image
        }
        backgroundLoadTask?.resume()
    }

    /// Set background from bundled image data (base64 or raw bytes).
    func setBackgroundImageData(_ data: Data) {
        backgroundCIImage = CIImage(data: data)
    }

    /// Clear the background image.
    func clearBackgroundImage() {
        backgroundLoadTask?.cancel()
        backgroundCIImage = nil
    }

    // MARK: - Compositing

    /// Composite a camera frame with a segmentation mask.
    ///
    /// - Parameters:
    ///   - frame: Original camera frame (BGRA CVPixelBuffer).
    ///   - mask: Segmentation mask (OneComponent8 CVPixelBuffer, 255=person, 0=background).
    ///   - effect: The effect to apply.
    ///   - blurIntensity: Blur radius for blur mode (1-30, maps to CIFilter radius 5-60).
    /// - Returns: Composited CVPixelBuffer, or nil on failure.
    func composite(
        frame: CVPixelBuffer,
        mask: CVPixelBuffer,
        effect: Effect,
        blurIntensity: Int = 10
    ) -> CVPixelBuffer? {
        let width = CVPixelBufferGetWidth(frame)
        let height = CVPixelBufferGetHeight(frame)

        // Ensure pixel buffer pool matches current resolution
        ensurePool(width: width, height: height)

        let frameImage = CIImage(cvPixelBuffer: frame)

        // Scale mask to match frame dimensions (Vision may output a different size)
        let maskImage = scaledMask(mask, to: CGSize(width: width, height: height))

        let composited: CIImage?

        switch effect {
        case .none:
            // No compositing needed — passthrough
            return frame

        case .blur:
            composited = composeBlur(
                frame: frameImage,
                mask: maskImage,
                radius: blurRadiusFromIntensity(blurIntensity),
                extent: frameImage.extent
            )

        case .virtualBackground:
            composited = composeVirtualBackground(
                frame: frameImage,
                mask: maskImage,
                size: CGSize(width: width, height: height)
            )
        }

        guard let output = composited else { return nil }
        return renderToPixelBuffer(output, width: width, height: height)
    }

    // MARK: - Blur Compositing

    private func composeBlur(
        frame: CIImage,
        mask: CIImage,
        radius: CGFloat,
        extent: CGRect
    ) -> CIImage? {
        // 1. Create blurred version of the full frame
        guard let blurred = frame
            .clampedToExtent()                    // Prevent edge artifacts
            .applyingGaussianBlur(sigma: radius)
            .cropped(to: extent) as CIImage?      // Crop back to original bounds
        else { return nil }

        // 2. Blend: person (sharp) over background (blurred) using mask
        guard let blendFilter = CIFilter(name: "CIBlendWithMask") else { return nil }
        blendFilter.setValue(frame, forKey: kCIInputImageKey)           // Foreground (person, sharp)
        blendFilter.setValue(blurred, forKey: kCIInputBackgroundImageKey) // Background (blurred)
        blendFilter.setValue(mask, forKey: kCIInputMaskImageKey)          // Mask (white=foreground)

        return blendFilter.outputImage
    }

    // MARK: - Virtual Background Compositing

    private func composeVirtualBackground(
        frame: CIImage,
        mask: CIImage,
        size: CGSize
    ) -> CIImage? {
        // Get background image (or use solid dark fallback)
        let background: CIImage
        if let bgImage = backgroundCIImage {
            // Scale background to match frame size
            let bgExtent = bgImage.extent
            let scaleX = size.width / bgExtent.width
            let scaleY = size.height / bgExtent.height
            let scale = max(scaleX, scaleY) // Cover (not contain)
            background = bgImage
                .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
                .cropped(to: CGRect(origin: .zero, size: size))
        } else {
            // Solid dark blue fallback (#1a1a2e)
            background = CIImage(color: CIColor(red: 0.102, green: 0.102, blue: 0.180))
                .cropped(to: CGRect(origin: .zero, size: size))
        }

        // Blend: person (original) over background (image) using mask
        guard let blendFilter = CIFilter(name: "CIBlendWithMask") else { return nil }
        blendFilter.setValue(frame, forKey: kCIInputImageKey)              // Foreground (person)
        blendFilter.setValue(background, forKey: kCIInputBackgroundImageKey) // Background (image)
        blendFilter.setValue(mask, forKey: kCIInputMaskImageKey)             // Mask (white=foreground)

        return blendFilter.outputImage
    }

    // MARK: - Helpers

    /// Scale the segmentation mask to match the frame dimensions.
    private func scaledMask(_ mask: CVPixelBuffer, to targetSize: CGSize) -> CIImage {
        let maskImage = CIImage(cvPixelBuffer: mask)
        let maskExtent = maskImage.extent

        if maskExtent.width == targetSize.width && maskExtent.height == targetSize.height {
            return maskImage
        }

        let scaleX = targetSize.width / maskExtent.width
        let scaleY = targetSize.height / maskExtent.height
        return maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
    }

    /// Map blurIntensity (1-30) to CIGaussianBlur sigma (5-60).
    private func blurRadiusFromIntensity(_ intensity: Int) -> CGFloat {
        let clamped = max(1, min(30, intensity))
        // Linear mapping: 1 → 5, 30 → 60
        return CGFloat(5 + (clamped - 1) * 55 / 29)
    }

    /// Render a CIImage to a CVPixelBuffer from the pool.
    private func renderToPixelBuffer(_ image: CIImage, width: Int, height: Int) -> CVPixelBuffer? {
        guard let pool = outputPool else { return nil }

        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

        ciContext.render(image, to: buffer)
        return buffer
    }

    /// Ensure the output pixel buffer pool matches the required dimensions.
    private func ensurePool(width: Int, height: Int) {
        guard width != poolWidth || height != poolHeight else { return }

        let poolAttributes: [String: Any] = [
            kCVPixelBufferPoolMinimumBufferCountKey as String: 3,  // Triple buffering
        ]

        let bufferAttributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: width,
            kCVPixelBufferHeightKey as String: height,
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:],
        ]

        var pool: CVPixelBufferPool?
        CVPixelBufferPoolCreate(nil, poolAttributes as CFDictionary, bufferAttributes as CFDictionary, &pool)
        outputPool = pool
        poolWidth = width
        poolHeight = height
    }
}
