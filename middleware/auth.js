import { jwtVerify } from 'jose';

const getJwtSecret = (secret) => new TextEncoder().encode(secret);

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ msg: 'Invalid Authentication' });

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();
    if (!token) return res.status(401).json({ msg: 'Invalid Authentication' });

    const { payload } = await jwtVerify(token, getJwtSecret(process.env.ACCESS_TOKEN_SECRET));
    req.user = payload;
    next();
  } catch (error) {
    if (error.code?.startsWith('ERR_JWT')) {
      return res.status(401).json({ msg: error.message });
    }
    return res.status(500).json({ msg: error.message });
  }
};

export default auth;
