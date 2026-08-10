import { useState, useCallback } from 'react'
import { MediaProvider, useSearchPhotos, useSearchVideos, usePhoto, useMediaEvent } from 'media-react'
import { useGrid, useLightbox, useReelSwiper } from 'media-ui-react'
import './App.css'

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || ''

// ---- SearchBar ----
function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')
  const submit = () => { if (value.trim()) onSearch(value.trim()) }
  return (
    <div className="search-bar">
      <input
        id="search-input"
        className="search-bar__input"
        placeholder="Search photos and videos..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        aria-label="Search media"
      />
      <button id="search-btn" className="search-bar__btn" onClick={submit}>Search</button>
    </div>
  )
}

// ---- PhotoGrid ----
function PhotoGrid({ query, onPhotoClick }) {
  const { photos, loading, error, hasMore, loadMore } = useSearchPhotos(query, 20)

  const grid = useGrid({
    items: photos,
    hasMore,
    loading,
    onLoadMore: loadMore,
    keyExtractor: (p) => String(p.id),
  })

  if (error) return <p className="status status--error">Error: {error.message}</p>
  if (!query) return <p className="status status--empty">Search for photos above</p>
  if (grid.isEmpty) return loading ? <p className="status">Loading...</p> : <p className="status">No results for "{query}"</p>

  return (
    <>
      <div {...grid.getContainerProps()} className="photo-grid">
        {photos.map((photo, i) => {
          const itemProps = grid.getItemProps(photo, i)
          const { key, ...rest } = itemProps
          return (
            <div
              key={key}
              {...rest}
              className="photo-grid__item"
              onClick={() => onPhotoClick(photos, i)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onPhotoClick(photos, i)}
              role="button"
              aria-label={`View photo by ${photo.photographer}`}
            >
              <img
                className="photo-grid__img"
                src={photo.src.medium}
                alt={photo.alt || `Photo by ${photo.photographer}`}
                loading="lazy"
              />
              <div className="photo-grid__overlay">
                <span className="photo-grid__credit">{photo.photographer}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div ref={grid.sentinelRef} {...grid.getSentinelProps()} className="grid-sentinel" />
      {loading && photos.length > 0 && <p className="grid-loading">Loading more...</p>}
    </>
  )
}

// ---- MediaLightbox ----
function MediaLightbox({ items, initialIndex, onClose }) {
  const lb = useLightbox({ items, initialIndex, onClose })
  if (!lb.currentItem) return null

  return (
    <div {...lb.getOverlayProps()} className="lightbox-overlay">
      <button {...lb.getCloseButtonProps()} className="lightbox-close">✕</button>
      <button {...lb.getPrevButtonProps()} className="lightbox-nav lightbox-nav--prev">‹</button>
      <div ref={lb.contentRef} {...lb.getContentProps()} className="lightbox-dialog">
        {lb.currentItem.type === 'photo' ? (
          <img src={lb.currentItem.src} alt={lb.currentItem.alt || ''} />
        ) : (
          <video src={lb.currentItem.src} poster={lb.currentItem.poster} autoPlay loop controls />
        )}
        {lb.currentItem.credit && (
          <p className="lightbox-credit">Photo by {lb.currentItem.credit}</p>
        )}
      </div>
      <button {...lb.getNextButtonProps()} className="lightbox-nav lightbox-nav--next">›</button>
    </div>
  )
}

// ---- VideoReel ----
function VideoReel({ query }) {
  const { videos, loading, error } = useSearchVideos(query, 8)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)

  const reel = useReelSwiper({
    items: videos,
    onActiveChange: (index) => setActiveVideoIndex(index),
  })

  if (error) return <p className="status status--error">Error: {error.message}</p>
  if (!query) return <p className="status status--empty">Search for videos above</p>
  if (loading && videos.length === 0) return <p className="status">Loading videos...</p>
  if (videos.length === 0) return <p className="status">No videos found for "{query}"</p>

  return (
    <div className="reel-layout">
      <div {...reel.getContainerProps()} className="reel-container">
        {videos.map((video, index) => {
          const bestFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0]
          return (
            <div
              key={video.id}
              ref={reel.getItemRef(index)}
              {...reel.getItemProps(index)}
              className="reel-item"
            >
              <video
                src={bestFile?.link}
                poster={video.image}
                autoPlay={index === reel.activeIndex}
                loop
                muted
                playsInline
              />
              <div className="reel-item__info">
                <p className="reel-item__user">{video.user.name}</p>
                <p className="reel-item__duration">{video.duration}s</p>
              </div>
            </div>
          )
        })}
      </div>
      <aside className="reel-sidebar">
        <p className="reel-sidebar__title">Up next</p>
        {videos.map((video, i) => (
          <img
            key={video.id}
            className={`reel-thumb ${i === activeVideoIndex ? 'reel-thumb--active' : ''}`}
            src={video.image}
            alt={`Video by ${video.user.name}`}
          />
        ))}
      </aside>
    </div>
  )
}

// ---- ActivityLog (uses useMediaEvent) ----
function ActivityLog() {
  useMediaEvent('view', ({ item, timestamp }) => {
    console.log('[App] view event', { id: item.id, at: new Date(timestamp).toISOString() })
  })
  useMediaEvent('download', ({ item, timestamp }) => {
    console.log('[App] download event', { id: item.id, at: new Date(timestamp).toISOString() })
  })
  return null
}

// ---- LightboxItems helper ----
function photosToLightboxItems(photos) {
  return photos.map(p => ({
    id: p.id,
    type: 'photo',
    src: p.src.large2x || p.src.large,
    alt: p.alt,
    credit: p.photographer,
  }))
}

// ---- Main App ----
function App() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('photos')
  const [lightboxState, setLightboxState] = useState(null) // { items, index }

  const openLightbox = useCallback((photos, index) => {
    setLightboxState({ items: photosToLightboxItems(photos), index })
  }, [])

  const closeLightbox = useCallback(() => setLightboxState(null), [])

  return (
    <MediaProvider config={{ apiKey: PEXELS_API_KEY }}>
      <ActivityLog />
      <div className="app">
        <header className="app__header">
          <h1 className="app__logo">med<span>ux</span></h1>
          <SearchBar onSearch={setQuery} />
          <nav className="app__tabs">
            <button
              id="tab-photos"
              className={`tab-btn ${activeTab === 'photos' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >Photos</button>
            <button
              id="tab-videos"
              className={`tab-btn ${activeTab === 'videos' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >Videos</button>
          </nav>
        </header>

        <main className="app__content">
          {activeTab === 'photos' && (
            <PhotoGrid query={query} onPhotoClick={openLightbox} />
          )}
          {activeTab === 'videos' && (
            <VideoReel query={query} />
          )}
        </main>

        {lightboxState && (
          <MediaLightbox
            items={lightboxState.items}
            initialIndex={lightboxState.index}
            onClose={closeLightbox}
          />
        )}
      </div>
    </MediaProvider>
  )
}

export default App
