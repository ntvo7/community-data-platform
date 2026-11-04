// This file contains API endpoints for interacting with the "services" collection of the MongoDB database
const express = require('express');
const router = express.Router();

// import services schema
const { services, events } = require('../models/models');

// Middleware for authorization. For API calls that require authorization, this middleware checks if the header of API calls have a valid security token. If no security token or invalid security token, then the API call is not made.
const authMiddleWare = require('../auth/authMiddleWare');
// Middleware that only lets editors make API calls that change data
const requireEditor = require('../auth/requireEditor');
const escapeRegex = require('../utils/escapeRegex');

// org id from environment
const org = process.env.ORG_ID;

// API endpoint to all services for org
router.get('/', authMiddleWare, (req, res, next) => {
  services
    .find({ org: org }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.json(data);
      }
    })
    .sort({ updatedAt: -1 });
});

// API endpoint to GET single service by ID
router.get('/id/:id', authMiddleWare, (req, res, next) => {
  services.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send('Service not found');
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET entries based on search query
router.get('/search', authMiddleWare, (req, res, next) => {
  const dbQuery = { org: org };
  switch (req.query.searchBy) {
    case 'name':
      dbQuery.name = { $regex: escapeRegex(req.query.name), $options: "i" };
      break;
    case 'description':
      dbQuery.description = {
        $regex: escapeRegex(req.query.description),
        $options: "i",
      };
      break;
    default:
      return res.status(400).send('invalid searchBy');
  }
  services.find(dbQuery, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to POST new service
router.post('/', authMiddleWare, requireEditor, (req, res, next) => {
  const newService = req.body;
  newService.org = [org];
  services.create(newService, (error, data) => {
    if (error) {
      return next(error);
    } else {
      return res.status(200).send('New service created successfully');
    }
  });
});

// API endpoint to PUT -> update service
router.put('/update/:id', authMiddleWare, requireEditor, (req, res, next) => {
  services.findByIdAndUpdate(req.params.id, req.body, (error, data) => {
    if (error) {
      return next(error);
    } else {
      if (!data)
        res.status(400).send("Service not found.")
      else
        res.status(201).send('Service updated successfully');
    }
  });
});

// API endpoint to hard DELETE event by ID
router.delete('/:id', authMiddleWare, requireEditor, async (req, res, next) => {
  // only delete service if no events are using that service
  let serviceEvents;
  try {
    serviceEvents = await events.find({ services: req.params.id, org: org });
  } catch (error) {
    // without this, a malformed ID is an unhandled rejection that stops the server
    return next(error);
  }

  if (serviceEvents.length !== 0) {
    res
        .status(400)
        .send('Service can not be deleted since it is being used by events.');
    return;
  }

  services.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send('Service not found');
    } else {
      services.findOneAndDelete(
        { _id: req.params.id, org: org },
        (error, data) => {
          if (error) {
            return next(error);
          } else if (!data) {
            res.status(400).send('Service not found');
          } else {
            res.status(200).send('Service deleted successfully');
          }
        }
      );
    }
  });
});

module.exports = router;
