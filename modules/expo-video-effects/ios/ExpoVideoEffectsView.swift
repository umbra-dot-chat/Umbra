import ExpoModulesCore
import MetalKit
import CoreImage
import CoreVideo

/// Native UIView that renders processed video frames using Metal.
///
/// Receives CVPixelBuffer frames from VideoEffectsProcessor and renders them
/// to an MTKView for GPU-direct display. Exposed to React Native as an Expo View
/// with props for controlling the effect pipeline.
class ExpoVideoEffectsView: ExpoView, MTKViewDelegate {

    // MARK: - Properties

    private let metalView: MTKView
    private let metalDevice: MTLDevice
    private let metalCommandQueue: MTLCommandQueue
    private let ciContext: CIContext

    /// The processing pipeline (shared or owned).
    let processor = VideoEffectsProcessor()

    /// Current CIImage to render (updated each frame from processor).
    private var currentImage: CIImage?

    /// Whether the pipeline has been started.
    private var isStarted = false

    // MARK: - Init

    required init(appContext: AppContext) {
        guard let device = MTLCreateSystemDefaultDevice(),
              let queue = device.makeCommandQueue() else {
            fatalError("[ExpoVideoEffectsView] Metal is not available")
        }

        metalDevice = device
        metalCommandQueue = queue
        ciContext = CIContext(mtlDevice: device, options: [
            .cacheIntermediates: false,
        ])

        metalView = MTKView(frame: .zero, device: device)
        metalView.framebufferOnly = false
        metalView.isPaused = true                   // We drive rendering manually
        metalView.enableSetNeedsDisplay = true       // Render on demand
        metalView.contentMode = .scaleAspectFill
        metalView.clipsToBounds = true

        // Use BGRA format to match CVPixelBuffer format
        metalView.colorPixelFormat = .bgra8Unorm

        super.init(appContext: appContext)

        metalView.delegate = self
        addSubview(metalView)

        // Wire processor output to view
        processor.onProcessedFrame = { [weak self] pixelBuffer, _ in
            let image = CIImage(cvPixelBuffer: pixelBuffer)
            self?.currentImage = image
            DispatchQueue.main.async {
                self?.metalView.setNeedsDisplay()
            }
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) not supported")
    }

    // MARK: - Layout

    override func layoutSubviews() {
        super.layoutSubviews()
        metalView.frame = bounds
    }

    // MARK: - Cleanup

    deinit {
        processor.stop()
    }

    // MARK: - MTKViewDelegate

    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        // Nothing to do — we adapt to the drawable size in draw()
    }

    func draw(in view: MTKView) {
        guard let image = currentImage,
              let drawable = view.currentDrawable,
              let commandBuffer = metalCommandQueue.makeCommandBuffer() else {
            return
        }

        let drawableSize = view.drawableSize
        let imageExtent = image.extent

        // Scale image to fill the drawable (aspect fill with center crop)
        let scaleX = drawableSize.width / imageExtent.width
        let scaleY = drawableSize.height / imageExtent.height
        let scale = max(scaleX, scaleY)

        let scaledImage = image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        // Center the scaled image in the drawable
        let offsetX = (drawableSize.width - scaledImage.extent.width) / 2 - scaledImage.extent.origin.x
        let offsetY = (drawableSize.height - scaledImage.extent.height) / 2 - scaledImage.extent.origin.y
        let centeredImage = scaledImage.transformed(by: CGAffineTransform(translationX: offsetX, y: offsetY))

        let destination = CIRenderDestination(
            width: Int(drawableSize.width),
            height: Int(drawableSize.height),
            pixelFormat: view.colorPixelFormat,
            commandBuffer: commandBuffer,
            mtlTextureProvider: { () -> MTLTexture in
                return drawable.texture
            }
        )

        do {
            try ciContext.startTask(toRender: centeredImage, to: destination)
        } catch {
            // Render failed — skip this frame
        }

        commandBuffer.present(drawable)
        commandBuffer.commit()
    }

    // MARK: - Pipeline Control (called from Expo props)

    func startPipeline() {
        guard !isStarted else { return }
        processor.start(
            position: .front,
            effect: processor.effect,
            blurIntensity: processor.blurIntensity
        )
        isStarted = true
    }

    func stopPipeline() {
        guard isStarted else { return }
        processor.stop()
        isStarted = false
        currentImage = nil
        metalView.setNeedsDisplay()
    }
}
