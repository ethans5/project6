const AppError = require('./AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const COMMON_QUERY_FIELDS = ['page', 'limit', 'sortBy', 'order', 'search'];

function getSingleValue(query, field) {
  const value = query[field];

  if (Array.isArray(value)) {
    throw new AppError(`${field} must be provided only once`, 400);
  }

  return value;
}

function parsePositiveInteger(value, field) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(`${field} must be a positive integer`, 400);
  }

  return number;
}

function parseBoolean(value, field) {
  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  throw new AppError(`${field} must be true or false`, 400);
}

function parseString(value, field) {
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a string`, 400);
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    throw new AppError(`${field} cannot be empty`, 400);
  }

  return cleanValue;
}

function parseEnum(allowedValues) {
  return (value, field) => {
    const cleanValue = parseString(value, field);

    if (!allowedValues.includes(cleanValue)) {
      throw new AppError(`${field} must be one of: ${allowedValues.join(', ')}`, 400);
    }

    return cleanValue;
  };
}

function parseListQuery(query, config) {
  const filterParsers = config.filters || {};
  const allowedFields = [
    ...COMMON_QUERY_FIELDS,
    ...Object.keys(filterParsers)
  ];
  const unknownField = Object.keys(query).find(
    (field) => !allowedFields.includes(field)
  );

  if (unknownField) {
    throw new AppError(`Unknown query parameter: ${unknownField}`, 400);
  }

  const page = query.page === undefined
    ? DEFAULT_PAGE
    : parsePositiveInteger(getSingleValue(query, 'page'), 'page');
  const limit = query.limit === undefined
    ? DEFAULT_LIMIT
    : parsePositiveInteger(getSingleValue(query, 'limit'), 'limit');

  if (limit > MAX_LIMIT) {
    throw new AppError(`limit must be at most ${MAX_LIMIT}`, 400);
  }

  const sortBy = query.sortBy === undefined
    ? (config.defaultSortBy || 'id')
    : parseString(getSingleValue(query, 'sortBy'), 'sortBy');
  const sortColumn = config.sortFields[sortBy];

  if (!sortColumn) {
    throw new AppError(`sortBy must be one of: ${Object.keys(config.sortFields).join(', ')}`, 400);
  }

  const order = query.order === undefined
    ? 'asc'
    : parseString(getSingleValue(query, 'order'), 'order').toLowerCase();

  if (order !== 'asc' && order !== 'desc') {
    throw new AppError('order must be asc or desc', 400);
  }

  const search = query.search === undefined
    ? undefined
    : parseString(getSingleValue(query, 'search'), 'search');

  const filters = {};
  for (const [field, parser] of Object.entries(filterParsers)) {
    if (query[field] !== undefined) {
      filters[field] = parser(getSingleValue(query, field), field);
    }
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortColumn,
    order: order.toUpperCase(),
    search,
    filters
  };
}

function setPaginationHeaders(res, result, queryOptions) {
  const totalPages = Math.ceil(result.total / queryOptions.limit);

  res.setHeader('X-Total-Count', String(result.total));
  res.setHeader('X-Page', String(queryOptions.page));
  res.setHeader('X-Limit', String(queryOptions.limit));
  res.setHeader('X-Total-Pages', String(totalPages));
}

module.exports = {
  parseListQuery,
  parsePositiveInteger,
  parseBoolean,
  parseString,
  parseEnum,
  setPaginationHeaders
};
