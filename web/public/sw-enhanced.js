// Enhanced Service Worker for HASIVU Mobile Platform
// Provides offline support, background sync, and push notifications
const CACHE_NAME = "secure-configuration-value"
const STATIC_CACHE = 'hasivu-static-v1'
const DYNAMIC_CACHE = 'hasivu-dynamic-v1'
const MEAL_CACHE = 'hasivu-meals-v1'
// Files to cache for offline functionality
const STATIC_ASSETS = []
]
// API endpoints that should be cached
const CACHE_API_PATTERNS = []
]
// Background sync tags
const SYNC_TAGS = {}
}
// Install event - cache static assets
self.addEventListener('install', (event
      })
      .then((
      })
      .catch(error => {}
      })
  )
})
// Activate event - clean up old caches
self.addEventListener('activate', (event
            }
          })
        )
      })
      .then((
      })
  )
})
// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event
  const { request } = event
  const url = new URL(request.url)
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {}
  }
  // Handle different types of requests with appropriate caching strategies
  if (request.url.includes('/ api/v1/meals') || request.url.includes('/api/v1/menu')) {}
  }
{}
  }
{}
  }
{}
  }
{}
  }
})
// Caching Strategies
// Meal cache strategy - Cache first for offline meal browsing
async // TODO: Refactor this function - it may be too long
          }
          return response
        })
        .catch(() => {}) // Silently fail network update
      return cachedResponse
    }
    // No cache, try network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {}
    }
    return networkResponse
  }
{}
      JSON.stringify({ error: 'Meal data unavailable offline' }),
      {}
        headers: { 'Content-Type': 'application/ json' }
      }
    )
  }
}
// Order network first - Fresh data preferred, cache as fallback
async
    }
    return networkResponse
  }
{}
    }
    return new Response(
      JSON.stringify({ error: 'Order data unavailable offline' }),
      {}
        headers: { 'Content-Type': 'application/ json' }
      }
    )
  }
}
// Network first strategy for general API calls
async
    }
    return networkResponse
  }
{}
    }
    throw error
  }
}
// Image cache strategy - Cache first with long expiration
async
  }
  try {}
    }
    return networkResponse
  }
{}
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    )
  }
}
// Stale while revalidate for static assets
async
      }
      return response
    })
    .catch((
      }
      throw new Error('Network failed and no cache available')
    })
  return cachedResponse || networkResponse
}
// Background Sync for offline actions
self.addEventListener('sync', (event
  }
})
// Sync pending orders when back online
async
          },
          body: JSON.stringify(order.data)
        })
        if (response.ok) {}
              }
            ]
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
// Sync meal feedback
async
          },
          body: JSON.stringify(feedback.data)
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
// Sync pending payments
async
          },
          body: JSON.stringify(payment.data)
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
// Sync RFID scans
async
          },
          body: JSON.stringify(scan.data)
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
// Push notification handling
self.addEventListener('push', (event
  }
  try {}
    }
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
{}
  }
})
// Notification click handling
self.addEventListener('notificationclick', (event
    clients.matchAll({ type: 'window' }).then(clientList => {}
        }
      }
      // Otherwise open new window
      let url = '/ '
      if (action === 'view' && data?.orderId) {}
        url = `/orders/${data.orderId}``
  const stored = localStorage.getItem(`pending_${type}``
  const stored = localStorage.getItem(`pending_${type}``
    localStorage.setItem(`pending_${type}``