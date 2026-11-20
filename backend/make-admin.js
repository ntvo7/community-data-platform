// Makes a user the organization's admin, who can manage user accounts in the app.
// Use it once to set up the first admin:
//
//     node make-admin.js <username>
//
// If the user exists, they become an admin and keep their password.
// If not, the script asks for a password and creates them as an admin.
//
// It changes the database in MONGO_URL, so check it points where you expect. To set up the
// admin on the live site, run it with your MongoDB Atlas connection string:
//
//     MONGO_URL="<Atlas connection string>" node make-admin.js <username>
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

const { users } = require('./models/models');

const MIN_PASSWORD_LENGTH = 8;
const org = process.env.ORG_ID;
const username = (process.argv[2] || '').trim();

// Asks questions in the terminal. Answers are hidden when typed in a terminal.
// Lines are queued as they arrive, so answers piped in all at once are not lost.
let reader;
const lines = [];
const waiting = [];
const askHidden = (question) => {
  if (!reader) {
    reader = readline.createInterface({ input: process.stdin, terminal: !!process.stdin.isTTY });
    reader.on('line', (line) => {
      if (process.stdin.isTTY) process.stdout.write('\n');
      if (waiting.length) waiting.shift()(line);
      else lines.push(line);
    });
  }
  // only the question is printed: the reader has no output, so typed characters are not shown
  process.stdout.write(question);
  return new Promise((resolve) => {
    if (lines.length) resolve(lines.shift());
    else waiting.push(resolve);
  });
};

const run = async () => {
  if (!username) throw new Error('Usage: node make-admin.js <username>');
  if (!org) throw new Error('ORG_ID is not set in backend/.env');
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not set');

  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to database "${mongoose.connection.name}"`);

  const existing = await users.findOne({ username: username, org: org }, { role: 1 });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`${username} is already an admin.`);
      return;
    }
    await users.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
    console.log(`${username} is now an admin. Log out and back in to see User Management.`);
    return;
  }

  console.log(`There is no user named "${username}" yet, so the script will create one.`);
  const password = await askHidden(`Password for ${username} (at least ${MIN_PASSWORD_LENGTH} characters): `);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters. Nothing was changed.`);
  }
  const again = await askHidden('Type the password again: ');
  if (again !== password) throw new Error('The passwords do not match. Nothing was changed.');

  await users.create({
    _id: new mongoose.Types.ObjectId(),
    username,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
    org
  });
  console.log(`Created ${username} as an admin. You can log in now.`);
};

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    if (reader) reader.close();
    return mongoose.disconnect();
  });
