const CITY_TERMS = [
  'skyline',
  'city',
  'downtown',
  'landmark',
  'waterfront',
  'architecture',
  'travel',
  'aerial',
  'view',
];

const WEAK_TERMS = [
  'person',
  'people',
  'portrait',
  'food',
  'restaurant',
  'hotel room',
  'bedroom',
  'interior',
  'office',
  'wedding',
];

export const buildDestinationImageQuery = (location = '') => {
  const cleaned = String(location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ');

  return `${cleaned} skyline travel city`.trim();
};

export const scoreImageCandidate = (candidate = {}, location = '') => {
  const width = Number(candidate.width) || 0;
  const height = Number(candidate.height) || 0;
  if (!width || !height) return -1000;

  const ratio = width / height;
  const text = [
    candidate.alt,
    candidate.description,
    candidate.location,
    candidate.tags,
    candidate.provider,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const locationParts = String(location || '')
    .toLowerCase()
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  let score = 0;

  if (width >= 2400) score += 25;
  else if (width >= 1600) score += 18;
  else if (width >= 1000) score += 8;
  else score -= 25;

  if (height >= 1000) score += 10;

  if (ratio >= 1.45 && ratio <= 2.1) score += 25;
  else if (ratio >= 1.2 && ratio <= 2.4) score += 10;
  else score -= 18;

  for (const part of locationParts) {
    if (part.length >= 3 && text.includes(part)) score += 12;
  }

  for (const term of CITY_TERMS) {
    if (text.includes(term)) score += 5;
  }

  for (const term of WEAK_TERMS) {
    if (text.includes(term)) score -= 8;
  }

  if (candidate.provider === 'unsplash') score += 6;
  if (candidate.provider === 'pexels') score += 4;
  if (candidate.provider === 'google') score += 2;

  return score;
};

export const pickBestImageCandidate = (candidates = [], location = '') =>
  [...candidates]
    .filter((candidate) => candidate?.url)
    .map((candidate) => ({
      ...candidate,
      score: scoreImageCandidate(candidate, location),
    }))
    .sort((a, b) => b.score - a.score)[0] || null;

const normalizeUnsplashPhoto = (photo) => ({
  provider: 'unsplash',
  providerId: photo.id,
  url: photo.urls?.regular || photo.urls?.full || photo.urls?.raw,
  width: photo.width,
  height: photo.height,
  alt: photo.alt_description || photo.description || '',
  description: photo.description || photo.alt_description || '',
  location: photo.location?.title || [photo.location?.city, photo.location?.country].filter(Boolean).join(', '),
  attribution: {
    provider: 'Unsplash',
    authorName: photo.user?.name || '',
    authorUrl: photo.user?.links?.html || '',
    sourceUrl: photo.links?.html || '',
    downloadLocation: photo.links?.download_location || '',
  },
});

const normalizePexelsPhoto = (photo) => ({
  provider: 'pexels',
  providerId: photo.id,
  url: photo.src?.large2x || photo.src?.large || photo.src?.original,
  width: photo.width,
  height: photo.height,
  alt: photo.alt || '',
  description: photo.alt || '',
  location: '',
  attribution: {
    provider: 'Pexels',
    authorName: photo.photographer || '',
    authorUrl: photo.photographer_url || '',
    sourceUrl: photo.url || '',
  },
});

export const searchUnsplashImages = async (location, fetchImpl = fetch) => {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: buildDestinationImageQuery(location),
    orientation: 'landscape',
    order_by: 'relevant',
    content_filter: 'high',
    per_page: '12',
  });

  const resp = await fetchImpl(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  });
  if (!resp.ok) throw new Error(`Unsplash image search failed: ${resp.status}`);

  const json = await resp.json();
  return (json.results || []).map(normalizeUnsplashPhoto);
};

export const searchPexelsImages = async (location, fetchImpl = fetch) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: buildDestinationImageQuery(location),
    orientation: 'landscape',
    size: 'large',
    per_page: '12',
  });

  const resp = await fetchImpl(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: { Authorization: apiKey },
  });
  if (!resp.ok) throw new Error(`Pexels image search failed: ${resp.status}`);

  const json = await resp.json();
  return (json.photos || []).map(normalizePexelsPhoto);
};

export const trackUnsplashDownload = async (candidate, fetchImpl = fetch) => {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  const downloadLocation = candidate?.attribution?.downloadLocation;
  if (!apiKey || !downloadLocation) return;

  try {
    await fetchImpl(downloadLocation, {
      headers: { Authorization: `Client-ID ${apiKey}` },
    });
  } catch (error) {
    console.warn('Unsplash download tracking failed:', error?.message || error);
  }
};
