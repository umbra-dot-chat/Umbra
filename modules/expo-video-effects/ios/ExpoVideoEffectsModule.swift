import ExpoModulesCore
import AVFoundation

/// Expo module for native video effects (background blur, virtual backgrounds).
///
/// Uses Apple's Vision framework (VNGeneratePersonSegmentationRequest) for real-time
/// person segmentation and CIFilter + Metal for GPU-accelerated compositing.
///
/// Exposes both:
/// - Function API for controlling a standalone processing pipeline
/// - Native View for rendering processed camera frames directly
public class ExpoVideoEffectsModule: Module {

    /// Standalone processor for function-based API (used when not using the view).
    private var processor: VideoEffectsProcessor?

    public func definition() -> ModuleDefinition {
        Name("ExpoVideoEffects")

        // ── Functions ──────────────────────────────────────────────────────

        /// Start the video effects processing pipeline.
        /// Config JSON: { "effect": "blur"|"virtual-background"|"none",
        ///                "blurIntensity": 1-30,
        ///                "backgroundImage": "url"|null,
        ///                "cameraPosition": "front"|"back" }
        AsyncFunction("startProcessing") { (configJson: String) -> String in
            // Parse config
            guard let data = configJson.data(using: .utf8),
                  let config = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return "{\"error\": true, \"message\": \"Invalid config JSON\"}"
            }

            let effectStr = config["effect"] as? String ?? "none"
            let effect = FrameCompositor.Effect(rawValue: effectStr) ?? .none
            let blurIntensity = config["blurIntensity"] as? Int ?? 10
            let backgroundImage = config["backgroundImage"] as? String
            let positionStr = config["cameraPosition"] as? String ?? "front"
            let position: AVCaptureDevice.Position = positionStr == "back" ? .back : .front

            // Check camera permission
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            if status == .denied || status == .restricted {
                return "{\"error\": true, \"message\": \"Camera permission denied\"}"
            }

            if status == .notDetermined {
                // Request permission
                let granted = await withCheckedContinuation { continuation in
                    AVCaptureDevice.requestAccess(for: .video) { granted in
                        continuation.resume(returning: granted)
                    }
                }
                if !granted {
                    return "{\"error\": true, \"message\": \"Camera permission denied\"}"
                }
            }

            // Create or reuse processor
            if self.processor == nil {
                self.processor = VideoEffectsProcessor()
            }

            self.processor?.start(
                position: position,
                effect: effect,
                blurIntensity: blurIntensity,
                backgroundImage: backgroundImage
            )

            return "{\"success\": true}"
        }

        /// Stop the processing pipeline.
        Function("stopProcessing") { () -> String in
            self.processor?.stop()
            return "{\"success\": true}"
        }

        /// Change the active effect without restarting the camera.
        Function("setEffect") { (effect: String) -> String in
            self.processor?.setEffectFromString(effect)
            return "{\"success\": true, \"effect\": \"\(effect)\"}"
        }

        /// Update blur intensity (1-30).
        Function("setBlurIntensity") { (intensity: Int) -> String in
            self.processor?.setBlurIntensity(intensity)
            return "{\"success\": true, \"blurIntensity\": \(intensity)}"
        }

        /// Set the background image URL for virtual-background mode.
        Function("setBackgroundImage") { (url: String?) -> String in
            if let url = url {
                self.processor?.setBackgroundImage(url: url)
            } else {
                self.processor?.clearBackgroundImage()
            }
            return "{\"success\": true}"
        }

        /// Switch between front and back camera.
        Function("switchCamera") { () -> String in
            self.processor?.switchCamera()
            let position = self.processor?.camera.cameraPosition == .front ? "front" : "back"
            return "{\"success\": true, \"cameraPosition\": \"\(position)\"}"
        }

        /// Check if the device supports video effects (requires iOS 15+ and Metal).
        Function("isSupported") { () -> String in
            let supported = MTLCreateSystemDefaultDevice() != nil
            return "{\"supported\": \(supported)}"
        }

        // ── Native View ─────────────────────────────────────────────────────

        View(ExpoVideoEffectsView.self) {
            /// The video effect to apply: "none", "blur", or "virtual-background".
            Prop("effect") { (view: ExpoVideoEffectsView, effect: String) in
                view.processor.setEffectFromString(effect)
            }

            /// Blur intensity (1-30). Only used when effect is "blur".
            Prop("blurIntensity") { (view: ExpoVideoEffectsView, intensity: Int) in
                view.processor.setBlurIntensity(intensity)
            }

            /// Background image URL. Only used when effect is "virtual-background".
            Prop("backgroundImage") { (view: ExpoVideoEffectsView, url: String?) in
                if let url = url, !url.isEmpty {
                    view.processor.setBackgroundImage(url: url)
                } else {
                    view.processor.clearBackgroundImage()
                }
            }

            /// Camera position: "front" or "back".
            Prop("cameraPosition") { (view: ExpoVideoEffectsView, position: String) in
                let currentPos = view.processor.camera.cameraPosition
                let desiredPos: AVCaptureDevice.Position = position == "back" ? .back : .front
                if currentPos != desiredPos {
                    view.processor.switchCamera()
                }
            }

            /// Whether the preview pipeline is enabled.
            Prop("enabled") { (view: ExpoVideoEffectsView, enabled: Bool) in
                if enabled {
                    view.startPipeline()
                } else {
                    view.stopPipeline()
                }
            }
        }
    }
}
