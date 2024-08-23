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
                // Check if the response contains 'content-encoding' header and set it to the client
                if (response.headers['content-encoding']) {
                    res.set('Content-Encoding', response.headers['content-encoding']);
                }

                // Send the binary image data
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

module.exports = router;
