# Backend

This implementation is for NodeJS based on [Express](https://expressjs.com/) and [MongoDB](https://www.mongodb.com/) and uses [mongoose](https://mongoosejs.com/) as the ODM.

## Project setup

Install all dependencies.

    npm install

### Before startup
You need to setup a MongoDB database (can be local or remote).

Make sure you have a collection named 'org' in your database that contains at least one organization with the orgid listed in your environment variable (see below).

An example document inside the org collection in the DB could look like:
```
{
    "_id" : ObjectId("64e0380b3cc28d087655693b"),
    "name" : "Community Center"
}
```

The database also needs to contain users with hashed passwords and their role. We provide a sample script to create hashed passwords. Please read more about hased password with bcrypt https://heynode.com/blog/2020-04/salt-and-hash-passwords-bcrypt/. There should be at least one user with the viewer role and one with the editor role.

An example document inside the 'users' collection in the DB could look like:
```
{
    "_id" : ObjectId("64e03e5e3cc28d0886756963"),
    "username" : "marry",
    "role" : "editor",
    "password" : "$2b$10$Vt4jS2ORVImiuyhvAbS1DO8tnEUB0buUUadpFVoho6TfJXzKbRi8a",
    "org" : ObjectId("64e0380b3cc28d087655693b")
}
```

### User roles
Each user has one of three roles:

- `admin` (Main Admin): everything an editor can do, plus the User Management page, where they add users, change roles, reset passwords and delete accounts.
- `editor` (Authorized User): creates and edits clients, events and services.
- `viewer`: can look at records but not change them.

To make your own account the first admin, run this once, then log out and back in:

    node make-admin.js <your username>

Setup a .env file with the following variables: MONGO_URL, PORT, ORG_ID and JWT_SECRET

    MONGO_URL= that is the Mongo URL connection string
    PORT= e.g.3000
    ORG_ID = that is the orgid
    JWT_SECRET=this can be a randomly generated string. It is used to verify JWT tokens

### Compiles and hot-reloads for development

To start up the backend for devlopment run:

    npm start

## Postman Documentation

More details about the API endpoints can be be found at <https://documenter.getpostman.com/view/25012176/2s9Y5Zv1xz>
