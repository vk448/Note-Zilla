const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };

  const { name, email, password } = JSON.parse(event.body);
  if(!name || !email || !password) return { statusCode:400, body:'All fields required' };

  const hashedPassword = await bcrypt.hash(password, 10);
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if(res.rows.length > 0) { await client.end(); return { statusCode:400, body:'Email already registered' }; }

    await client.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3)', [name,email,hashedPassword]);
    await client.end();
    return { statusCode:200, body:'User registered successfully' };
  } catch(err) {
    console.error(err);
    return { statusCode:500, body:'Server error' };
  }
};
