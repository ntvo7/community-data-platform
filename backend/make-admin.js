// Makes an existing user the organization's admin, who can manage user accounts in the app.
// Use it once to set up the first admin: node make-admin.js <username>
// It changes the database in MONGO_URL, so check backend/.env points where you expect.
const mongoose = require('mongoose');
require('dotenv').config();

const { users } = require('./models/models');

const username = process.argv[2];
if (!username) {
  console.error('Usage: node make-admin.js <username>');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const result = await users.updateOne(
    { username: username, org: process.env.ORG_ID },
    { $set: { role: 'admin' } }
  );
  if (!result.matchedCount) {
    console.error(`No user named "${username}" in this organization`);
    process.exitCode = 1;
  } else {
    console.log(`${username} is now an admin. Log out and back in to see User Management.`);
  }
};

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
