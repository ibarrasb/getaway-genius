
export const formatTripRange = (start, end) => {
    const s = start ? new Date(start) : null
    const e = end ? new Date(end) : null
    const goodS = s && !isNaN(s.getTime())
    const goodE = e && !isNaN(e.getTime())
  
    if (!goodS && !goodE) return "Dates TBD"
    if (goodS && !goodE) return s.toLocaleDateString()
    if (!goodS && goodE) return e.toLocaleDateString()
    // both good
    return `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`
  }
  