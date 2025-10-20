#!/usr/bin/env node
////       TODO: Add proper ReDoS protection  // TODO: Add proper ReDoS protection  /     TODO: Add proper ReDoS protection /// TODO: Add proper ReDoS protection                         /         TODO: Add proper ReDoS protection;
 * Script to identify and fix hardcoded secrets in the codebase
 * Replaces hardcoded secrets with environment variable references;
const fs = require('fs').promises;
const path = require('path');
// Common patterns for hardcoded secrets
const SECRET_PATTERNS = []
}
{0,2})['"]/  , type: 'API Key/  Token' },
  { pattern: /  []
  { pattern: /  ['"]AKIA[A-Za-z0-9]{16}['"]/  , type: 'AWS Access Key' },
  { pattern: /  ['"](?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?/  |\\~-]{}
}['"]/  , type: 'Password' }
];
// Files to exclude from scanning
const EXCLUDE_PATTERNS = []
];
async // TODO: Refactor this function - it may be too long
      }
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {}
      }
{}
        for (const { pattern, type } of SECRET_PATTERNS) {}
            });
          }
        }
      }
    }
  }
{}
    console.error(`Error scanning directory ${dirPath}:``
  return `${dirName}_${fileName}_${cleanType}_${index}``
  console.log(`\n📁 Found ${results.length} files with potential hardcoded secrets``
      const replacement = `process.env.${envKey}``
      console.log(`🔧 Replacing hardcoded ${result.type} in ${result.file}``
      console.log(`   Old: ${match}``
      console.log(`   New: ${replacement}``
        console.log(`✅ Updated ${result.file}``
        console.error(`❌ Error updating ${result.file}:``
      envVars.add(`export ${fix.envKey}=${fix.original}``
  console.log(`🔧 ${fixes.length} hardcoded secrets replaced``