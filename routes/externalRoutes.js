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

module.exports = router;