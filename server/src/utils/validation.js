const AppError = require('./AppError');

function validateId(value, fieldName = 'id') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  return id;
}

function validateBody(body, rules, requireAll) {
  const cleanData = {};
  const allowedFields = Object.keys(rules);
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    throw new AppError(`Unknown field: ${unknownFields[0]}`, 400);
  }

  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];

    if (value === undefined) {
      if (requireAll && rule.required) {
        throw new AppError(`${field} is required`, 400);
      }
      continue;
    }

    cleanData[field] = rule.validate(value, field);
  }

  if (!requireAll && Object.keys(cleanData).length === 0) {
    throw new AppError('At least one field is required', 400);
  }

  return cleanData;
}

function stringRule({ required = false, allowEmpty = false, maxLength } = {}) {
  return {
    required,
    validate(value, field) {
      if (typeof value !== 'string') {
        throw new AppError(`${field} must be a string`, 400);
      }

      const cleanValue = value.trim();

      if (!allowEmpty && cleanValue.length === 0) {
        throw new AppError(`${field} cannot be empty`, 400);
      }

      if (maxLength && cleanValue.length > maxLength) {
        throw new AppError(`${field} must be at most ${maxLength} characters`, 400);
      }

      return cleanValue;
    }
  };
}

function positiveIntegerRule({ required = false } = {}) {
  return {
    required,
    validate: validateId
  };
}

function booleanRule({ required = false } = {}) {
  return {
    required,
    validate(value, field) {
      if (typeof value !== 'boolean') {
        throw new AppError(`${field} must be true or false`, 400);
      }

      return value;
    }
  };
}

module.exports = {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule,
  booleanRule
};
