// routes/externalRoutes.js (ESM)

import { Router } from 'express';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { getExistingCloudinaryUrl } from '../services/cloudinary.js';

const router = Router();

// OpenAI client (one-time init)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS || 1000 * 60 * 60 * 6); // 6h default
const aiCache = new Map();

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

const readFromCache = (bucket, location) => {
  const key = `${bucket}:${normalizeLocationKey(location)}`;
  const hit = aiCache.get(key);
  if (!hit) return null;

  if (Date.now() > hit.expiresAt) {
    aiCache.delete(key);
    return null;
  }
  return hit.value;
};

const writeToCache = (bucket, location, value) => {
  const key = `${bucket}:${normalizeLocationKey(location)}`;
  aiCache.set(key, { value, expiresAt: Date.now() + AI_CACHE_TTL_MS });
};

// Google Places: Place Details
router.get('/places-details', async (req, res) => {
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
router.get('/places-pics', async (req, res) => {
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

// OpenWeather current conditions
router.get('/weather', async (req, res) => {
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
router.post('/chatgpt/fun-places', async (req, res) => {
  const location = req.body?.location || '';
  try {
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');
    if (!location) return res.status(400).json({ error: 'location is required' });

    const cached = readFromCache('fun-places', location);
    if (cached) return res.json(cached);

    const response = await createChatCompletion({
      messages: [
        { role: 'user', content: `List 5 popular and must see places to visit in ${location}.` },
      ],
      temperature: 0.3,
    });

    const list = response.choices?.[0]?.message?.content?.trim() ?? '';
    const payload = { funPlaces: list };
    writeToCache('fun-places', location, payload);
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
router.post('/chatgpt/trip-suggestion', async (req, res) => {
  try {
    const { location } = req.body || {};
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');
    if (!location) return res.status(400).json({ error: 'location is required' });

    const cached = readFromCache('trip-suggestion', location);
    if (cached) return res.json(cached);

    const response = await createChatCompletion({
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'trip_suggestion_windows',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              suggestions: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    season: { type: 'string' },
                    monthIntervals: { type: 'string' },
                    reason: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['season', 'monthIntervals', 'reason', 'description'],
                },
              },
            },
            required: ['suggestions'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You are a travel planning assistant. Return practical seasonal advice. Keep each field concise and useful.',
        },
        {
          role: 'user',
          content:
            `List exactly 3 best times to travel to ${location} based on cost, overall experience, and crowd levels.`,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    const parsed = parseFirstJsonObject(content);

    if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('AI returned invalid suggestion format');
    }

    const payload = { suggestions: parsed.suggestions };
    writeToCache('trip-suggestion', location, payload);
    return res.json(payload);
  } catch (error) {
    const msg = getOpenAIErrorMessage(error);
    console.error('ChatGPT trip-suggestion error:', msg);
    const fallback = {
      suggestions: [
        {
          season: 'Spring',
          monthIntervals: 'Mar - May',
          reason: 'Balanced weather and moderate prices in many destinations.',
          description: 'Good tradeoff between comfort, cost, and crowd levels.',
        },
        {
          season: 'Shoulder Summer',
          monthIntervals: 'Jun or Sep',
          reason: 'Often better rates than peak summer with strong experiences.',
          description: 'Target early/late summer to avoid peak surges.',
        },
        {
          season: 'Late Fall',
          monthIntervals: 'Oct - Nov',
          reason: 'Lower demand can improve flight and hotel value.',
          description: 'Useful for budget-first planning with fewer crowds.',
        },
      ],
      warning: `AI temporarily unavailable: ${msg}`,
    };
    return res.json(fallback);
  }
});

// ChatGPT: quick destination brief for search flow
router.post('/chatgpt/location-brief', async (req, res) => {
  const location = req.body?.location || '';
  try {
    if (!openai.apiKey) throw new Error('OPENAI_API_KEY not set');
    if (!location) return res.status(400).json({ error: 'location is required' });

    const cached = readFromCache('location-brief', location);
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

    writeToCache('location-brief', location, parsed);
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
