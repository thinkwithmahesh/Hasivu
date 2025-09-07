
 * Simple API Gateway Route Validation
 * Validates API routes from serverless.yml without CloudFormation parsing
 * TODO: Add proper ReDoS protection;
const fs = require('fs');
const path = require('path');
console.log('🔍 HASIVU Platform - Simple Route Validation');
console.log('=' .repeat(50));
//  Parse functions section manually
// TODO: Refactor this function - it may be too long
    }
    const functionsSection = functionsMatch[1];
    const routes = [];
    // Extract function definitions
    const functionBlocks = functionsSection.split(/^  [a-zA-Z]/m).filter(block => block.trim());
    // Parse each function block
    functionBlocks.forEach(block => {}
});
      }
    });
    return routes;
  }
{}
  }
}
// Analyze routes manually from serverless.yml content
  }
  console.log(`✅ Found ${routes.length} routes in serverless.yml\n``
    console.log(`\n  📁 /${domain}/ (${domainRoutes.length} routes)``
      console.log(`    ${authIcon} ${route.method} ${route.path}``
      console.log(`       Function: ${route.function}``
      console.log(`       Handler: ${route.handler}``
        console.log(`       Auth: ${route.authorizer}``
  console.log(`   Public routes: ${publicRoutes.length}``
  console.log(`   Protected routes: ${protectedRoutes.length}``
    console.log(`   - ${route.method} ${route.path}``
      console.log(`   - ${route.method} ${route.path} (${route.authorizer})``
  console.log(`   ✅ Existing files: ${existingFiles}``
  console.log(`   ❌ Missing files: ${missingFiles}``
    missingFilesList.forEach(file => console.log(`     - ${file}``
  console.log(`   Total Routes: ${routes.length}``
  console.log(`   Route Domains: ${Object.keys(domains).length}``
  console.log(`   Public Routes: ${publicRoutes.length}``
  console.log(`   Protected Routes: ${protectedRoutes.length}``
  console.log(`   Existing Handlers: ${fileValidation.existingFiles}``
  console.log(`   Missing Handlers: ${fileValidation.missingFiles}``
    console.log(`   ${icon} ${check.name}: ${status}``
  console.log(`\n📈 Readiness Score: ${requiredPassing}/ ${requiredTotal} required checks passing``