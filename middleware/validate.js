import mongoose from 'mongoose';

export const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const parsePositiveInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const validateObjectIdParam = (name) => (req, res, next) => {
  const value = req.params[name];
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ msg: `Invalid ${name}` });
  }
  return next();
};

export const requireBody = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ msg: 'Request body must be an object' });
  }
  return next();
};

export const requireStringQuery = (name, { max = 300 } = {}) => (req, res, next) => {
  const value = String(req.query[name] || '').trim();
  if (!value || value.length > max) {
    return res.status(400).json({ error: `${name} is required` });
  }
  req.query[name] = value;
  return next();
};

export const requireStringBody = (name, { max = 300 } = {}) => (req, res, next) => {
  const value = String(req.body?.[name] || '').trim();
  if (!value || value.length > max) {
    return res.status(400).json({ error: `${name} is required` });
  }
  req.body[name] = value;
  return next();
};
