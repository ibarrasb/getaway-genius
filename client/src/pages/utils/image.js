export const getTripImageSrc = (trip) => {
    // Prefer photo_reference via your backend proxy (stable)
    if (trip?.photo_reference) {
      return `/api/places-pics?photoreference=${encodeURIComponent(trip.photo_reference)}`
    }
    // Fallback to stored image_url if present
    if (trip?.image_url) return trip.image_url
    // Last resort placeholder
    return "https://picsum.photos/seed/getaway/800/600"
  }
  