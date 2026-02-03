# Claude Code Guidelines for Lemon Web App

## Scroll Behavior Patterns

### Scroll-to-Top Requires Space Below
When scrolling an element to the top of the viewport, there must be enough content/space BELOW it to allow the scroll. Without sufficient height below, `scrollIntoView({ block: 'start' })` or `scrollTo()` won't work.

**Solution**: Add a spacer div with `min-height` or dynamic height to provide scroll room.

### Double requestAnimationFrame for DOM Updates
Use double RAF to ensure DOM is fully updated before measuring or scrolling:
```jsx
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        // DOM is guaranteed to be updated here
        container.scrollTop = container.scrollHeight;
    });
});
```
Single RAF might run before React has committed DOM changes.

### scrollHeight Includes min-height
`container.scrollHeight` includes any CSS `min-height`, so it doesn't reflect actual content height. To measure real content height, use a ref on the actual content element:
```jsx
const responseContentRef = useRef<HTMLDivElement>(null);
// ...
const actualHeight = responseContentRef.current?.offsetHeight;
```

## Dynamic Spacer Pattern (ChatGPT-style scroll)

For chat UX where user message scrolls to top:

1. **During streaming**: Use fixed `min-h-[Xvh]` to provide space for scroll-to-top
2. **Track if long response**: Use a ref to track if content exceeds viewport during streaming
3. **Calculate remaining space BEFORE state change**: Measure heights before removing streaming content
4. **Short response**: Apply exact `remainingSpace` as inline `minHeight`
5. **Long response**: No spacer needed (content already exceeds viewport)

```jsx
// Track during streaming
if (responseHeight > viewportHeight - buffer) {
    isLongResponseRef.current = true;
}

// Calculate before streaming ends
if (!isLongResponseRef.current) {
    calculatedSpace = Math.max(0, viewportHeight - totalContentHeight);
}
```

## CSS Selection Specificity
Tailwind's `selection:bg-*` classes have equal specificity. The one appearing later in the compiled CSS wins. Use `!` suffix for important override:
```jsx
className="selection:bg-white!"
```

## RAF for Scroll Batching (Jitter Fix)
When content updates rapidly (streaming), batch scroll updates with RAF to prevent jitter:
```jsx
scrollRAFRef.current = requestAnimationFrame(() => {
    scrollToBottom(false);
});
```
This ensures max one scroll per frame (60fps).

## Refs vs State for Tracking
Use refs (not state) for values that:
- Change frequently during streaming
- Don't need to trigger re-renders
- Are only read at specific moments (like when streaming ends)

Example: `isLongResponseRef` tracks if response exceeded viewport, only read when streaming completes.
