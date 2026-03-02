/**
 * Expo config plugin: suppress noisy iOS system logs in debug builds.
 *
 * Sets OS_ACTIVITY_MODE=disable in the Xcode scheme environment variables,
 * which silences CoreHaptics, UIKitCore, and other system-level warnings
 * that clutter the Metro console (especially in the iOS Simulator).
 */
const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withSuppressOSLogs(config) {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const schemePath = path.join(
      projectRoot,
      'ios',
      `${config.modRequest.projectName}.xcodeproj`,
      'xcshareddata',
      'xcschemes',
      `${config.modRequest.projectName}.xcscheme`
    );

    if (!fs.existsSync(schemePath)) return config;

    let scheme = fs.readFileSync(schemePath, 'utf8');

    // Skip if already present
    if (scheme.includes('OS_ACTIVITY_MODE')) return config;

    // Insert EnvironmentVariables block before </LaunchAction>
    const envBlock = `      <EnvironmentVariables>
         <EnvironmentVariable
            key = "OS_ACTIVITY_MODE"
            value = "disable"
            isEnabled = "YES">
         </EnvironmentVariable>
      </EnvironmentVariables>
   </LaunchAction>`;

    scheme = scheme.replace('   </LaunchAction>', envBlock);
    fs.writeFileSync(schemePath, scheme, 'utf8');

    return config;
  });
}

module.exports = withSuppressOSLogs;
