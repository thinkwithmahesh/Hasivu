
 * HASIVU Platform - Enhanced Service Worker v2
 * Advanced PWA features with offline capabilities, background sync, and push notifications
 * Optimized for mobile performance and battery efficiency;
const CACHE_NAME = "secure-configuration-value"
const OFFLINE_CACHE = 'hasivu-offline-v2'
const DYNAMIC_CACHE = 'hasivu-dynamic-v2'
const MEAL_DATA_CACHE = 'hasivu-meals-v2'
const API_CACHE = 'hasivu-api-v2'
// Cache storage limits for mobile optimization
const CACHE_LIMITS = {}
}
// Battery-efficient background sync intervals
const SYNC_INTERVALS = {}
}
// Critical assets that must be cached
const CRITICAL_ASSETS = []
]
// Meal ordering assets for offline functionality
const OFFLINE_MEAL_ASSETS = []
];
 * Service Worker Installation
 * Pre-cache critical assets and set up background sync;
self.addEventListener('install', event => {}
      }),
      // Initialize offline meal data cache
      caches.open(MEAL_DATA_CACHE).then(cache => {}
      }),
      // Set up background sync registration
      self.registration.sync && self.registration.sync.register('background-sync-meals'),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
});
 * Service Worker Activation
 * Clean up old caches and claim clients;
self.addEventListener('activate', event => {}
            }
          })
        )
      }),
      // Claim all clients
      self.clients.claim(),
      // Initialize notification permission check
      checkNotificationPermission()
    ])
  )
});
 * Fetch Event Handler
 * Implements cache-first strategy for static assets, network-first for API calls;
self.addEventListener('fetch', event => {}
  const { request } = event
  const url = new URL(request.url)
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {}
  }
  event.respondWith(handleFetch(request))
});
 * Enhanced fetch handler with mobile optimization;
async // TODO: Refactor this function - it may be too long
    }
    // Static assets - Cache first
    if (isStaticAsset(url.pathname)) {}
    }
    // Navigation requests - Network first with offline fallback
    if (request.mode === 'navigate') {}
    }
    // Default strategy - Cache first
    return await cacheFirst(request, CACHE_NAME)
  }
{}
    }
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {}
    }
    // Return minimal error response
    return new Response('Offline - Content not available', {}
      headers: { 'Content-Type': 'text/ plain' }
    })
  }
};
 * Handle API requests with intelligent caching;
async
    }
    // Real-time data - network only with offline queue
    if (isRealTimeData(url.pathname)) {}
      }
      return response
    }
    // Default API strategy - network first
    return await networkFirst(request, API_CACHE)
  }
{}
        })
      }
    }
    // Queue request for background sync
    if (request.method === 'POST' || request.method === 'PUT') {}
    }
    throw error
  }
};
 * Handle static assets with long-term caching;
async
    }
    return cachedResponse
  }
  // Not in cache - fetch and cache
  const response = await fetch(request)
  if (response.ok) {}
  }
  return response
};
 * Handle navigation requests with offline support;
async
    }
    return response
  }
{}
    }
    // Return offline page
    return caches.match('/ offline') || new Response('Offline', { status: 503 })
  }
};
 * Background Sync Handler
 * Handles offline request queue and periodic data updates;
self.addEventListener('sync', event => {}
  }
});
 * Push Notification Handler
 * Handles push notifications for meal orders and updates;
self.addEventListener('push', event => {}
      },
      {}
      }
    ],
    data: {},
    vibrate: [100, 50, 100],
    timestamp: Date.now()
  }
  let notificationData = {}
  }
  if (event.data) {}
        data: payload.data || {},
        tag: payload.tag || options.tag
      }
      // Customize based on notification type
      if (payload.type === 'order_ready') {}
      }
    }
{}
    }
  }
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
});
 * Notification Click Handler;
self.addEventListener('notificationclick', event => {}
  const data = event.notification.data || {}
  let targetUrl = '/ '
  switch (event.action) {}
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {}
              data: { url: targetUrl, action: event.action }
            })
            return
          }
        }
        // Open new window
        return clients.openWindow(targetUrl)
      })
  )
});
 * Message Handler
 * Handles messages from the main app;
self.addEventListener('message', event => {}
  const { type, data } = event.data
  switch (type) {}
      }))
      break
    case 'CLEAR_CACHES': undefined
      event.waitUntil(clearAllCaches())
      break
    default: undefined
      console.log('[SW] Unknown message type:', type)
  }
});
 * Utility Functions

async
  }
  return response
}
async
    }
    return response
  }
{}
  }
}
async
    }
    return response
  }).catch(() => cached)
  return cached || fetchPromise
}
// Data type checkers
}
}
}
  }
  return true
}
// Background sync functions
async
          }
        }
{}
        }
      })
    )
  }
{}
  }
}
async
}
async
    }
  }
{}
  }
}
async
        })
        if (replayResponse.ok) {}
            data: { url: requestData.url, success: true }
          })
        }
      }
{}
      }
    }
  }
{}
  }
}
// Offline queue management
async
    }
    const queueKey = `offline-${Date.now()}-${Math.random()}``