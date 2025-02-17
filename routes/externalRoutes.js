const express = require('express');
const https = require('https');
const router = express.Router();

// Place Details
router.get('/places-details', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLEAPIKEY;
        const placeid = req.query.placeid;

        const options = {
            hostname: 'places.googleapis.com',
            path: `/v1/places/${placeid}?fields=id,displayName,photos&key=${apiKey}`,
            method: 'GET'
        };

        const request = https.request(options, response => {
            let data = '';

            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    res.json(parsedData);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    res.status(500).json({ error: 'Failed to parse response data' });
                }
            });
        });

        request.on('error', error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        });

        request.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Photos API
router.get('/places-pics', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLEAPIKEY;
        const photoreference = req.query.photoreference;

        const options = {
            hostname: 'places.googleapis.com',
            path: `/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`,
            method: 'GET'
        };

        const request = https.request(options, response => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                if (response.headers['content-encoding']) {
                    res.set('Content-Encoding', response.headers['content-encoding']);
                }
                res.send(Buffer.from(data, 'binary'));
            });
        });

        request.on('error', error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        });

        request.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Weather API
router.get('/weather', async (req, res) => {
    try {
        const { city, state, country } = req.query;
        const apiKey = process.env.OPENWEATHERAPIKEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key is not set' });
        }

        // Construct the query based on the provided parameters
        let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}`;
        if (state) url += `,${encodeURIComponent(state)}`;
        if (country) url += `,${encodeURIComponent(country)}`;
        url += `&appid=${apiKey}&units=metric`;

        const options = {
            hostname: 'api.openweathermap.org',
            path: `/data/2.5/weather?q=${encodeURIComponent(city)}${state ? `,${encodeURIComponent(state)}` : ''}${country ? `,${encodeURIComponent(country)}` : ''}&appid=${apiKey}&units=metric`,
            method: 'GET'
        };

        const request = https.request(options, response => {
            let data = '';

            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                if (response.statusCode === 200) {
                    try {
                        const parsedData = JSON.parse(data);
                        res.json(parsedData);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        res.status(500).json({ error: 'Failed to parse response data' });
                    }
                } else if (response.statusCode === 401) {
                    res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
                } else {
                    console.error('Error fetching weather data:', data);
                    res.status(response.statusCode).json({ error: 'Failed to fetch weather data' });
                }
            });
        });

        request.on('error', error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to fetch weather data' });
        });

        request.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// ChatGPT Fun Places
router.post('/chatgpt/fun-places', async (req, res) => {
    console.log('FUN Received request body:', req.body);
    const { location } = req.body;

    try {
        // Dynamically import OpenAI directly in the route
        const { default: OpenAI } = await import('openai');  // Dynamically import OpenAI

        const openai = new OpenAI({
            organization: 'org-zhk7ZnWbeRQ2l5XQZ5Zjt14E',
            project: 'proj_bhGgO8C8Iw6Df4XXimaHkOoq',
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: `List 5 popular and must see places to visit in ${location}.` }],
        });

        const list = response.choices[0].message.content.trim();
        res.json({ funPlaces: list });
    } catch (error) {
        console.error('Error with ChatGPT API:', error);
        res.status(500).json({ error: 'Failed to fetch data from ChatGPT' });
    }
});

router.post('/chatgpt/trip-suggestion', async (req, res) => {
    console.log('Received request body:', req.body);
    const { location } = req.body;

    try {
        // Dynamically import OpenAI directly in the route
        const { default: OpenAI } = await import('openai');  // Dynamically import OpenAI

        const openai = new OpenAI({
            organization: 'org-zhk7ZnWbeRQ2l5XQZ5Zjt14E',
            project: 'proj_bhGgO8C8Iw6Df4XXimaHkOoq',
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: `Please list the 3 best time to travel to ${location}, Based on cost, experience( maybe events that happen at that place during a certain time), and time where it seems to be more popular. List the response as json ( reason, season, month intervals, and description)` }],
        });

        const resp = response.choices[0].message.content.trim();
        res.json({ tripSuggestions: resp });
    } catch (error) {
        console.error('Error with ChatGPT API:', error);
        res.status(500).json({ error: 'Failed to fetch data from ChatGPT' });
    }
});

module.exports = router;