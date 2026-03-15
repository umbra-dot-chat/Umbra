/**
 * Custom Jest resolver that handles Node.js package "exports" field
 * for @noble/* v1 packages (which use subpath exports like ./ed25519).
 */

'use strict';

module.exports = (request, options) => {
  // For @noble/* subpath imports without .js extension, try adding .js
  // so the file resolves against the package's exports map.
  const nobleMatch = request.match(/^@noble\/(curves|hashes|ciphers)\/.+$/);
  if (nobleMatch && !request.endsWith('.js')) {
    try {
      return options.defaultResolver(request + '.js', options);
    } catch {
      // fall through
    }
  }

  return options.defaultResolver(request, options);
};
