# PWA & Offline-First Guide for Hostel Management System

This guide explains how to convert your Hostel Management System into a Progressive Web App (PWA) with offline support and offline-first data sync.

---

## Overview

**What you'll achieve:**
1. **PWA** – Installable on mobile/desktop, works offline, cached assets
2. **Offline-first** – Add students, staff, fees, etc. when offline
3. **Background sync** – When internet returns, pending data uploads to the database automatically

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │  API Layer   │  │  Offline Queue (IDB)     │  │
│  │  (Students, │──│  (intercept  │──│  - Pending creates      │  │
│  │   Staff...) │  │   requests) │  │  - Pending updates      │  │
│  └─────────────┘  └──────────────┘  │  - Pending deletes      │  │
│         │                 │         └─────────────────────────┘  │
│         │                 │                      │               │
│         ▼                 ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Service Worker (vite-plugin-pwa)                 ││
│  │  - Cache static assets (HTML, JS, CSS)                       ││
│  │  - Background Sync API (retry failed requests when online)   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                    Online? ──┼── Sync queue to server
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Express + PostgreSQL)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Add PWA Plugin & Manifest

**Install:**
```bash
cd client
npm install vite-plugin-pwa workbox-window -D
```

**Update `vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',  // or 'prompt' to ask user
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Hostel Management System',
        short_name: 'Hostel',
        description: 'Manage hostel residents, staff, fees and more',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 }
            }
          }
        ]
      }
    })
  ],
  // ... rest of config
})
```

**Create `client/public/manifest.json`** (or let VitePWA generate it) and add app icons (192x192, 512x512 PNG) to `client/public/`.

---

### Step 2: Offline Queue with IndexedDB

**Install Dexie (IndexedDB wrapper):**
```bash
cd client
npm install dexie
```

**Create `client/src/utils/offlineQueue.js`:**
```javascript
import Dexie from 'dexie'

const db = new Dexie('HostelOfflineDB')
db.version(1).stores({
  pendingRequests: '++id, method, url, timestamp, retries',
  cachedData: 'key, data, timestamp'
})

export const addToQueue = async (method, url, data = null, params = null) => {
  return db.pendingRequests.add({
    method,
    url,
    data,
    params: params ? JSON.stringify(params) : null,
    timestamp: Date.now(),
    retries: 0
  })
}

export const getPendingRequests = () => db.pendingRequests.orderBy('timestamp').toArray()

export const removeFromQueue = (id) => db.pendingRequests.delete(id)

export const cacheData = (key, data) => {
  return db.cachedData.put({ key, data, timestamp: Date.now() })
}

export const getCachedData = (key) => db.cachedData.get(key)

export const incrementRetries = (id) => {
  return db.pendingRequests.update(id, { retries: Dexie.maxKey })
}

export default db
```

---

### Step 3: API Layer with Offline Interception

**Create `client/src/config/apiWithOffline.js`** – a wrapper that:
- Intercepts all API calls
- If **online**: send to server normally
- If **offline**: 
  - For **GET**: return cached data from IndexedDB (or empty array)
  - For **POST/PUT/DELETE**: add to queue, return success with local ID

**Pseudocode:**
```javascript
// Check online status
const isOnline = () => navigator.onLine

// Intercept api.post, api.put, api.delete
// When offline: addToQueue('POST', '/api/students', body)
//               cache locally with temp ID
//               return { data: { ...body, id: 'temp-123' } }

// When online: process queue, sync to server
```

---

### Step 4: Sync Service

**Create `client/src/services/syncService.js`:**
```javascript
import api from '../config/api'
import { getPendingRequests, removeFromQueue } from '../utils/offlineQueue'

export const syncPendingRequests = async () => {
  const pending = await getPendingRequests()
  for (const req of pending) {
    try {
      if (req.method === 'POST') {
        await api.post(req.url, JSON.parse(req.data))
      } else if (req.method === 'PUT') {
        await api.put(req.url, JSON.parse(req.data))
      } else if (req.method === 'DELETE') {
        await api.delete(req.url)
      }
      await removeFromQueue(req.id)
    } catch (err) {
      console.error('Sync failed for', req.url, err)
      // Keep in queue for next sync
    }
  }
}
```

---

### Step 5: Online/Offline Detection & Auto-Sync

**Create `client/src/context/OfflineContext.jsx`:**
```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import { syncPendingRequests } from '../services/syncService'

const OfflineContext = createContext()

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncPendingRequests()
      setPendingCount(0)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, setPendingCount }}>
      {children}
    </OfflineContext.Provider>
  )
}

export const useOffline = () => useContext(OfflineContext)
```

---

### Step 6: UI Indicators

- **Offline banner**: "You're offline. Data will sync when connected."
- **Pending count badge**: "3 items waiting to sync"
- **Sync status**: Show when sync completes

---

## Key Challenges & Solutions

### 1. **Conflict Resolution**
When the same record is edited offline and online, you need a strategy:
- **Last-write-wins**: Simpler; use `updated_at` timestamp
- **Merge**: Complex; requires field-level merge logic
- **Recommendation**: Start with last-write-wins

### 2. **File Uploads (Documents, Photos)**
- Store file as base64 in IndexedDB when offline (you already use base64 for photos)
- On sync, convert and upload via multipart/form-data
- Large files: consider size limit (e.g. 5MB) for offline queue

### 3. **Authentication**
- User must be logged in before going offline (token in localStorage)
- Token expiry: when back online, if 401, redirect to login and discard unsynced data (or prompt to re-login)

### 4. **Read-Only vs Write**
- **GET requests**: Cache responses in IndexedDB; serve stale when offline
- **POST/PUT/DELETE**: Queue and sync when online

### 5. **Which Entities to Support Offline?**
Prioritize:
- Students (create, edit)
- Staff (create, edit)
- Fees (create, mark paid)
- Attendance (record)
- Visitors (check-in/out)
- Leaves (create, approve)
- Complaints (create)

Skip or defer:
- Reports (need server aggregation)
- Documents (file upload complexity)
- Real-time features

---

## Implementation Order

| Phase | Task | Effort |
|-------|------|--------|
| 1 | Add vite-plugin-pwa, manifest, icons | 1–2 hrs |
| 2 | Create offlineQueue (Dexie), basic structure | 2–3 hrs |
| 3 | Wrap API layer to queue writes when offline | 3–4 hrs |
| 4 | Implement sync service | 2–3 hrs |
| 5 | OfflineContext + online/offline listeners | 1 hr |
| 6 | Cache GET responses for key endpoints | 2–3 hrs |
| 7 | Update each page to use cached data when offline | 4–6 hrs |
| 8 | UI: offline banner, pending badge | 1–2 hrs |
| 9 | Testing & edge cases | 4+ hrs |

**Total estimate: 20–30 hours**

---

## Alternative: Simpler Approach

If full offline-first is too much initially:

1. **PWA only** (no offline data): Add vite-plugin-pwa for installability and asset caching. App shell loads offline, but data requires internet.
2. **Offline queue only for Students**: Implement queue + sync just for the Students page as a proof of concept.
3. **Use existing tools**: Consider [Workbox](https://developer.chrome.com/docs/workbox/) Background Sync or [PouchDB](https://pouchdb.com/) + CouchDB for full offline sync (larger backend change).

---

## Server-Side Considerations

Your Express server needs no changes for basic offline sync. The client will:
- Queue requests when offline
- Send them when online (same API, same validation)

**Optional server improvements:**
- **Bulk sync endpoint**: `POST /api/sync` accepting an array of operations (reduces round-trips)
- **Conflict detection**: Return 409 if `updated_at` changed since client's version
- **Idempotency keys**: For duplicate sync prevention

---

## Testing Offline Mode

1. Chrome DevTools → Network → Throttling → "Offline"
2. Or: `Application` tab → Service Workers → "Offline" checkbox
3. Add data, go online, verify sync

---

## Summary

| Component | Purpose |
|-----------|---------|
| **vite-plugin-pwa** | Service worker, manifest, installability |
| **Dexie / IndexedDB** | Store pending requests + cached GET data |
| **API wrapper** | Queue writes when offline, serve cache for reads |
| **syncService** | Process queue when `navigator.onLine` |
| **OfflineContext** | Global online state, trigger sync on reconnect |
| **UI** | Offline banner, pending count, sync status |

Start with Phase 1 (PWA) and Phase 2 (queue structure), then add sync and per-page support incrementally.
