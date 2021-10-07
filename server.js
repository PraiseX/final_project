const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const session = require("express-session");

const mongoUri =
  "mongodb+srv://groupAdmin:groupPassword@cluster0.9zsah.mongodb.net/";

const mongoClient = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoClient.connect((err) => {
  console.log("Mongo client connected :)");
});

const app = express();

app.use(
  session({ secret: "fortnite", resave: false, saveUninitialized: true })
);
app.use(express.json());
app.use(express.static("build"));
app.use(express.urlencoded({ extended: true }));

/*
===================================================
USER AUTHENTICATION ROUTES
===================================================
POST /login
POST /signup
GET /me
*/

/*
Try to log the user in
Give them a cookie to keep track of them
If invalid login info, respond with 400
*/

app.post("/login", async (req, res) => {
  const userInfo = req.body;
  const userLookup = await mongoClient
    .db("final")
    .collection("users")
    .findOne(userInfo);

  if (!userLookup) {
    console.log(`Login failed attempted user/pass:`);
    console.log(userInfo);
    res.status(400).end();
    return;
  }

  console.log(`Session is now logged in as ${userLookup.username}`);
  req.session.username = userLookup.username;
  console.log(req.session);
  res.json(userLookup);
});

/*
Attempt to create a new user with the specified username/password
If duplicate username, respond with 400
*/
app.post("/signup", async (req, res) => {
  const userInfo = req.body;
  const existingUser = await mongoClient
    .db("final")
    .collection("users")
    .findOne({ username: req.body.username });

  if (existingUser) {
    console.log(
      `Attempted to sign up with existing username: ${existingUser.username}`
    );
    res.status(400).end();
    return;
  }

  const insertRes = await mongoClient
    .db("final")
    .collection("users")
    .insertOne({
      ...userInfo,
      workouts: [],
    });

  console.log(`Added new user with username ${userInfo.username}`);

  console.log("Logging in by setting session username");
  req.session.username = userInfo.username;
  console.log(req.session);
  res.json(userInfo);
});

/*
Respond with a json object of the currently logged in user, and all their lifting data
If not logged in, respond with a 401
*/
app.get("/me", async (req, res) => {
  if (!req.session.username) {
    console.log("Non-logged person tried /me");
    res.status(401).end();
    return;
  }
  const userRes = await mongoClient
    .db("final")
    .collection("users")
    .findOne({ username: req.session.username });

  if (!userRes) {
    console.log("Session has an invalid username (THIS SHOULD NEVER HAPPEN)");
    res.status(401).end();
    return;
  }
  console.log(`Reminding user ${req.session.username} of all their data`);
  //console.log(userRes);
  res.json(userRes);
});

app.delete("/me", (req, res) => {
  console.log(`Logging out ${req.session.username}`);
  req.session.destroy();
  res.status(200).end();
});

// WORKOUT MODIFICATIONS

app.post("/workout", async (req, res) => {
  if (!req.session.username) {
    console.log("Not even logged in wtf");
    res.status(401).end();
  }
  console.log(`Adding new workout for user ${req.session.username}`);
  const updateRes = await mongoClient
    .db("final")
    .collection("users")
    .updateOne(
      { username: req.session.username },
      {
        $push: {
          workouts: {
            _id: new ObjectId().toHexString(),
            name: `New workout ${new Date().toTimeString()}`,
            movements: [],
          },
        },
      }
    );
  res.status(200).end();
});

app.patch("/movement", async (req, res) => {
  console.log("Received PATCH to /movement")
  if (!req.session.username) {
    console.log("Not even logged in wtf");
    res.status(401).end();
  }
  console.log(`Modifying movement for user ${req.session.username}`);
  console.log(`Modifying movement for workout ${req.query.workout_id}`);

  const updateRes = await mongoClient
    .db("final")
    .collection("users")
    .updateOne(
      {
        username: req.session.username,
        "workouts._id": req.query.workout_id,
        "workouts.movements.name": req.body.name
      },

      { $set:
        {
         "workouts.$.movements.$": req.body 
        } 
      } 
    );

  res.status(200).end();
})

app.post("/movement", async (req, res) => {
  console.log("Received POST to /movement");
  if (!req.session.username) {
    console.log("Not even logged in wtf");
    res.status(401).end();
  }
  console.log(`Adding new movement for user ${req.session.username}`);
  console.log(`Adding new movement for workout ${req.query.workout_id}`);

  const updateRes = await mongoClient
    .db("final")
    .collection("users")
    .updateOne(
      {
        username: req.session.username,
        "workouts._id": req.query.workout_id,
      },

      { $push: { "workouts.$.movements": req.body } }
    );
  res.status(200).end();
});

// Although we want express.static, we are using react-router for routing so we only need index.html
// Define all GET routes before this so that we don't accidentaly send index.html when we want something else
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

/*
Attempt to create a new user with the specified username/password
If duplicate username, respond with 400
*/
app.delete("/workout", async (req, res) => {
  //{workoutid:}
  //const userInfo = req.body;

  /*
  const existingUser = await mongoClient
    .db("final")
    .collection("users")
    .findOne({ username: req.session.username });

  if (!existingUser) {
    res.json(userInfo);
  }
  */

  console.log("Deleting workout " + req.query._id);

  await mongoClient
    .db("final")
    .collection("users")
    .updateOne(
      { username: req.session.username },
      { $pull: { workouts: { _id: req.query._id } } }
    );

  res.status(200).end();
});

app.listen(3000);
