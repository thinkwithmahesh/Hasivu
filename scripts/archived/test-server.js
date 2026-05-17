
 * HASIVU Platform - Simple Test Server
 * Mock API endpoints for TestSprite testing

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
//  Simple in-memory store for last logged-in user (for test compatibility)
let lastLoggedInUser = {}
};
// Token blacklist for logout functionality
const blacklistedTokens = new Set();
// Middleware
app.use(helmet());
app.use(cors({}
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/ health', (req, res
});
});
// Detailed health check
app.get('/  health/ detailed', (req, res
}
}
});
});
// Authentication Mock Endpoints - Primary implementation
app.post('/ api/                 v1/auth/register', (req, res
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {}
});
  }
  // Store user data for later use
  lastLoggedInUser = {}
  };
  // Generate unique token for registration (TestSprite TC001 compatibility)
  const uniqueToken = `mock-access-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}``
  const uniqueToken = `mock-access-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}``
  const finalCardNumber = cardNumber || `RFID-${Date.now()}``