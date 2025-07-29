interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(identifier: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    // İlk deneme
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (now > entry.resetTime) {
    // Zaman penceresi sıfırlandı
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (entry.count >= maxAttempts) {
    // Limit aşıldı
    return false
  }

  // Sayacı artır
  entry.count++
  return true
}

export function getRemainingTime(identifier: string): number {
  const entry = rateLimitStore.get(identifier)
  if (!entry) return 0

  const now = Date.now()
  return Math.max(0, entry.resetTime - now)
}

// Temizlik fonksiyonu - eski kayıtları sil
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Her 5 dakikada bir temizlik yap
if (typeof window === "undefined") {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}
