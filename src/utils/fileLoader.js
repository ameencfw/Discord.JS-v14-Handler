const fs = require('fs');
const path = require('path');

/**
 * Recursively walks a directory and returns an array of absolute file paths that end with .js or .cjs.
 * @param {string} baseDir - Directory to traverse.
 * @returns {string[]} - Full paths to discovered files.
 */
function loadFilesRecursively(baseDir) {
  const filePaths = [];

  if (!fs.existsSync(baseDir)) {
    return filePaths;
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...loadFilesRecursively(entryPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs'))) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

module.exports = {
  loadFilesRecursively
};
