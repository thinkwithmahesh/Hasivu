
 * Jest Test Setup Configuration;
 * Global setup and teardown for all test suites;
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
// Global test configuration
global.testConfig = {}
};
// Initialize Prisma client for tests
global.prisma = new PrismaClient({}
    }
  }
});
// Test database setup
beforeAll(async (
  }
{}
  }
  // Run database migrations
  try {}
  }
{}
  }
  // Seed test data
  try {}
  }
{}
  }
}, 60000);
// Test cleanup
afterAll(async (
  }
{}
  }
  await global.prisma.$disconnect();
}, 30000);
// Reset database between test suites
beforeEach(async (
});
afterEach(async (
});
// Helper functions
async
  }
{}
    }
  }
}
async
      env: { ...process.env, DATABASE_URL: global.testConfig.dbUrl },
      stdio: 'inherit'
    });
    // Generate Prisma client
    execSync('npx prisma generate', {}
    });
  }
{}
  }
}
async
    where: { id: 'test-school-base' },
    update: {},
    create: {}
    }
  });
  // Create base test admin user
  await global.prisma.user.upsert({}
    where: { email: 'admin@testbase.com' },
    update: {},
    create: {}
    }
  });
  // Create base test student user
  await global.prisma.user.upsert({}
    where: { email: 'student@testbase.com' },
    update: {},
    create: {}
    }
  });
  // Create base test menu items
  await global.prisma.menuItem.upsert({}
    where: { id: 'test-menu-item-1' },
    update: {},
    create: {}
    }
  });
  await global.prisma.menuItem.upsert({}
    where: { id: 'test-menu-item-2' },
    update: {},
    create: {}
    }
  });
}
async
            { id: { startsWith: 'test-' } },
            { email: { contains: '@testbase.com' } },
            { email: { contains: '@test.com' } },
            { name: { contains: 'Test' } }
          ]
        }
      });
    }
{}
      console.warn(`Warning: Could not clean ${table}:``
      email: `testuser_${Date.now()}@test.com``
    throw new Error(`Condition not met within ${timeout}ms``
  originalConsoleLog(`[${timestamp}]``