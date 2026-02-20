require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoUmbraCore'
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

  # Swift source files
  s.source_files = '**/*.swift'

  # Link the pre-compiled Rust static library via XCFramework.
  # After running scripts/build-mobile.sh ios, this bundles both:
  #   - aarch64-apple-ios (device)
  #   - aarch64-apple-ios-sim (simulator)
  s.vendored_frameworks = 'UmbraCore.xcframework'

  # System frameworks required by the Rust library
  s.frameworks = 'Security', 'SystemConfiguration'

  # Linker flags for the Rust static library
  # -lresolv: DNS resolution (used by libp2p)
  # -lSystem: macOS/iOS system library (libc)
  s.pod_target_xcconfig = {
    'OTHER_LDFLAGS' => '-lresolv -lc++',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}"',
  }
end
