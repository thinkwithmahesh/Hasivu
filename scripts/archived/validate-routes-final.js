
 * Final API Gateway Route Validation
 * Validates all API routes and configurations for deployment readiness

const fs = require('fs');
const path = require('path');
console.log('🔍 HASIVU Platform - API Gateway Route Validation');
console.log('=' .repeat(60));
//  Manually extract route information from serverless.yml
// TODO: Refactor this function - it may be too long
});
        }
        currentFunction = trimmed.replace(':', '');
        currentHandler = null;
        currentPath = null;
        currentMethod = null;
        currentAuthorizer = null;
        inHttpApi = false;
      }
      // Handler
      if (trimmed.startsWith('handler:')) {}
      }
      // HttpApi section
      if (trimmed === '- httpApi:') {}
      }
      // Path and method inside httpApi
      if (inHttpApi) {}
        }
        if (trimmed.startsWith('method:')) {}
        }
        if (trimmed.startsWith('authorizer:')) {}
        }
      }
      // End of httpApi section
      if (inHttpApi && line.match(/ ^    [a-zA-Z]/ ) && !trimmed.startsWith('path:') && !trimmed.startsWith('method:') && !trimmed.startsWith('authorizer:')) {}
      }
    }
    // Add the last function if it exists
    if (currentFunction && currentPath && currentMethod) {}
});
    }
    return routes;
  }
{}
  }
}
// Analyze the routes
  }
  console.log(`✅ Successfully extracted ${routes.length} routes\n``
    console.log(`\n  📁 / ${domain}/  (${domainRoutes.length} routes)``
      console.log(`    ${authIcon} ${route.method.padEnd(6)} ${route.path}``
  console.log(`   Public endpoints: ${publicRoutes.length}``
  console.log(`   Protected endpoints: ${protectedRoutes.length}``
    console.log(`     • ${route.method} ${route.path}``
      console.log(`     • ${route.method} ${route.path} (${route.authorizer})``
          route: `${route.method} ${route.path}``
  console.log(`   ✅ Existing handlers: ${existing}``
  console.log(`   ❌ Missing handlers: ${missing}``
      console.log(`     ❌ ${file} (${fn} - ${route})``
  console.log(`   Total API Routes: ${analysis.routes.length}``
  console.log(`   Feature Domains: ${Object.keys(analysis.domains).length}``
  console.log(`   Public Routes: ${analysis.publicRoutes.length}``
  console.log(`   Protected Routes: ${analysis.protectedRoutes.length}``
  console.log(`   Handler Files: ${handlerValidation.existing}/ ${handlerValidation.existing + handlerValidation.missing}``
    console.log(`   ${icon} ${check.name}: ${status}``
    console.log(`      ${check.details}``
  console.log(`\n📊 Score:``
  console.log(`   Required: ${requiredPassing}/ ${requiredTotal} ✅``
  console.log(`   Optional: ${optionalPassing}/ ${optionalTotal} ⭐``