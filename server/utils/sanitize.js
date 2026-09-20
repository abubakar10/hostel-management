export function stripPassword(row) {
  if (!row || typeof row !== 'object') return row;
  const { password, ...safe } = row;
  return safe;
}

export function stripPasswords(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(stripPassword);
}

export function publicError(error, fallback = 'Something went wrong. Please try again.') {
  if (process.env.NODE_ENV === 'development') {
    return error?.message || fallback;
  }
  return fallback;
}
