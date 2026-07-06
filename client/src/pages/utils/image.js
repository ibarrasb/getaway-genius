export const getTripImageSrc = (trip) => {
    // Fallback to stored image_url if present
    if (trip?.image_url?.trim()) return trip.image_url
    // Last resort placeholder
    return "https://picsum.photos/seed/getaway/800/600"
  }
  
