// One mouse listener for every cursor effect: the page glow, the card
// spotlights, the brighter grid under the mouse (via the glow) and the data
// sphere's tilt. Moves are batched to one animation frame, where each
// subscriber reads the latest position. Touch input is ignored.

const pointer = {
  x: 0,
  y: 0,
  target: null, // the element under the mouse at its last move
  inside: false, // the mouse is in the window
  moved: false, // it moved, entered or left since the last frame
}

const subscribers = new Set()
let frame = 0

const run = (now) => {
  frame = 0
  subscribers.forEach((subscriber) => subscriber(pointer, now))
  pointer.moved = false
}

/** Asks for a frame; a subscriber that is still animating calls this again. */
export function requestPointerFrame() {
  if (!frame && subscribers.size) frame = requestAnimationFrame(run)
}

const onMove = (event) => {
  if (event.pointerType !== 'mouse') return
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.target = event.target
  pointer.inside = true
  pointer.moved = true
  requestPointerFrame()
}

// Leaving the window (not just moving between elements).
const onLeaveWindow = (event) => {
  if (event.relatedTarget) return
  pointer.inside = false
  pointer.moved = true
  requestPointerFrame()
}

/**
 * Calls `subscriber(pointer, now)` on each frame the pointer moved in, or
 * that someone asked for. The document listeners exist only while there
 * are subscribers. Returns an unsubscribe.
 */
export function subscribePointer(subscriber) {
  if (!subscribers.size) {
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onLeaveWindow)
  }
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size) return
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerout', onLeaveWindow)
    cancelAnimationFrame(frame)
    frame = 0
    pointer.inside = false
  }
}
