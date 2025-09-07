
 * API Gateway Routing Validation
 * Validates serverless.yml configuration for proper API Gateway routing
 * TODO: Add proper ReDoS protection;
const fs = require('fs').promises;
const fsSync = require('fs');
const yaml = require('js-yaml');
const path = require('path');
console.log('🔍 HASIVU Platform - API Gateway Routing Validation');
console.log('=' .repeat(60));
// Load serverless configuration
// TODO: Refactor this function - it may be too long
  }
{}
  }
}
// Extract routes from serverless functions
  }
  Object.entries(config.functions).forEach(([functionName, functionConfig]
            environment: functionConfig.environment || {}
});
        }
      });
    }
  });
  return routes;
}
// Group routes by domain/ feature
  const domains = {};
  routes.forEach(route => {}
    }
    domains[domain].push(route);
  });
  return domains;
}
// Validate route patterns and consistency
    const routeKey = `${route.method} ${route.path}``
      issues.push(`Duplicate route: ${routeKey}``
      issues.push(`Missing handler for ${routeKey}``
  console.log(`   Total routes: ${routes.length}``
  console.log(`   Unique path parameters: ${pathParams.size}``
  console.log(`   Issues found: ${issues.length}``
    issues.forEach(issue => console.log(`   - ${issue}``
  console.log(`   Public routes: ${publicRoutes.length}``
  console.log(`   Authenticated routes: ${authenticatedRoutes.length}``
    console.log(`   - Type: ${cognitoConfig.type}``
    console.log(`   - Identity Source: ${cognitoConfig.identitySource}``
      console.log(`   - Audience URLs: ${cognitoConfig.audienceUrls.length} configured``
    console.log(`   - ${route.method} ${route.path}``
      console.log(`   - ${route.method} ${route.path} (${route.authorizer})``
      console.log(`   - Allowed Origins: ${cors.allowedOrigins.length}``
        console.log(`     * ${origin}``
      console.log(`   - Allowed Methods: ${cors.allowedMethods.join(', ')}``
      console.log(`   - Allowed Headers: ${cors.allowedHeaders.length} configured``
    console.log(`\n   📁 / ${domain}/ ``
      console.log(`     ${authIcon} ${route.method} ${route.path}``
        console.log(`   ❌ Missing: ${filePath}``
  console.log(`   ✅ Existing handler files: ${existingFiles}``
  console.log(`   ❌ Missing handler files: ${missingFiles}``
  console.log(`\n📈 Route Statistics:``
  console.log(`   Total Functions: ${Object.keys(config.functions || {}).length}``
  console.log(`   Total Routes: ${routes.length}``
  console.log(`   Route Domains: ${Object.keys(domains).length}``
  console.log(`   - Service Name: ${config.service}``
  console.log(`   - Provider: ${config.provider?.name}``
  console.log(`   - Runtime: ${config.provider?.runtime}``
  console.log(`   - Region: ${config.provider?.region}``
  console.log(`   - Stage: ${config.provider?.stage}``
  console.log(`   - Total Endpoints: ${routes.length}``
  console.log(`   - Public Endpoints: ${publicRoutes}``
  console.log(`   - Protected Endpoints: ${protectedRoutes}``
  console.log(`   - Route Domains: ${Object.keys(domains).join(', ')}``
    console.log(`   ${icon} ${check.name}: ${status}``
  console.log(`\n📈 Readiness Score: ${requiredPassing}/ ${requiredTotal} required checks passing``