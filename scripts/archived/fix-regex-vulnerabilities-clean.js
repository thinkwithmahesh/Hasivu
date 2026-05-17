#!/usr/bin/env node;
 * Script to fix ReDoS vulnerabilities by sanitizing regex patterns
 * Addresses dynamic RegExp creation vulnerabilities;
const fs = require('fs').promises;
const path = require('path');
// Files to exclude from scanning
const EXCLUDE_PATTERNS = []
];
async
      }
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {}
      }
{}
        });
      }
    }
  }
{}
    console.error(`Error scanning directory ${dirPath}:``
  console.log(`\n📁 Found ${files.length} JavaScript/TypeScript files to check``
        console.log(`🔧 Found dynamic RegExp in ${file.file}: ${match}``
        console.log(`✅ Updated ${file.file}``
        console.error(`❌ Error updating ${file.file}:``
  console.log(`🔧 ${fixesCount} potential ReDoS vulnerabilities addressed``