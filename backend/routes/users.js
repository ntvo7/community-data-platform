// This file contains all API endpoints for interacting with the "users" collection in the MongoDB database
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
// import bcrypt for comparing password to hashed password
const bcrypt = require('bcrypt');
// import JWT (JSON Web Token) to create a web token to the user after a successful login - allows user to make API calls
const jwt = require('jsonwebtoken');

// import users data model schema
const { users } = require('../models/models');
const authMiddleWare = require('../auth/authMiddleWare');
const requireAdmin = require('../auth/requireAdmin');

const org = process.env.ORG_ID;
const saltRounds = 10;

// admin: manages user accounts. editor: creates and edits records. viewer: read only.
const ROLES = ['admin', 'editor', 'viewer'];
const MIN_PASSWORD_LENGTH = 8;

// sends a 400 error with a message for the user
const badRequest = (res, message) => res.status(400).json({ message });

const checkPassword = (password) =>
  typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH
    ? null
    : `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

// API endpoint to handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // same message for every failure, so the response does not reveal which usernames exist
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  try {
    const user = await users.findOne({ username: username, org: org });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const payload = {
      id: user._id,
      name: user.username,
      role: user.role
    };

    // token expires in 30 days. This is not best security practice but still demonstrates how JWT work
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Everything below is user management, for admins only
router.use(authMiddleWare, requireAdmin);

// GET all users of the organization, without their passwords
router.get('/', async (req, res, next) => {
  try {
    const list = await users.find({ org: org }, { username: 1, role: 1 }).sort({ username: 1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// POST a new user
router.post('/', async (req, res, next) => {
  const { password, role } = req.body;
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

  if (username.length < 3) return badRequest(res, 'Username must be at least 3 characters');
  if (!ROLES.includes(role)) return badRequest(res, 'Role must be admin, editor or viewer');
  const passwordError = checkPassword(password);
  if (passwordError) return badRequest(res, passwordError);

  try {
    if (await users.exists({ username: username, org: org })) {
      return badRequest(res, 'That username is already taken');
    }
    await users.create({
      _id: new mongoose.Types.ObjectId(),
      username,
      password: await bcrypt.hash(password, saltRounds),
      role,
      org
    });
    res.status(201).send('User created');
  } catch (err) {
    next(err);
  }
});

// PUT a new role and/or a new password for a user
router.put('/:id', async (req, res, next) => {
  const { role, password } = req.body;
  const update = {};

  if (role !== undefined) {
    if (!ROLES.includes(role)) return badRequest(res, 'Role must be admin, editor or viewer');
    // the organization always keeps the admin who is making the change
    if (req.params.id === req.user.id && role !== 'admin') {
      return badRequest(res, 'You cannot remove your own admin role');
    }
    update.role = role;
  }
  if (password !== undefined) {
    const passwordError = checkPassword(password);
    if (passwordError) return badRequest(res, passwordError);
    update.password = await bcrypt.hash(password, saltRounds);
  }
  if (!Object.keys(update).length) return badRequest(res, 'Nothing to update');

  try {
    const result = await users.updateOne({ _id: req.params.id, org: org }, { $set: update });
    if (!result.matchedCount) return res.status(404).send('User not found');
    res.send(update.password && !update.role ? 'Password changed' : 'User updated');
  } catch (err) {
    next(err);
  }
});

// DELETE a user
router.delete('/:id', async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return badRequest(res, 'You cannot delete your own account');
  }
  try {
    const result = await users.deleteOne({ _id: req.params.id, org: org });
    if (!result.deletedCount) return res.status(404).send('User not found');
    res.send('User deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
