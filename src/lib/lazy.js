import { lazy } from 'react'

/**
 * React.lazy plus a way to fetch the code ahead of time. Once the module has
 * arrived, the component renders straight away instead of suspending for a
 * moment, so an animation that starts as it mounts (the project modal's
 * morph) isn't held back by a Suspense fallback.
 *
 * Returns [Component, preload].
 */
export function lazyWithPreload(load) {
  let loaded = null
  let pending = null
  const preload = () => (pending ??= load().then((module) => (loaded = module)))
  // A thenable that calls back synchronously when the module is already
  // here, which lets React.lazy resolve without suspending.
  const Component = lazy(() => (loaded ? { then: (resolve) => resolve(loaded) } : preload()))
  return [Component, preload]
}
