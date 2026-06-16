const bcrypt = require('bcryptjs');
const usersRepository = require('../repositories/usersRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule
} = require('../utils/validation');
const {
  parseListQuery,
  parseBoolean,
  parseEnum
} = require('../utils/query');
const auditService = require('./auditService');

const profileRules = {
  name: stringRule({ maxLength: 100 }),
  username: stringRule({ maxLength: 50 }),
  email: stringRule({ maxLength: 100 })
};

const adminUpdateRules = {
  ...profileRules,
  role: {
    validate(value) {
      if (value !== 'user' && value !== 'admin') {
        throw new AppError('role must be user or admin', 400);
      }
      return value;
    }
  }
};

const passwordRules = {
  currentPassword: stringRule({ required: true }),
  newPassword: stringRule({ required: true, maxLength: 255 })
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'id',
      name: 'name',
      username: 'username',
      email: 'email',
      role: 'role',
      isBlocked: 'is_blocked',
      updatedAt: 'updated_at'
    },
    filters: {
      role: parseEnum(['user', 'admin']),
      isBlocked: parseBoolean
    }
  });
  const result = await usersRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const user = await usersRepository.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function getCurrentUser(currentUser) {
  return getById(currentUser.id);
}

async function updateOwnProfile(currentUser, body) {
  const data = validateBody(body, profileRules, false);
  const user = await usersRepository.updateProfile(currentUser.id, data);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await auditService.record({
    actorUserId: currentUser.id,
    targetUserId: currentUser.id,
    action: 'user.profile_updated',
    entityType: 'user',
    entityId: currentUser.id,
    metadata: { fields: Object.keys(data) }
  });

  return user;
}

async function updateAsAdmin(rawId, body, adminUser) {
  const id = validateId(rawId);
  const data = validateBody(body, adminUpdateRules, false);
  const existingUser = await usersRepository.findById(id);

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (data.role === 'user' && existingUser.role === 'admin') {
    const adminCount = await usersRepository.countAdmins();

    if (adminCount <= 1) {
      throw new AppError('Cannot remove the last admin account', 400);
    }
  }

  const user = await usersRepository.updateProfile(id, data);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await auditService.record({
    actorUserId: adminUser?.id,
    targetUserId: id,
    action: data.role && data.role !== existingUser.role
      ? 'admin.user_role_changed'
      : 'admin.user_updated',
    entityType: 'user',
    entityId: id,
    metadata: { fields: Object.keys(data), previousRole: existingUser.role, newRole: user.role }
  });

  return user;
}

async function changeOwnPassword(currentUser, body) {
  const data = validateBody(body, passwordRules, true);
  const passwordHash = await usersRepository.findPasswordHash(currentUser.id);

  if (!passwordHash) {
    throw new AppError('Password record not found', 404);
  }

  const isMatch = await bcrypt.compare(data.currentPassword, passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
  await usersRepository.updatePasswordHash(currentUser.id, newPasswordHash);

  await auditService.record({
    actorUserId: currentUser.id,
    targetUserId: currentUser.id,
    action: 'user.password_changed',
    entityType: 'user',
    entityId: currentUser.id
  });

  return { id: currentUser.id };
}

async function blockUser(rawId, adminUser) {
  const id = validateId(rawId);

  if (id === adminUser.id) {
    throw new AppError('Admins cannot block themselves', 400);
  }

  const user = await usersRepository.block(id, adminUser.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await auditService.record({
    actorUserId: adminUser.id,
    targetUserId: id,
    action: 'admin.user_blocked',
    entityType: 'user',
    entityId: id
  });

  return user;
}

async function unblockUser(rawId, adminUser) {
  const id = validateId(rawId);
  const user = await usersRepository.unblock(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await auditService.record({
    actorUserId: adminUser?.id,
    targetUserId: id,
    action: 'admin.user_unblocked',
    entityType: 'user',
    entityId: id
  });

  return user;
}

module.exports = {
  getAll,
  getById,
  getCurrentUser,
  updateOwnProfile,
  updateAsAdmin,
  changeOwnPassword,
  blockUser,
  unblockUser
};
