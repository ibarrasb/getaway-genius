import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDestinationImageQuery,
  pickBestImageCandidate,
  scoreImageCandidate,
} from '../services/destinationImages.js';

test('buildDestinationImageQuery creates a city-focused image query', () => {
  assert.equal(
    buildDestinationImageQuery('Chicago, IL, USA'),
    'Chicago IL USA skyline travel city'
  );
});

test('scoreImageCandidate prefers large landscape city imagery', () => {
  const strong = scoreImageCandidate(
    {
      provider: 'unsplash',
      width: 3000,
      height: 1800,
      alt: 'Chicago skyline from downtown waterfront',
      description: 'Chicago city travel landmark view',
    },
    'Chicago, IL'
  );

  const weak = scoreImageCandidate(
    {
      provider: 'pexels',
      width: 900,
      height: 1400,
      alt: 'person eating food inside restaurant',
      description: 'interior portrait',
    },
    'Chicago, IL'
  );

  assert.ok(strong > weak);
});

test('pickBestImageCandidate returns the highest scoring valid image', () => {
  const best = pickBestImageCandidate(
    [
      {
        provider: 'pexels',
        url: 'https://example.com/portrait.jpg',
        width: 900,
        height: 1400,
        alt: 'portrait in hotel room',
      },
      {
        provider: 'unsplash',
        url: 'https://example.com/skyline.jpg',
        width: 3200,
        height: 1800,
        alt: 'New York City skyline landmark travel',
      },
    ],
    'New York, NY'
  );

  assert.equal(best.url, 'https://example.com/skyline.jpg');
  assert.equal(best.provider, 'unsplash');
});
