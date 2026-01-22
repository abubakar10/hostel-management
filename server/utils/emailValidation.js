import { pool } from '../config/database.js';

/**
 * Check if an email already exists in any table (users, students, staff)
 * @param {string} email - Email address to check
 * @param {number|null} excludeUserId - User ID to exclude from check (for updates)
 * @param {number|null} excludeStudentId - Student ID to exclude from check (for updates)
 * @returns {Promise<{exists: boolean, table: string|null, message: string}>}
 */
export async function checkEmailExists(email, excludeUserId = null, excludeStudentId = null) {
  if (!email || email.trim() === '') {
    return { exists: false, table: null, message: '' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check users table
    let userQuery = 'SELECT id, email, username FROM users WHERE LOWER(email) = $1';
    const userParams = [normalizedEmail];
    
    if (excludeUserId) {
      userQuery += ' AND id != $2';
      userParams.push(excludeUserId);
    }

    const userResult = await pool.query(userQuery, userParams);
    if (userResult.rows.length > 0) {
      return {
        exists: true,
        table: 'users',
        message: 'This email is already registered as an admin/staff account'
      };
    }

    // Check students table
    let studentQuery = 'SELECT id, email, student_id FROM students WHERE LOWER(email) = $1';
    const studentParams = [normalizedEmail];
    
    if (excludeStudentId) {
      studentQuery += ' AND id != $2';
      studentParams.push(excludeStudentId);
    }

    const studentResult = await pool.query(studentQuery, studentParams);
    if (studentResult.rows.length > 0) {
      return {
        exists: true,
        table: 'students',
        message: 'This email is already registered as a student account'
      };
    }

    // Check staff table (if it exists and has email)
    try {
      let staffQuery = 'SELECT id, email, staff_id FROM staff WHERE LOWER(email) = $1';
      const staffParams = [normalizedEmail];
      
      const staffResult = await pool.query(staffQuery, staffParams);
      if (staffResult.rows.length > 0) {
        return {
          exists: true,
          table: 'staff',
          message: 'This email is already registered as a staff member'
        };
      }
    } catch (staffError) {
      // Staff table might not exist, ignore
      if (staffError.code !== '42P01') {
        console.warn('Error checking staff table:', staffError.message);
      }
    }

    return { exists: false, table: null, message: '' };
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmailFormat(email) {
  if (!email || email.trim() === '') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

