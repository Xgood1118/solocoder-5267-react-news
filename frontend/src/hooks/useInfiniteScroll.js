import { useState, useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(fetchMore, hasMore, threshold = 200) {
  const [loading, setLoading] = useState(false)
  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      await fetchMore()
    } finally {
      setLoading(false)
    }
  }, [fetchMore, hasMore, loading])

  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    )

    observer.observe(sentinelRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMore, threshold])

  return { sentinelRef, loading }
}

export default useInfiniteScroll
