const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };

  const { email, password } = JSON.parse(event.body);
  if(!email || !password) return { statusCode:400, body:'Email and password required' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    await client.end();

    if(res.rows.length === 0) return { statusCode:400, body:'User not found' };
    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if(!match) return { statusCode:400, body:'Incorrect password' };

    return { statusCode:200, body: JSON.stringify({ name:user.name, email:user.email }) };
  } catch(err) {
    console.error(err);
    return { statusCode:500, body:'Server error' };
  }
};
