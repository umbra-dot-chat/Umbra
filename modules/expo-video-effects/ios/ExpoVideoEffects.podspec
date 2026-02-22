require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoVideoEffects'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'Umbra'
  s.homepage       = 'https://github.com/umbra'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'

  # System frameworks for camera capture, person segmentation, and GPU compositing
  s.frameworks = 'AVFoundation', 'Vision', 'CoreImage', 'Metal', 'MetalKit', 'Accelerate'
end
