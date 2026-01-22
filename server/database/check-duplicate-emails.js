/**
 * Script to check for duplicate emails across users, students, and staff tables
 * Run: node server/database/check-duplicate-emails.js
 */

import { pool } from '../config/database.js';

async function checkDuplicateEmails() {
  try {
    console.log('🔍 Checking for duplicate emails across all tables...\n');

    // Get all emails from users table
    const usersResult = await pool.query(`
      SELECT id, email, username, 'users' as table_name
      FROM users
      WHERE email IS NOT NULL AND email != ''
    `);

    // Get all emails from students table
    const studentsResult = await pool.query(`
      SELECT id, email, student_id as identifier, 'students' as table_name
      FROM students
      WHERE email IS NOT NULL AND email != ''
    `);

    // Get all emails from staff table (if exists)
    let staffResult = { rows: [] };
    try {
      staffResult = await pool.query(`
        SELECT id, email, staff_id as identifier, 'staff' as table_name
        FROM staff
        WHERE email IS NOT NULL AND email != ''
      `);
    } catch (error) {
      if (error.code !== '42P01') {
        console.warn('⚠️  Could not check staff table:', error.message);
      }
    }

    // Combine all emails
    const allEmails = [
      ...usersResult.rows.map(row => ({ ...row, identifier: row.username })),
      ...studentsResult.rows,
      ...staffResult.rows
    ];

    // Find duplicates (case-insensitive)
    const emailMap = new Map();
    const duplicates = [];

    for (const row of allEmails) {
      const normalizedEmail = row.email.toLowerCase().trim();
      if (!emailMap.has(normalizedEmail)) {
        emailMap.set(normalizedEmail, []);
      }
      emailMap.get(normalizedEmail).push(row);
    }

    // Find emails that appear in multiple tables
    for (const [email, records] of emailMap.entries()) {
      const uniqueTables = new Set(records.map(r => r.table_name));
      if (uniqueTables.size > 1) {
        duplicates.push({
          email,
          records,
          tables: Array.from(uniqueTables)
        });
      }
    }

    // Display results
    if (duplicates.length === 0) {
      console.log('✅ No duplicate emails found across tables!\n');
      console.log(`📊 Summary:`);
      console.log(`   - Users: ${usersResult.rows.length} emails`);
      console.log(`   - Students: ${studentsResult.rows.length} emails`);
      console.log(`   - Staff: ${staffResult.rows.length} emails`);
      console.log(`   - Total unique emails: ${emailMap.size}`);
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate email(s) across tables:\n`);
      
      for (const dup of duplicates) {
        console.log(`📧 Email: ${dup.email}`);
        console.log(`   Found in tables: ${dup.tables.join(', ')}`);
        for (const record of dup.records) {
          console.log(`   - ${record.table_name} (ID: ${record.id}, Identifier: ${record.identifier || 'N/A'})`);
        }
        console.log('');
      }

      console.log('\n⚠️  WARNING: These duplicates violate the email uniqueness constraint!');
      console.log('   Please resolve these duplicates manually or use the cleanup script.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking duplicate emails:', error);
    process.exit(1);
  }
}

checkDuplicateEmails();

