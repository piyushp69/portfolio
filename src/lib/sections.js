// The sections below the hero can mount a few frames after it (App.jsx).
// Anything that looks one up by id (deep links, the scroll spy, a nav click
// in those first frames) waits for this first.

let markReady
export const sectionsReady = new Promise((resolve) => (markReady = resolve))

export function markSectionsReady() {
  markReady()
}
