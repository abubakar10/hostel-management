// Quick script to generate password hash
import bcrypt from 'bcryptjs';

const password = 'admin123';
const hash = await bcrypt.hash(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse this hash in the SQL script:');
console.log(hash);

