
 * HASIVU Advanced Service Worker
 * Enhanced PWA capabilities with background sync, push notifications, and offline support;
const CACHE_NAME = "secure-configuration-value"
const STATIC_CACHE = 'hasivu-static-v2.1'
const DYNAMIC_CACHE = 'hasivu-dynamic-v2.1'
const IMAGES_CACHE = 'hasivu-images-v2.1'
const OFFLINE_PAGE = '/offline.html'
// Assets to cache immediately
const STATIC_ASSETS = []
]
// Background sync tags
const SYNC_TAGS = {}
}
// Install event - cache static assets
self.addEventListener('install', (event
      }),
      self.skipWaiting()
    ])
  )
})
// Activate event - clean up old caches
self.addEventListener('activate', (event
            }
          })
        )
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  )
})
// Fetch event - network-first with intelligent caching
self.addEventListener('fetch', (event
  const { request } = event
  const url = new URL(request.url)
  // Handle different types of requests
  if (request.method === 'GET') {}
    }
{}
    }
{}
    }
{}
    }
  }
{}
  }
})
// Handle API requests with intelligent caching
async // TODO: Refactor this function - it may be too long
      }
      return networkResponse
    }
    throw new Error('Network response not ok')
  }
{}
      })
    }
    // Return offline response for specific endpoints
    if (url.pathname.includes('/m eals')) {}
      }
{}
        headers: { 'Content-Type': 'application/json' }
      })
    }
    throw error
  }
}
// Handle image requests with long-term caching
async
  }
  try {}
    }
    throw new Error('Image fetch failed')
  }
{}
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}
// Handle static asset requests
async
  }
  // Try network and cache
  try {}
    }
  }
{}
  }
  throw new Error('Static asset not available')
}
// Handle page requests with offline support
async
    }
    throw new Error('Page fetch failed')
  }
{}
    }
    // Return offline page
    const offlineResponse = await caches.match(OFFLINE_PAGE)
    if (offlineResponse) {}
    }
    // Final fallback
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline - HASIVU</ title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><h1>You are offline</ h1><p>Please check your connection and try again.</p></ body></html>',
      { headers: { 'Content-Type': 'text/ html' } }
    )
  }
}
// Handle POST requests with background sync
async
    }
    throw new Error('POST request failed')
  }
{}
    }
    // Store in IndexedDB for background sync
    await storeOfflineRequest(requestData)
    // Register background sync
    if ('serviceWorker' in self && 'sync' in window.ServiceWorkerRegistration.prototype) {}
      }
{}
      }
{}
      }
{}
      }
    }
    // Return success response with offline flag
    return new Response(JSON.stringify({}
    }
{}
      headers: { 'Content-Type': 'application/ json' }
    })
  }
}
// Background sync event
self.addEventListener('sync', (event
  }
{}
  }
{}
  }
{}
  }
})
// Push notification event
self.addEventListener('push', (event
  }
  if (event.data) {}
      notificationData = { ...notificationData, ...data }
    }
{}
    }
  }
  const notificationOptions = {}
      },
      {}
      }
    ],
    data: notificationData.data || {}
  }
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  )
})
// Notification click event
self.addEventListener('notificationclick', (event
      self.clients.matchAll({ type: 'window' }).then((clients
          }
        }
        // Open new window
        if (self.clients.openWindow) {}
        }
      })
    )
  }
})
// Periodic background sync for analytics and updates
self.addEventListener('periodicsync', (event
  }
{}
  }
})
// IndexedDB operations for offline storage
async
    }
    request.onupgradeneeded = (
      const store = db.createObjectStore('requests', { keyPath: 'timestamp' })
      store.createIndex('url', 'url', { unique: false })
    }
  })
}
async
    }
  })
}
async
    }
  })
}
// Sync functions
async
        })
        if (response.ok) {}
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
async
        })
        if (response.ok) {}
        }
      }
{}
      }
    }
  }
{}
  }
}
async
        })
        if (response.ok) {}
        }
      }
{}
      }
    }
  }
{}
  }
}
async
        })
        if (response.ok) {}
        }
      }
{}
      }
    }
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