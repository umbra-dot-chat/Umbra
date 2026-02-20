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

  # Link the pre-compiled Rust static library
  # After running scripts/build-mobile.sh, the library will be at:
  #   packages/umbra-core/target/aarch64-apple-ios/release/libumbra_core.a (device)
  #   packages/umbra-core/target/aarch64-apple-ios-sim/release/libumbra_core.a (simulator)
  #
  # For development, create a universal (fat) library or use xcframework.
  # The vendored_libraries path is relative to this podspec.
  s.vendored_libraries = 'libumbra_core.a'

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
