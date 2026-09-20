import jwt from 'jsonwebtoken';

const INSECURE_FALLBACK = 'your_jwt_secret_key_here';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === INSECURE_FALLBACK) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw new Error('JWT_SECRET is not set. Add a long random value in environment variables.');
    }
    console.warn('WARNING: JWT_SECRET is missing. Using a development-only secret. Set JWT_SECRET before going live.');
    return 'dev-only-insecure-secret-change-me';
  }
  return secret;
}

export function signStaffToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, typ: 'staff' },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '12h' }
  );
}

export function signStudentToken(student) {
  return jwt.sign(
    {
      id: student.id,
      student_id: student.student_id,
      email: student.email,
      role: 'student',
      typ: 'student',
      studentData: true
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '12h' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}
