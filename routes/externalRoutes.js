// routes/externalRoutes.js (ESM)

import { Router } from 'express';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { getExistingCloudinaryUrl, uploadImageBuffer } from '../services/cloudinary.js';
import ApiCache from '../models/apiCacheModel.js';
import auth from '../middleware/auth.js';
import { requireBody, requireStringBody, requireStringQuery } from '../middleware/validate.js';
import {
  pickBestImageCandidate,
  searchPexelsImages,
  searchUnsplashImages,
  trackUnsplashDownload,
} from '../services/destinationImages.js';

const router = Router();

// OpenAI client (one-time init)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS || 1000 * 60 * 60 * 6); // 6h default
const EXTERNAL_RATE_LIMIT_WINDOW_MS = Number(process.env.EXTERNAL_RATE_LIMIT_WINDOW_MS || 60_000);
const EXTERNAL_RATE_LIMIT_MAX = Number(process.env.EXTERNAL_RATE_LIMIT_MAX || 60);
const externalRateHits = new Map();

const rateLimitExternal = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const windowStart = now - EXTERNAL_RATE_LIMIT_WINDOW_MS;
  const existing = (externalRateHits.get(userId) || []).filter((ts) => ts > windowStart);

  if (existing.length >= EXTERNAL_RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many external API requests. Try again shortly.' });
  }

  existing.push(now);
  externalRateHits.set(userId, existing);
  return next();
};

const paidRoute = [auth, rateLimitExternal];

const parseJsonSafe = (text) => {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseFirstJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null;
  const direct = parseJsonSafe(text);
  if (direct) return direct;

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    const parsedFenced = parseJsonSafe(fenced[1]);
    if (parsedFenced) return parsedFenced;
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) return parseJsonSafe(objectMatch[0]);
  return null;
};

const getOpenAIErrorMessage = (error) =>
  error?.error?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  'Unknown OpenAI error';

const createChatCompletion = async ({ responseFormat, messages, temperature = 0.2 }) => {
  try {
    return await openai.chat.completions.create({
      model: OPENAI_MODEL,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      messages,
      temperature,
    });
  } catch (err) {
    // Some models/accounts reject strict json_schema. Retry without response_format.
    if (responseFormat) {
      return openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          ...messages,
          {
            role: 'user',
            content: 'Return ONLY valid JSON. Do not include markdown or commentary.',
          },
        ],
        temperature,
      });
    }
    throw err;
  }
};

const normalizeLocationKey = (location) =>
  String(location || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const cacheKey = (bucket, location) => `${bucket}:${normalizeLocationKey(location)}`;

const readFromCache = async (bucket, location) => {
  const hit = await ApiCache.findOne({
    key: cacheKey(bucket, location),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!hit) return null;
  return hit.value;
};

const writeToCache = async (bucket, location, value) => {
  await ApiCache.findOneAndUpdate(
    { key: cacheKey(bucket, location) },
    {
      key: cacheKey(bucket, location),
      value,
      expiresAt: new Date(Date.now() + AI_CACHE_TTL_MS),
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

const monthNameFromDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
};

const inferTripStyle = (location = '', options = []) => {
  const text = [location, ...options.flatMap((option) => [option.destination, option.title])]
    .join(' ')
    .toLowerCase();

  if (/\b(beach|island|coast|gulf|ocean|san juan|puerto rico|destin|miami|cancun|tulum|honolulu|maui|bahamas|aruba|key west|santa monica|malibu)\b/.test(text)) {
    return 'beach';
  }
  if (/\b(mountain|ski|snow|aspen|vail|breckenridge|park city|tahoe|banff|rocky|smoky)\b/.test(text)) {
    return 'mountain';
  }
  if (/\b(disney|universal|theme park|orlando|anaheim)\b/.test(text)) {
    return 'theme_park';
  }
  if (/\b(national park|zion|yosemite|yellowstone|grand canyon|glacier)\b/.test(text)) {
    return 'outdoors';
  }
  return 'city';
};

const betterValueAlternatives = (location = '', style = 'city') => {
  const text = location.toLowerCase();
  if (text.includes('los angeles')) return ['Long Beach', 'San Diego', 'Ventura'];
  if (text.includes('san juan') || text.includes('puerto rico')) return ['Luquillo', 'Rincon', 'Aguadilla'];
  if (text.includes('destin')) return ['Gulf Shores', 'Pensacola Beach', 'Panama City Beach'];
  if (text.includes('miami')) return ['Fort Lauderdale', 'Hollywood Beach', 'St. Pete Beach'];
  if (text.includes('orlando')) return ['Kissimmee', 'Lake Buena Vista', 'Tampa'];
  if (text.includes('new york')) return ['Jersey City', 'Brooklyn outside Williamsburg', 'Queens'];
  if (text.includes('chicago')) return ['Milwaukee', 'Evanston', 'Oak Park'];
  if (text.includes('denver')) return ['Colorado Springs', 'Fort Collins', 'Boulder'];

  const byStyle = {
    beach: ['a nearby beach town', 'a quieter coastal area', 'a less-central waterfront stay'],
    mountain: ['a smaller mountain town nearby', 'a non-resort base town', 'a weekday ski-area stay'],
    theme_park: ['a nearby suburb stay', 'an off-property hotel area', 'a weekday park-adjacent option'],
    outdoors: ['a gateway town outside the main entrance', 'a nearby state park base', 'a weekday cabin area'],
    city: ['a nearby secondary city', 'a less-central neighborhood', 'a transit-connected suburb'],
  };
  return byStyle[style] || byStyle.city;
};

const buildTripIntelFallback = ({ location, boardContext, normalizedOptions, msg }) => {
  const focusOption =
    normalizedOptions.find((option) => option.status === 'top_choice' || option.status === 'booked') ||
    normalizedOptions[0] ||
    null;
  const focusDestination = focusOption?.destination || location;
  const month = monthNameFromDate(boardContext.start);
  const dateRange =
    boardContext.start && boardContext.end
      ? `${boardContext.start} to ${boardContext.end}`
      : 'your selected dates';
  const style = inferTripStyle(focusDestination || location, normalizedOptions);
  const alternatives = betterValueAlternatives(focusDestination || location, style);
  const totals = normalizedOptions.map((option) => option.total).filter((total) => total > 0);
  const hasUsablePrices = totals.length > 0;
  const cheapest = hasUsablePrices
    ? normalizedOptions
        .filter((option) => option.total > 0)
        .sort((a, b) => a.total - b.total)[0]
    : null;

  const timingByStyle = {
    beach: `${month || 'Your travel month'} is about weather risk, water comfort, and holiday pricing for ${focusDestination}.`,
    mountain: `${month || 'Your travel month'} can be strong for mountain trips, but lodging jumps around snow weekends and holidays.`,
    theme_park: `${month || 'Your travel month'} is usually better when school breaks are avoided and weekdays are prioritized.`,
    outdoors: `${month || 'Your travel month'} depends on trail access, daylight, and weather closures around ${focusDestination}.`,
    city: `${month || 'Your travel month'} can work for ${focusDestination}, but event calendars and weekend hotel demand matter most.`,
  };

  return {
    cards: [
      {
        type: 'timing',
        title: `Best Time For ${focusDestination}`,
        summary: `${dateRange} is the window to validate.`,
        details: timingByStyle[style] || timingByStyle.city,
        recommendation: `Check lodging and flight prices for ${dateRange}; compare against one week earlier/later before committing.`,
      },
      {
        type: 'better_value',
        title: `Comparable Value Picks`,
        summary: `${alternatives.join(', ')} are the first places to compare against ${focusDestination}.`,
        details:
          style === 'beach'
            ? `These keep the warm-weather/coastal intent instead of sending you to an unrelated trip type.`
            : `These keep the same ${style.replace('_', ' ')} intent while giving you a shot at lower lodging or easier logistics.`,
        recommendation: `Add one of ${alternatives.slice(0, 2).join(' or ')} as another board option if ${focusDestination} prices look high.`,
      },
      {
        type: 'fit_check',
        title: `Fit Check`,
        summary: hasUsablePrices
          ? `${cheapest.destination || cheapest.title || focusDestination} is currently the lowest entered total at $${Math.round(cheapest.total).toLocaleString('en-US')}.`
          : `This board cannot make a real price call yet because the visible options are still $0.`,
        details: hasUsablePrices
          ? `For ${boardContext.travelers || 1} traveler${Number(boardContext.travelers) === 1 ? '' : 's'}, compare lodging plus flight/car costs before setting the plan.`
          : `Add at least rough lodging and flight estimates for ${focusDestination}; otherwise the recommendation can only judge timing and destination fit.`,
        recommendation: hasUsablePrices
          ? `Commit only after the biggest cost item for ${focusDestination} is entered and still beats the alternatives.`
          : `Enter rough flight and lodging totals, then refresh Trip Intel for a real price-based call.`,
      },
    ],
    warning: `Using basic Trip Intel because AI was unavailable: ${msg}`,
  };
};

const googlePhotoCandidate = async ({ placeid, photoreference, location }) => {
  const apiKey = process.env.GOOGLEAPIKEY;
  let photoRef = photoreference;
  let width = 0;
  let height = 0;
  let attribution = {};

  if (!apiKey) return null;

  if (!photoRef && placeid) {
    const detailsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeid
    )}?fields=id,displayName,photos&key=${apiKey}`;

    const detailsResp = await fetch(detailsUrl);
    if (!detailsResp.ok) return null;
    const details = await detailsResp.json();
    const photos = Array.isArray(details?.photos) ? details.photos : [];
    const bestPhoto = photos
      .map((photo) => ({
        ...photo,
        score: (Number(photo.widthPx) || 0) + (Number(photo.heightPx) || 0),
      }))
      .sort((a, b) => b.score - a.score)[0];

    photoRef = bestPhoto?.name;
    width = Number(bestPhoto?.widthPx) || 0;
    height = Number(bestPhoto?.heightPx) || 0;
    attribution = {
      provider: 'Google Places',
      authorAttributions: bestPhoto?.authorAttributions || [],
    };
  }

  if (!photoRef) return null;

  const shortHash = createHash('sha256').update(photoRef).digest('hex').slice(0, 32);
  const existingUrl = await getExistingCloudinaryUrl(shortHash).catch(() => null);
  if (existingUrl) {
    return {
      provider: 'google',
      providerId: photoRef,
      url: existingUrl,
      width,
      height,
      alt: location,
      description: `${location} travel destination`,
      location,
      attribution,
    };
  }

  const mediaUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${apiKey}&maxWidthPx=2400&maxHeightPx=1600`;
  const mediaResp = await fetch(mediaUrl);
  if (!mediaResp.ok) return null;
  const buffer = Buffer.from(await mediaResp.arrayBuffer());
  const cloudinaryUrl = await uploadImageBuffer(buffer, shortHash);

  return {
    provider: 'google',
    providerId: photoRef,
    url: cloudinaryUrl,
    width,
    height,
    alt: location,
    description: `${location} travel destination`,
    location,
    attribution,
  };
};

// Google Places: Place Details
router.get('/places-details', ...paidRoute, requireStringQuery('placeid', { max: 300 }), async (req, res) => {
  try {
    const apiKey = process.env.GOOGLEAPIKEY;
    const placeid = req.query.placeid;
    if (!apiKey || !placeid) {
      return res.status(400).json({ error: 'Missing GOOGLEAPIKEY or placeid' });
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeid
    )}?fields=id,displayName,photos&key=${apiKey}`;

    const resp = await fetch(url);
    const text = await resp.text(); // handle non-JSON errors gracefully

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Places API error', details: text });
    }

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.status(500).json({ error: 'Failed to parse response data' });
    }
  } catch (error) {
    console.error('Places details error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Google Places: Photo preview - returns Cloudinary URL if exists, otherwise Google media URL (no upload)
router.get('/places-pics', ...paidRoute, requireStringQuery('photoreference', { max: 600 }), async (req, res) => {
  try {
    const apiKey = process.env.GOOGLEAPIKEY;
    const photoreference = req.query.photoreference; 
    if (!apiKey || !photoreference) {
      return res.status(400).json({ error: 'Missing GOOGLEAPIKEY or photoreference' });
    }

    const shortHash = createHash('sha256').update(photoreference).digest('hex').slice(0, 32);
    
    try {
      const existingUrl = await getExistingCloudinaryUrl(shortHash);
      if (existingUrl) {
        return res.json({ url: existingUrl });
      }
    } catch (cloudinaryError) {
      console.warn('Could not check Cloudinary for existing asset:', cloudinaryError);
    }

    const googleMediaUrl = `https://places.googleapis.com/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;
    return res.json({ url: googleMediaUrl });
  } catch (error) {
    console.error('Places pics error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.get('/destination-image', ...paidRoute, requireStringQuery('location', { max: 300 }), async (req, res) => {
  const { location, placeid, photoreference } = req.query;

  try {
    const cacheBucket = 'destination-image';
    const cacheLocation = `${location}:${placeid || ''}:${photoreference || ''}`;
    const cached = await readFromCache(cacheBucket, cacheLocation);
    if (cached) return res.json(cached);

    const candidates = [];

    try {
      candidates.push(...await searchUnsplashImages(location));
    } catch (error) {
      console.warn('Unsplash destination image search failed:', error?.message || error);
    }

    try {
      candidates.push(...await searchPexelsImages(location));
    } catch (error) {
      console.warn('Pexels destination image search failed:', error?.message || error);
    }

    const googleCandidate = await googlePhotoCandidate({ placeid, photoreference, location });
    if (googleCandidate) candidates.push(googleCandidate);

    const best = pickBestImageCandidate(candidates, location);
    if (!best) return res.status(404).json({ error: 'No destination image found' });

    if (best.provider === 'unsplash') await trackUnsplashDownload(best);

    const payload = {
      url: best.url,
      provider: best.provider,
      providerId: best.providerId,
      width: best.width,
      height: best.height,
      alt: best.alt || location,
      attribution: best.attribution || {},
    };

    await writeToCache(cacheBucket, cacheLocation, payload);
    return res.json(payload);
  } catch (error) {
    console.error('Destination image error:', error);
    return res.status(500).json({ error: 'Failed to fetch destination image' });
  }
});

// OpenWeather current conditions
router.get('/weather', ...paidRoute, requireStringQuery('city', { max: 120 }), async (req, res) => {
  try {
    const { city, state, country } = req.query;
    const apiKey = process.env.OPENWEATHERAPIKEY;

    if (!apiKey) return res.status(500).json({ error: 'OPENWEATHERAPIKEY not set' });
    if (!city) return res.status(400).json({ error: 'city is required' });

    const q =
      encodeURIComponent(city) +
      (state ? `,${encodeURIComponent(state)}` : '') +
      (country ? `,${encodeURIComponent(country)}` : '');

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`;

    const resp = await fetch(url);
    const text = await resp.text();

    if (resp.status === 200) {
      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.status(500).json({ error: 'Failed to parse response data' });
      }
    } else if (resp.status === 401) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    } else {
      console.error('Weather API error:', text);
      return res.status(resp.status).json({ error: 'Failed to fetch weather data' });
    }
  } catch (error) {
    console.error('Weather error:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

//  ChatGPT: Fun places
router.post('/chatgpt/fun-places', ...paidRoute, requireBody, requireStringBody('location'), async (req, res) => {
  const location = req.body?.location || '';
  try {
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');
    if (!location) return res.status(400).json({ error: 'location is required' });

    const cached = await readFromCache('fun-places', location);
    if (cached) return res.json(cached);

    const response = await createChatCompletion({
      messages: [
        { role: 'user', content: `List 5 popular and must see places to visit in ${location}.` },
      ],
      temperature: 0.3,
    });

    const list = response.choices?.[0]?.message?.content?.trim() ?? '';
    const payload = { funPlaces: list };
    await writeToCache('fun-places', location, payload);
    return res.json(payload);
  } catch (error) {
    const msg = getOpenAIErrorMessage(error);
    console.error('ChatGPT fun-places error:', msg);
    const fallback = {
      funPlaces:
        `1) City center highlights in ${location}\n` +
        `2) A signature viewpoint or lookout\n` +
        `3) Local food market / street food district\n` +
        `4) Museum or cultural quarter\n` +
        `5) Sunset waterfront or park`,
      warning: `AI temporarily unavailable: ${msg}`,
    };
    return res.json(fallback);
  }
});

//ChatGPT: Trip suggestion windows
router.post('/chatgpt/trip-suggestion', ...paidRoute, requireBody, requireStringBody('location'), async (req, res) => {
  const { location, board = {}, options = [] } = req.body || {};
  const normalizedOptions = (Array.isArray(options) ? options : [])
    .slice(0, 6)
    .map((option) => ({
      destination: String(option?.destination || '').slice(0, 120),
      title: String(option?.title || option?.option_title || '').slice(0, 120),
      status: String(option?.status || '').slice(0, 40),
      total: Number(option?.total || 0),
    }));
  const boardContext = {
    start: board?.start || board?.board_start || '',
    end: board?.end || board?.board_end || '',
    travelers: Number(board?.travelers || 1),
  };

  try {
    if (!location) return res.status(400).json({ error: 'location is required' });
    const focusOption =
      normalizedOptions.find((option) => option.status === 'top_choice' || option.status === 'booked') ||
      normalizedOptions[0] ||
      null;
    const hasUsablePrices = normalizedOptions.some((option) => option.total > 0);
    const cacheContext = JSON.stringify({ version: 2, location, boardContext, normalizedOptions });
    const cached = await readFromCache('trip-intel-v2', cacheContext);
    if (cached) return res.json(cached);
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');

    const response = await createChatCompletion({
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'trip_intel_cards',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              cards: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['timing', 'better_value', 'fit_check'],
                    },
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    details: { type: 'string' },
                    recommendation: { type: 'string' },
                  },
                  required: ['type', 'title', 'summary', 'details', 'recommendation'],
                },
              },
            },
            required: ['cards'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            [
              'You are a practical travel decision assistant inside a planning board.',
              'Return exactly 3 concise cards: timing, better_value, and fit_check.',
              'Every card must mention at least one concrete place, date window, board option, or cost condition from the user context.',
              'For better_value, name 2-3 specific alternatives with the same trip intent as the focus destination. If the user is considering a beach, only mention comparable beach/coastal options; if mountains, only comparable mountain/outdoor options; if city, only comparable city options.',
              'Do not suggest unrelated destination categories.',
              'If current options have no usable prices, say that a real price recommendation is blocked until flight/lodging estimates are added.',
              'Never say generic phrases like "look for nearby places", "same trip style", "pressure-test the plan", or "shoulder season" unless you name the actual destination/months.',
              'Be opinionated, specific, and budget-aware. Avoid travel-blog fluff and vague checklist advice.',
            ].join(' '),
        },
        {
          role: 'user',
          content:
            [
              `Destination being planned: ${location}.`,
              `Board dates: ${boardContext.start || 'not set'} to ${boardContext.end || 'not set'}.`,
              `Travelers: ${boardContext.travelers}.`,
              `Current board options: ${JSON.stringify(normalizedOptions)}.`,
              `Focus option: ${JSON.stringify(focusOption)}.`,
              `Usable prices entered: ${hasUsablePrices ? 'yes' : 'no'}.`,
              'Create the cards:',
              '1) Best Time To Go: judge the selected timing and mention better months/windows if useful.',
              '2) Similar But Better Value: recommend 2-3 named comparable cheaper alternatives and why they match the same intent.',
              '3) Trip Fit Check: tell whether this destination makes sense for the dates, group, current options, and likely budget tradeoffs. If prices are $0, explicitly say the board cannot make a real price call yet.',
            ].join('\n'),
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    const parsed = parseFirstJsonObject(content);

    if (!parsed?.cards || !Array.isArray(parsed.cards)) {
      throw new Error('AI returned invalid suggestion format');
    }

    const genericPattern = /shoulder-season dates|nearby places with the same trip style|pressure-test the plan|same category before comparing prices/i;
    const genericCard = parsed.cards.some((card) =>
      genericPattern.test([card.title, card.summary, card.details, card.recommendation].join(' '))
    );
    if (genericCard) {
      throw new Error('AI returned generic trip intel');
    }

    const payload = { cards: parsed.cards };
    await writeToCache('trip-intel-v2', cacheContext, payload);
    return res.json(payload);
  } catch (error) {
    const msg = getOpenAIErrorMessage(error);
    console.error('ChatGPT trip-suggestion error:', msg);
    return res.json(buildTripIntelFallback({ location, boardContext, normalizedOptions, msg }));
  }
});

// ChatGPT: quick destination brief for search flow
router.post('/chatgpt/location-brief', ...paidRoute, requireBody, requireStringBody('location'), async (req, res) => {
  const location = req.body?.location || '';
  try {
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');
    if (!location) return res.status(400).json({ error: 'location is required' });

    const cached = await readFromCache('location-brief', location);
    if (cached) return res.json(cached);

    const response = await createChatCompletion({
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'location_brief',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              summary: { type: 'string' },
              budgetTips: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: { type: 'string' },
              },
              bestMonths: {
                type: 'array',
                minItems: 2,
                maxItems: 4,
                items: { type: 'string' },
              },
            },
            required: ['summary', 'budgetTips', 'bestMonths'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You provide concise practical destination intel for travelers optimizing budget and experience.',
        },
        {
          role: 'user',
          content:
            `Create a short destination brief for ${location}. Include a one-paragraph summary, 3 budget-saving tips, and best travel months.`,
        },
      ],
      temperature: 0.35,
    });

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    const parsed = parseFirstJsonObject(content);
    if (!parsed?.summary || !Array.isArray(parsed?.budgetTips) || !Array.isArray(parsed?.bestMonths)) {
      throw new Error('AI returned invalid location brief format');
    }

    await writeToCache('location-brief', location, parsed);
    return res.json(parsed);
  } catch (error) {
    const msg = getOpenAIErrorMessage(error);
    console.error('ChatGPT location-brief error:', msg);
    const fallbackLocation = location || 'This destination';
    const fallback = {
      summary:
        `${fallbackLocation} offers a strong mix of sightseeing, local food, and walkable neighborhoods. ` +
        `Costs vary by season, so timing and flexible dates can improve value significantly.`,
      budgetTips: [
        'Travel mid-week to reduce transport and lodging costs.',
        'Stay slightly outside the main tourist core and use transit.',
        'Prioritize a short must-do list and pre-book top attractions.',
      ],
      bestMonths: ['March', 'April', 'September'],
      warning: `AI temporarily unavailable: ${msg}`,
    };
    return res.json(fallback);
  }
});

export default router;
