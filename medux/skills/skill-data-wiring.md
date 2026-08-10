# Skill: Data Wiring (media-react)

## 1. When to Use This Skill
Use this skill when you are building any React UI component that fetches data from the Pexels API, handles pagination, tracks analytics, or requires access to the `media-react` library.

## 2. Provider Setup

The `media-react` library exposes a `MediaProvider` component that initializes the context needed by all the hooks.

**Importing:**
```tsx
import { MediaProvider } from 'media-react';
```

**Configuration Options:**
The provider expects a `config` object which must include your Pexels API key. This key should generally come from environment variables.

**API Key from Env:**
In Vite, environment variables are accessed via `import.meta.env.VITE_PEXELS_API_KEY`.

**Example:**
```tsx
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

function App() {
  return (
    <MediaProvider config={{ apiKey: PEXELS_API_KEY }}>
      {/* Your app components */}
    </MediaProvider>
  );
}
```

## 3. Hook Reference Table

The following hooks are provided by `media-react`:

| Hook Name | Purpose | Key Arguments | Return Value |
| --- | --- | --- | --- |
| `useSearchPhotos` | Search photos | `query`, `perPage` | `{ photos, loading, error, hasMore, loadMore }` |
| `useSearchVideos` | Search videos | `query`, `perPage` | `{ videos, loading, error, hasMore, loadMore }` |
| `useCuratedPhotos`| Get curated photos| `perPage` | `{ photos, loading, error, hasMore, loadMore }` |
| `usePopularVideos`| Get popular videos| `perPage` | `{ videos, loading, error, hasMore, loadMore }` |
| `usePhoto` | Fetch a single photo | `id` | `{ photo, loading, error }` |
| `useTrackDownload`| Track a download event | None | `(photoId) => Promise<void>` |
| `useMediaEvent` | Subscribe to global events | `eventName`, `callback` | None |

## 4. Paginated Hooks Contract

Hooks that return lists of data (like `useSearchPhotos` and `useSearchVideos`) follow a standard paginated contract.

- `hasMore`: A boolean indicating if there is another page of data available.
- `loadMore`: A function to request the next page. Call this only when `hasMore` is true and `loading` is false.
- **Stale Request Handling**: The hooks manage cancellation and stale responses internally when the query changes.

## 5. Error & Loading State Patterns

Always handle `loading` and `error` states elegantly in the UI.

**Example Pattern:**
```tsx
if (error) {
  return <div className="error">Failed to load: {error.message}</div>;
}

if (!items.length && loading) {
  return <div className="loading">Loading initial data...</div>;
}

if (!items.length && !loading) {
  return <div className="empty">No results found.</div>;
}
```

## 6. Event Subscription with `useMediaEvent`

`useMediaEvent` allows you to subscribe to global analytics events like `view` and `download`.

**Usage:**
```tsx
import { useMediaEvent } from 'media-react';

function AnalyticsTracker() {
  useMediaEvent('view', ({ item, timestamp }) => {
    console.log('User viewed item:', item.id, 'at', timestamp);
  });
  
  useMediaEvent('download', ({ item, timestamp }) => {
    console.log('User downloaded item:', item.id, 'at', timestamp);
  });

  return null;
}
```

## 7. Anti-patterns & Callouts

> [!WARNING]
> Do **NOT** use `media-react` directly in the underlying UI components (like a simple button or basic layout wrapper).

- **Architecture Rule**: Only the app-level component tree or feature-level containers should import `media-react`. Dumb UI components should receive data as props.
- **Mistake**: Calling `loadMore` continuously in a loop or effect without checking `hasMore` or `loading`.

## 8. Minimal Working Examples

### Search Photos Example
```tsx
import { useSearchPhotos } from 'media-react';

function PhotoSearch({ query }) {
  const { photos, loading, error, hasMore, loadMore } = useSearchPhotos(query, 15);

  if (error) return <div>Error: {error.message}</div>;
  if (!photos.length && loading) return <div>Loading...</div>;
  if (!photos.length) return <div>No photos found.</div>;

  return (
    <div>
      {photos.map(photo => (
        <img key={photo.id} src={photo.src.small} alt={photo.alt} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Search Videos Example
```tsx
import { useSearchVideos } from 'media-react';

function VideoSearch({ query }) {
  const { videos, loading, error, hasMore, loadMore } = useSearchVideos(query, 10);

  if (error) return <div>Error: {error.message}</div>;
  if (!videos.length && loading) return <div>Loading...</div>;
  if (!videos.length) return <div>No videos found.</div>;

  return (
    <div>
      {videos.map(video => (
        <div key={video.id}>
          <img src={video.image} alt="Video thumbnail" />
          <p>{video.user.name}</p>
        </div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Single Photo Detail
```tsx
import { usePhoto } from 'media-react';

function PhotoDetail({ photoId }) {
  const { photo, loading, error } = usePhoto(photoId);

  if (error) return <div>Error: {error.message}</div>;
  if (loading) return <div>Loading photo...</div>;
  if (!photo) return null;

  return (
    <div>
      <h2>Photo by {photo.photographer}</h2>
      <img src={photo.src.large} alt={photo.alt} />
      <a href={photo.url} target="_blank" rel="noreferrer">View on Pexels</a>
    </div>
  );
}
```

## Summary
The `media-react` package handles all state management, caching, data fetching, and tracking for the Pexels API. Always connect these to `media-ui-react` components in the parent application logic.
