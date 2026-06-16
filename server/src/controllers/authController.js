const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/authRepository');
const AppError = require('../utils/AppError');
const {
  createSessionCookie,
  createClearSessionCookie,
  parseSessionCookie,
  verifySessionToken
} = require('../utils/authToken');
const auditService = require('../services/auditService');

async function register(req, res, next) {
  try {
    const { name, username, email, password } = req.body;
    
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await authRepository.findUserWithPassword(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await authRepository.createUserWithPassword({ name, username, email }, passwordHash);

    await auditService.record({
      actorUserId: newUser.id,
      targetUserId: newUser.id,
      action: 'auth.registered',
      entityType: 'user',
      entityId: newUser.id,
      metadata: { username: newUser.username }
    });

    // As per prompt format requirements
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await authRepository.findUserWithPassword(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (user.is_blocked) {
      throw new AppError('Your account is blocked', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Return user details without the hash
    const { password_hash, ...userWithoutPassword } = user;

    await auditService.record({
      actorUserId: user.id,
      targetUserId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id
    });

    res.setHeader('Set-Cookie', createSessionCookie(userWithoutPassword));
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  const payload = verifySessionToken(parseSessionCookie(req.headers.cookie));

  if (payload?.sub) {
    await auditService.record({
      actorUserId: payload.sub,
      targetUserId: payload.sub,
      action: 'auth.logout',
      entityType: 'user',
      entityId: payload.sub
    });
  }

  res.setHeader('Set-Cookie', createClearSessionCookie());
  res.status(200).json({
    success: true,
    data: { loggedOut: true }
  });
}

module.exports = {
  register,
  login,
  logout
};
