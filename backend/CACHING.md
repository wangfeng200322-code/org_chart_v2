# Caching Implementation

The org-chart application implements a two-tier caching system to improve performance and reduce database load.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│  In-Memory LRU  │    │      Redis       │
│     Cache       │    │     Cache        │
│                 │    │                  │
│  Fast local     │    │  Shared cache    │
│  cache for      │    │  for larger      │
│  individual     │    │  objects         │
│  records        │    │                  │
└─────────┬───────┘    └────────┬─────────┘
          │                     │
          └─────────────────────┘
                    │
           ┌────────┴────────┐
           │  Cache Service  │
           │   (Abstraction) │
           └─────────────────┘
```

## Implementation Details

### CacheService

The [cacheService.js](file:///e:/AI/org_chart_temp/org_chart_v2/backend/src/services/cacheService.js) file provides a unified interface for caching operations. It implements:

1. **Local LRU Cache**: Uses JavaScript Map with a maximum size limit
2. **Redis Cache**: Optional Redis backend for shared caching
3. **Automatic Fallback**: Falls back to local cache if Redis is not configured

### Cache Keys

The application uses descriptive cache keys to make invalidation easier:

- `employee:{email}` - Individual employee records
- `orgchart:{email}:{depth}` - Organization charts
- `search:{query}:{limit}:{offset}` - Search results
- `middleware:{url}` - Responses cached by middleware

### TTL Strategy

Different cache entries have different TTL values based on how frequently they change:

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| Employee data | 5 minutes | Changes infrequently |
| Organization charts | 2 minutes | May change more frequently |
| Search results | 2 minutes | May change with new imports |
| Middleware cached responses | 5 minutes | Generic default |

## Configuration

To enable Redis caching, set the `REDIS_URL` environment variable:

```
REDIS_URL=redis://localhost:6379
```

If `REDIS_URL` is not set, the application will only use the in-memory cache.

## Cache Invalidation

Cache invalidation occurs in the following scenarios:

1. **CSV Import**: All cache is flushed when new data is imported
2. **Individual Record Access**: No invalidation (TTL-based expiration)
3. **Manual Invalidation**: Available through the cache service API

## Performance Benefits

The caching layer provides several performance benefits:

1. **Reduced Database Load**: Frequently accessed data served from cache
2. **Improved Response Times**: In-memory access is much faster than database queries
3. **Scalability**: Redis can be scaled independently and shared across multiple instances
4. **Flexibility**: Cache service abstracts the caching mechanism for easy modifications

## Testing

Cache functionality is verified through tests in [tests/cacheService.test.js](file:///e:/AI/org_chart_temp/org_chart_v2/backend/tests/cacheService.test.js).

To run cache tests:
```bash
npm test tests/cacheService.test.js
```