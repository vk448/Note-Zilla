const { Client } = require('pg');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };

  const { email } = JSON.parse(event.body);
  if(!email) return { statusCode:400, body:'Email required' };

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM students WHERE email=$1', [email]);
    await client.end();

    if(res.rows.length === 0) return { statusCode:400, body:'No student found' };
    return { statusCode:200, body: JSON.stringify(res.rows[0]) };
  } catch(err) {
    console.error(err);
    return { statusCode:500, body:'Server error' };
  }
};
