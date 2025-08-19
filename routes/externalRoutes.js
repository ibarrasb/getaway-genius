// routes/externalRoutes.js (ESM)

import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// OpenAI client (one-time init)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Google Places: Photo bytes
router.get('/places-pics', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLEAPIKEY;
    const photoreference = req.query.photoreference; 
    if (!apiKey || !photoreference) {
      return res.status(400).json({ error: 'Missing GOOGLEAPIKEY or photoreference' });
    }

 
const url = `https://places.googleapis.com/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;
// const url = `https://places.googleapis.com/v1/${encodeURI(photoreference)}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;

    const resp = await fetch(url);
    const buf = Buffer.from(await resp.arrayBuffer());

    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ error: 'Places media error', details: buf.toString('utf-8') });
    }

    // Pass through content-type if provided
    const ct = resp.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', ct);
    return res.send(buf);
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
  try {
    const { location } = req.body || {};
    if (!openai.apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
    if (!location) return res.status(400).json({ error: 'location is required' });

    const response = await openai.chat.completions.create({
      // Consider upgrading to a newer model if available in your account
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: `List 5 popular and must see places to visit in ${location}.` },
      ],
    });

    const list = response.choices?.[0]?.message?.content?.trim() ?? '';
    return res.json({ funPlaces: list });
  } catch (error) {
    console.error('ChatGPT fun-places error:', error);
    return res.status(500).json({ error: 'Failed to fetch data from ChatGPT' });
  }
});

//ChatGPT: Trip suggestion windows
router.post('/chatgpt/trip-suggestion', async (req, res) => {
  try {
    const { location } = req.body || {};
    if (!openai.apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
    if (!location) return res.status(400).json({ error: 'location is required' });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content:
            `Please list the 3 best time to travel to ${location}, based on cost, experience (events/seasonality), and popularity. ` +
            `Return JSON with keys: reason, season, monthIntervals, description.`,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    return res.json({ tripSuggestions: content });
  } catch (error) {
    console.error('ChatGPT trip-suggestion error:', error);
    return res.status(500).json({ error: 'Failed to fetch data from ChatGPT' });
  }
});

export default router;
