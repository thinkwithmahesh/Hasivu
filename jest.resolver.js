/**
 * Jest Resolver for ESM and TypeScript modules
 */
const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = (path, options) => {
  // Handle TypeScript path mappings
  if (path.startsWith('@/') || path.startsWith('@shared/') || path.startsWith('@services/')) {
    const mappedPaths = pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    });

    for (const [pattern, replacement] of Object.entries(mappedPaths)) {
      const regex = new RegExp(pattern.replace('(.*)\\$', '(.*)'));
      if (regex.test(path)) {
        const resolvedPath = path.replace(
          regex,
          replacement[0].replace('<rootDir>', options.rootDir)
        );
        try {
          return options.defaultResolver(resolvedPath, options);
        } catch (e) {
          // Continue to default resolver if path mapping fails
        }
      }
    }
  }

  // Fallback to default resolver
  return options.defaultResolver(path, options);
};
