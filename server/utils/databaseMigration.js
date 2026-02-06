import { pool } from '../config/database.js';

/**
 * Ensures the photo column exists in students and staff tables
 * This is a safe migration that can be run multiple times
 */
export async function ensurePhotoColumnExists() {
  try {
    // Check if photo column exists in students table
    const studentsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name = 'photo'
    `);

    if (studentsCheck.rows.length === 0) {
      console.log('📸 Adding photo column to students table...');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS photo TEXT');
      
      // Verify it was added
      const verifyStudents = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'photo'
      `);
      
      if (verifyStudents.rows.length === 0) {
        throw new Error('Failed to add photo column to students table');
      }
      console.log('✅ Photo column added to students table');
    }

    // Check if photo column exists in staff table
    const staffCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'staff' 
      AND column_name = 'photo'
    `);

    if (staffCheck.rows.length === 0) {
      console.log('📸 Adding photo column to staff table...');
      await pool.query('ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo TEXT');
      
      // Verify it was added
      const verifyStaff = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'staff' 
        AND column_name = 'photo'
      `);
      
      if (verifyStaff.rows.length === 0) {
        throw new Error('Failed to add photo column to staff table');
      }
      console.log('✅ Photo column added to staff table');
    }
  } catch (error) {
    // Log error and re-throw - we need this column to exist
    console.error('❌ Error checking/adding photo column:', error.message);
    console.error('Full error:', error);
    throw error; // Re-throw so the route handler can catch it
  }
}

