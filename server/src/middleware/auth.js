const usersRepository = require('../repositories/usersRepository');
const AppError = require('../utils/AppError');
const { parseSessionCookie, verifySessionToken } = require('../utils/authToken');

async function requireAuth(req, res, next) {
  try {
    const token = parseSessionCookie(req.headers.cookie);
    const payload = verifySessionToken(token);

    if (!payload) {
      throw new AppError('Authentication required', 401);
    }

    const user = await usersRepository.findById(payload.sub);
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (user.is_blocked) {
      throw new AppError('Your account is blocked', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
