# Skill: UI Components (media-ui-react)

## 1. What Headless Means and the Prop-Getter Pattern

The `media-ui-react` package provides **headless components** (hooks). "Headless" means these hooks provide the behavior, accessibility, and state management logic without enforcing any specific HTML structure or styling. 

To connect the headless hook logic to your DOM elements, you use the **prop-getter pattern**. A prop-getter is a function returned by the hook (e.g., `getContainerProps()`) that returns an object of DOM attributes. You spread this object onto your target DOM element: `<div {...getContainerProps()}>`.

## 2. useGrid

The `useGrid` hook manages infinite scrolling and grid state.

### Options
- `items`: The array of items to display.
- `hasMore`: Boolean indicating if more items can be loaded.
- `loading`: Boolean indicating if an initial or subsequent load is in progress.
- `onLoadMore`: Callback to trigger when the sentinel element intersects the viewport.
- `keyExtractor`: Function `(item) => string` to extract a unique key.

### Returns
- `isEmpty`: Boolean. True if `items.length === 0`.
- `sentinelRef`: A React ref to attach to your intersection observer sentinel element.
- `getContainerProps()`: Prop-getter for the grid wrapper.
- `getItemProps(item, index)`: Prop-getter for each individual item in the grid.
- `getSentinelProps()`: Prop-getter for the sentinel element.

### Important Notes
- The sentinel MUST be rendered at the bottom of the grid and the `sentinelRef` MUST be attached, otherwise infinite scroll will not trigger.
- When spreading `getItemProps`, extract `key` first since React keys cannot be spread directly via props.

## 3. useLightbox

The `useLightbox` hook manages a fullscreen modal, focus trap, and keyboard navigation for viewing media.

### Options
- `items`: Array of objects. Must have a `type` ('photo' | 'video') and `src`.
- `initialIndex`: Integer for the starting slide index.
- `onClose`: Callback triggered when the lightbox is closed (via Escape key or close button).

### Returns
- `currentItem`: The currently active media item object, or `null`.
- `activeIndex`: Current slide index.
- `contentRef`: Ref for the content area, important for the focus trap.
- Prop-getters: `getOverlayProps()`, `getContentProps()`, `getCloseButtonProps()`, `getPrevButtonProps()`, `getNextButtonProps()`.

### Important Notes
- The lightbox hook automatically handles left/right arrow keys for navigation and the Escape key for closing.
- Always apply `contentRef` to the dialog/content container.

## 4. useReelSwiper

The `useReelSwiper` hook provides logic for TikTok/Reels-style vertical snapping video feeds.

### Options
- `items`: Array of items.
- `onActiveChange`: Callback `(index) => void` triggered when a new item snaps into view.

### Returns
- `activeIndex`: Current active index in the viewport.
- `getItemRef(index)`: A callback ref to attach to each reel item to track visibility.
- `getContainerProps()`: Prop-getter for the scrollable container.
- `getItemProps(index)`: Prop-getter for the individual video item.

### CSS Responsibilities
- The consumer **must** provide the CSS for `scroll-snap-type` on the container and `scroll-snap-align` on the items. The hook only observes intersections; it does not force layout styling.

## 5. CSS Responsibilities

Because `media-ui-react` is headless, it injects minimal to no inline styles. 

**Consumer Must Add:**
- Grid layout (CSS Columns or Flex/Grid).
- Sentinel dimensions (e.g., `height: 1px`).
- Modal positioning (`position: fixed`, `z-index`, background overlay).
- Scroll snapping CSS for the Reel.

## 6. Complete Working Examples

### Grid Example
```tsx
import { useGrid } from 'media-ui-react';

function SimpleGrid({ data, hasMore, loading, loadMore }) {
  const grid = useGrid({
    items: data,
    hasMore,
    loading,
    onLoadMore: loadMore,
    keyExtractor: item => item.id
  });

  return (
    <>
      <div {...grid.getContainerProps()} style={{ columns: 3 }}>
        {data.map((item, i) => {
          const { key, ...props } = grid.getItemProps(item, i);
          return (
            <div key={key} {...props} style={{ marginBottom: 10 }}>
              <img src={item.url} alt="Grid item" />
            </div>
          );
        })}
      </div>
      <div ref={grid.sentinelRef} {...grid.getSentinelProps()} style={{ height: '1px' }} />
    </>
  );
}
```

### Lightbox Example
```tsx
import { useLightbox } from 'media-ui-react';

function SimpleLightbox({ items, onClose }) {
  const lb = useLightbox({ items, initialIndex: 0, onClose });
  
  if (!lb.currentItem) return null;

  return (
    <div {...lb.getOverlayProps()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)' }}>
      <div ref={lb.contentRef} {...lb.getContentProps()} style={{ position: 'absolute', inset: 50 }}>
        <button {...lb.getCloseButtonProps()}>Close</button>
        <button {...lb.getPrevButtonProps()}>Prev</button>
        <img src={lb.currentItem.src} alt="media" />
        <button {...lb.getNextButtonProps()}>Next</button>
      </div>
    </div>
  );
}
```

### Reel Swiper Example
```tsx
import { useReelSwiper } from 'media-ui-react';

function SimpleReel({ videos }) {
  const reel = useReelSwiper({
    items: videos,
    onActiveChange: (index) => console.log('Active video changed to', index)
  });

  return (
    <div {...reel.getContainerProps()} style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
      {videos.map((video, index) => (
        <div 
          key={video.id} 
          ref={reel.getItemRef(index)}
          {...reel.getItemProps(index)} 
          style={{ height: '100vh', scrollSnapAlign: 'start' }}
        >
          <video src={video.src} autoPlay={reel.activeIndex === index} loop muted playsInline />
        </div>
      ))}
    </div>
  );
}
```

## 7. Common Mistakes

1. **Missing Sentinel Ref**: Forgetting to attach `ref={grid.sentinelRef}` to the bottom element in `useGrid`. Infinite scroll will silently fail.
2. **Wrong Fixed Height for Reel**: The container for `useReelSwiper` must have a defined height (e.g. `100vh` or `calc(100vh - 50px)`) and `overflowY: scroll`. Without a fixed constraint, snapping cannot occur.
3. **Not Spreading contentRef**: The focus trap in `useLightbox` requires `lb.contentRef` to know where to trap focus.
4. **Key Conflict**: Doing `<div key={item.id} {...grid.getItemProps(item, i)}>` without destructuring `key` from the prop getter first. React does not allow keys inside spread props.

## 8. Combining with media-react

Always combine these hooks in the parent component. 
The headless UI hooks handle the visual state, and the `media-react` data hooks handle the fetching state. The app layer acts as the glue.
