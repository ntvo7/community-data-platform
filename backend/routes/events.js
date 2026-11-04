// This file contains API endpoints for interacting with the "events" collection in the MongoDB database
const express = require("express");
const router = express.Router();

const org = process.env.ORG_ID;

// Middleware for authorization. For API calls that require authorization, this middleware checks if the header of API calls have a valid security token. If no security token or invalid security token, then the API call is not made.
const authMiddleWare = require("../auth/authMiddleWare");
// Middleware that only lets editors make API calls that change data
const requireEditor = require("../auth/requireEditor");
const escapeRegex = require("../utils/escapeRegex");

// importing data model schemas
const { events, clients } = require("../models/models");

// API endpoint to get all events for org
router.get("/", authMiddleWare, (req, res, next) => {
  events
    .find({ org: org }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        return res.json(data);
      }
    })
    // sort by date descending
    .sort({ date: -1 });
});

// API endpoint to GET single event by ID
router.get("/id/:id", authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send("Event not found");
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events based on search query
// Ex: '...?name=Food&searchBy=name'
router.get("/search/", authMiddleWare, (req, res, next) => {
  const dbQuery = { org: org };
  switch (req.query.searchBy) {
    case "name":
      dbQuery.name = { $regex: escapeRegex(req.query.name), $options: "i" };
      break;
    case "date": {
      // match the whole day, since stored dates can include a time. Dates are displayed in UTC.
      const dayStart = new Date(`${req.query.eventDate}T00:00:00.000Z`);
      if (isNaN(dayStart)) {
        return res.status(400).send("invalid eventDate");
      }
      const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      dbQuery.date = { $gte: dayStart, $lt: nextDay };
      break;
    }
    default:
      return res.status(400).send("invalid searchBy");
  }
  events.find(dbQuery, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is signed up
router.get("/client/:id", authMiddleWare, (req, res, next) => {
  events.find({ attendees: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is not signed up
router.get(
  "/client/:id/not-registered",
  authMiddleWare,
  async (req, res, next) => {
    try {
      const eventsNotRegistered = await events.find({
        attendees: { $nin: [req.params.id] },
        org: org,
      });
      res.json(eventsNotRegistered);
    } catch (error) {
      next(error);
    }
  }
);

// API endpoint to GET attendee details for an event
router.get("/attendees/:id", authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, event) => {
    if (error) {
      return next(error);
    } else {
      if (!event)
        res.status(400).send("Event not found")
      else {
        const attendeeIds = event.attendees.map((attendee) =>
          attendee.toString()
        );
        clients.find({ _id: { $in: attendeeIds }, orgs: org }, (error, clients) => {
          if (error) {
            return next(error);
          } else {
            res.json(clients);
          }
        });
      }
    };
  });
});

// API endpoint to GET all events for a given service
router.get("/service/:id", authMiddleWare, async (req, res, next) => {
  try {
    const eventsWithService = await events
      .find({ services: { $in: [req.params.id] }, org: org })
      .select({ _id: 1, name: 1, date: 1, address: { line1: 1 } })
      .lean();
    res.json(eventsWithService);
  } catch (error) {
    next(error);
  }
});

// API endpoint to POST new event
router.post("/", authMiddleWare, requireEditor, (req, res, next) => {
  const newEvent = req.body;
  newEvent.org = org;
  events.create(newEvent, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.status(200).send("New event created successfully");
    }
  });
});

// API endpoint to PUT -> update event
router.put("/update/:id", authMiddleWare, requireEditor, (req, res, next) => {
  // an event's organization cannot be changed through an update
  const { org: ignoredOrg, ...updates } = req.body;
  events.findOneAndUpdate(
    { _id: req.params.id, org: org },
    updates,
    { runValidators: true },
    (error, data) => {
      if (error) {
        return next(error);
      } else if (!data) {
        res.status(400).send("Event not found");
      } else {
        res.status(200).send("Event updated successfully");
      }
    }
  );
});

// API endpoint to PUT -> add attendee to event
router.put("/register", authMiddleWare, requireEditor, async (req, res, next) => {
  const { event: eventId, client: clientId } = req.query;
  if (typeof eventId !== "string" || typeof clientId !== "string") {
    return res.status(400).send("event and client are required");
  }

  try {
    // both the event and the client have to exist in this org
    const event = await events.findOne({ _id: eventId, org: org });
    if (!event) {
      return res.status(400).send("Event not found");
    }
    const client = await clients.findOne({ _id: clientId, orgs: org });
    if (!client) {
      return res.status(400).send("Client not found");
    }

    // only add attendee if not yet signed up
    if (event.attendees.some((attendee) => attendee.toString() === clientId)) {
      return res.status(400).send("Client already added to event");
    }
    await events.updateOne({ _id: eventId }, { $push: { attendees: clientId } });
    res.status(200).send("Client added to event");
  } catch (error) {
    next(error);
  }
});

// API endpoint to PUT -> remove attendee from event
router.put("/deregister", authMiddleWare, requireEditor, (req, res, next) => {
  events.findOneAndUpdate(
    { _id: req.query.event, org: org },
    { $pull: { attendees: req.query.client } },
    (error, data) => {
      if (error) {
        return next(error);
      } else if (!data) {
        res.status(400).send("Event not found");
      } else {
        clients.findOneAndUpdate(
          { _id: req.query.client, orgs: org },
          { $pull: { events: req.query.event } },
          (error, data) => {
            if (error) {
              return next(error);
            } else {
              res.send("Client deregistered with event");
            }
          }
        );
      }
    }
  );
});

// API endpoint to hard DELETE event by ID
router.delete("/:id", authMiddleWare, requireEditor, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send("Event not found");
    } else {
      // only delete event if no clients are signed up
      if (data.attendees.length === 0) {
        events.findOneAndDelete(
          { _id: req.params.id, org: org },
          (error, data) => {
            if (error) {
              return next(error);
            } else if (!data) {
              res.status(400).send("Event not found");
            } else {
              res.status(200).send("Event deleted successfully");
            }
          }
        );
      } else {
        res.status(400).send("Event has attendees and can't be deleted.");
      }
    }
  });
});

// GET event attendance for the past two months for dashboard
router.get("/attendance", (req, res, next) => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  events
    .find({ org: org, date: { $gte: twoMonthsAgo } }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.json(data);
      }
    })
    .sort({ date: 1 });
});

module.exports = router;
