/**
 * Jest mock for binary asset imports (images, fonts, etc.)
 *
 * Returns a numeric stub (matching React Native's require() behavior
 * for static assets) so components that import .png/.jpg files
 * don't crash during testing.
 */
module.exports = 1;
