import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  buildTripOptionCreatePayload,
  buildTripOptionDeletionState,
  buildTripOptionReplacement,
  buildTripOptionSelectionClearState,
  buildTripOptionSelectionState,
  sanitizeCostItems,
} from '../controllers/tripCtrl.js';

test('sanitizeCostItems normalizes category item payloads', () => {
  const itemId = new mongoose.Types.ObjectId();

  const [item] = sanitizeCostItems([
    {
      _id: itemId.toString(),
      category: 'car',
      name: 'Rental',
      url: 'https://example.com',
      price: '155.50',
      quantity: '0',
      price_basis: 'per_day',
      item_type: 'rental',
      group_name: 'Transportation choice',
      is_selected: false,
      start_date: '2026-07-10',
      end_date: '2026-07-12',
      notes: 'Airport pickup',
    },
  ]);

  assert.equal(item._id, itemId.toString());
  assert.equal(item.category, 'car');
  assert.equal(item.price, 155.5);
  assert.equal(item.quantity, 1);
  assert.equal(item.is_selected, false);
  assert.ok(item.start_date instanceof Date);
  assert.ok(item.end_date instanceof Date);
});

test('buildTripOptionReplacement persists deleted cost items from the incoming payload', () => {
  const optionId = new mongoose.Types.ObjectId();
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const existing = {
    _id: optionId,
    option_title: 'Orlando option',
    status: 'considering',
    isCommitted: true,
    createdAt,
    cost_items: [
      { category: 'lodging', name: 'Hotel', price: 500, quantity: 1 },
      { category: 'flight', name: 'Flight', price: 300, quantity: 2 },
      { category: 'car', name: 'Rental', price: 150, quantity: 1 },
    ],
  };

  const replacement = buildTripOptionReplacement(existing, {
    cost_items: [
      { category: 'lodging', name: 'Hotel', price: 500, quantity: 1 },
      { category: 'car', name: 'Rental', price: 175, quantity: 1 },
    ],
  });

  assert.equal(replacement._id, optionId);
  assert.equal(replacement.isCommitted, true);
  assert.equal(replacement.createdAt, createdAt);
  assert.deepEqual(
    replacement.cost_items.map((item) => item.category),
    ['lodging', 'car']
  );
  assert.equal(replacement.cost_items[1].price, 175);
});

test('buildTripOptionReplacement supports adding category items', () => {
  const replacement = buildTripOptionReplacement(
    {
      _id: new mongoose.Types.ObjectId(),
      option_title: 'Weekend option',
      cost_items: [],
    },
    {
      cost_items: [
        { category: 'lodging', name: 'Inn', price: 220, quantity: 1 },
        { category: 'flight', name: 'Main cabin', price: 180, quantity: 2 },
      ],
    }
  );

  assert.equal(replacement.cost_items.length, 2);
  assert.equal(replacement.cost_items[0].category, 'lodging');
  assert.equal(replacement.cost_items[1].category, 'flight');
});

test('buildTripOptionCreatePayload creates a sanitized uncommitted option', () => {
  const optionId = new mongoose.Types.ObjectId();
  const createdAt = new Date('2026-02-01T00:00:00.000Z');

  const option = buildTripOptionCreatePayload(
    {
      option_title: 'Beach weekend',
      destination: 'Miami',
      status: 'not-a-status',
      trip_start: '2026-08-01',
      cost_items: [{ category: 'lodging', name: 'Hotel', price: '250' }],
    },
    { id: optionId, createdAt }
  );

  assert.equal(option._id, optionId);
  assert.equal(option.createdAt, createdAt);
  assert.equal(option.isCommitted, false);
  assert.equal(option.status, 'considering');
  assert.equal(option.cost_items[0].price, 250);
});

test('buildTripOptionSelectionState marks one option as committed', () => {
  const firstId = new mongoose.Types.ObjectId();
  const secondId = new mongoose.Types.ObjectId();
  const instances = [
    { _id: firstId, isCommitted: true },
    { _id: secondId, isCommitted: false },
  ];

  const next = buildTripOptionSelectionState(instances, secondId);

  assert.equal(next.committedInstanceId.toString(), secondId.toString());
  assert.equal(next.instances[0].isCommitted, false);
  assert.equal(next.instances[1].isCommitted, true);
});

test('buildTripOptionSelectionClearState clears only the requested option', () => {
  const firstId = new mongoose.Types.ObjectId();
  const secondId = new mongoose.Types.ObjectId();
  const instances = [
    { _id: firstId, isCommitted: false },
    { _id: secondId, isCommitted: true },
  ];

  const next = buildTripOptionSelectionClearState(instances, secondId, secondId);

  assert.equal(next.committedInstanceId, null);
  assert.equal(next.instances[0].isCommitted, false);
  assert.equal(next.instances[1].isCommitted, false);
});

test('buildTripOptionDeletionState removes an option and clears committed id when needed', () => {
  const deletedId = new mongoose.Types.ObjectId();
  const remainingId = new mongoose.Types.ObjectId();
  const instances = [
    { _id: deletedId, option_title: 'Delete me' },
    { _id: remainingId, option_title: 'Keep me' },
  ];

  const next = buildTripOptionDeletionState(instances, deletedId, deletedId);

  assert.equal(next.committedInstanceId, null);
  assert.deepEqual(
    next.instances.map((instance) => instance._id.toString()),
    [remainingId.toString()]
  );
});

test('selection helpers return null for missing option ids', () => {
  const instances = [{ _id: new mongoose.Types.ObjectId() }];
  const missingId = new mongoose.Types.ObjectId();

  assert.equal(buildTripOptionSelectionState(instances, missingId), null);
  assert.equal(buildTripOptionSelectionClearState(instances, missingId, missingId), null);
});
