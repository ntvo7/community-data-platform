// Seeds a local development database with test data. Run with: node seed.js
// The users below are test accounts for local development only.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { clients, orgs, events, users, services } = require('./models/models');

const saltRounds = 10;
const org = process.env.ORG_ID;

// refuse to write to anything other than a local database
if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)[:/]/.test(process.env.MONGO_URL)) {
  console.error('MONGO_URL is not a local database, nothing was seeded');
  process.exit(1);
}

// event dates are relative to today so that they appear on the dashboard, which shows the past two months
const daysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// fixed ids so that running the script again updates the documents instead of duplicating them
const id = (suffix) => `64e0380b3cc28d08765500${suffix}`;

const testUsers = [
  { _id: id('01'), username: 'test_editor', password: 'editor-local-only', role: 'editor', org },
  { _id: id('02'), username: 'test_viewer', password: 'viewer-local-only', role: 'viewer', org }
];

const testServices = [
  { _id: id('11'), name: 'Food Pantry', description: 'Weekly groceries for families', status: 'Active', org },
  { _id: id('12'), name: 'Health Screening', description: 'Free basic health checks', status: 'Active', org },
  { _id: id('13'), name: 'Tax Assistance', description: 'Help filing tax returns', status: 'Inactive', org }
];

const testClients = [
  { _id: id('21'), firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com', phoneNumber: { primary: '7135550101' }, address: { line1: '100 Main St', city: 'Houston', county: 'Harris', zip: '77002' }, orgs: [org] },
  { _id: id('22'), firstName: 'Sam', lastName: 'Tran', email: 'sam@example.com', phoneNumber: { primary: '7135550102' }, address: { line1: '200 Oak Ave', city: 'Houston', county: 'Harris', zip: '77002' }, orgs: [org] },
  { _id: id('23'), firstName: 'Jordan', lastName: 'Lee', email: 'jordan@example.com', phoneNumber: { primary: '7135550103' }, address: { line1: '300 Elm St', city: 'Houston', county: 'Harris', zip: '77004' }, orgs: [org] },
  { _id: id('24'), firstName: 'Casey', lastName: 'Nguyen', email: 'casey@example.com', phoneNumber: { primary: '7135550104' }, address: { line1: '400 Pine Rd', city: 'Pasadena', county: 'Harris', zip: '77506' }, orgs: [org] }
];

const testEvents = [
  { _id: id('31'), org, name: 'Community Food Drive', services: [id('11')], date: daysFromToday(-30), address: { line1: '100 Main St', city: 'Houston', county: 'Harris', zip: '77002' }, description: 'Monthly food drive', attendees: [id('21'), id('22'), id('23')] },
  { _id: id('32'), org, name: 'Health Fair', services: [id('11'), id('12')], date: daysFromToday(-7), address: { line1: '300 Elm St', city: 'Houston', county: 'Harris', zip: '77004' }, description: 'Free screenings and groceries', attendees: [id('22'), id('24')] },
  { _id: id('33'), org, name: 'Back to School Night', services: [id('12')], date: daysFromToday(14), address: { line1: '400 Pine Rd', city: 'Pasadena', county: 'Harris', zip: '77506' }, description: 'Upcoming family event', attendees: [id('21')] }
];

const upsertAll = (model, docs) =>
  Promise.all(docs.map((doc) => model.replaceOne({ _id: doc._id }, doc, { upsert: true })));

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const hashedUsers = await Promise.all(
    testUsers.map(async (user) => ({ ...user, password: await bcrypt.hash(user.password, saltRounds) }))
  );
  await upsertAll(orgs, [{ _id: org, name: 'Community Center' }]);
  await upsertAll(users, hashedUsers);
  await upsertAll(services, testServices);
  await upsertAll(clients, testClients);
  await upsertAll(events, testEvents);
  console.log('Seeded', mongoose.connection.name);
};

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
