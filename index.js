const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://rohan92:IlovemymotheR92@ticketbari.y5ynq6m.mongodb.net/?appName=TicketBari";

let cachedClient = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  cachedClient = client;
  return cachedClient;
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

async function run() {
  try {
    const client = await getMongoClient();

    const usersColl = client.db('usersDB').collection('usersColl');
    const ticketColl = client.db('ticketDB').collection('ticketColl');
    const buyTicketColl = client.db('buyTicketDB').collection('buyTicketColl');

    /* ================= USERS ================= */

    app.post('/users-coll', async (req, res) => {
      const user = req.body;
      if (!user) return res.status(400).send({ message: 'No user data received' });
      const result = await usersColl.insertOne(user);
      res.send(result);
    });

    app.get('/users-coll', async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const users = await usersColl.find(query).toArray();
      res.send(users);
    });

    app.patch('/users-coll/:id', async (req, res) => {
      const { id } = req.params;
      const result = await usersColl.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.send(result);
    });

    /* ================= TICKETS ================= */

    app.post('/ticket-coll', async (req, res) => {
      const result = await ticketColl.insertOne(req.body);
      res.send(result);
    });

    app.get('/ticket-coll', async (req, res) => {
      const { fromLocation, toLocation, departureDate } = req.query;

      let query = { verificationStatus: "approved" };
      if (fromLocation) query.fromLocation = fromLocation;
      if (toLocation) query.toLocation = toLocation;
      if (departureDate) query.departureDate = departureDate;

      const tickets = await ticketColl.find(query).toArray();
      res.send(tickets);
    });

    app.get('/ticket-coll/:id', async (req, res) => {
      const ticket = await ticketColl.findOne({ _id: new ObjectId(req.params.id) });
      if (!ticket) return res.status(404).send({ message: "Ticket not found" });
      res.send(ticket);
    });

    app.patch('/ticket-coll/:id', async (req, res) => {
      const result = await ticketColl.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.send(result);
    });

    app.delete('/ticket-coll/:id', async (req, res) => {
      const result = await ticketColl.deleteOne({
        _id: new ObjectId(req.params.id)
      });
      res.send(result);
    });

    app.get('/ticket-coll-pending', async (req, res) => {
      const tickets = await ticketColl.find({
        verificationStatus: "pending"
      }).toArray();
      res.send(tickets);
    });

    app.get('/user-ticket-coll', async (req, res) => {
      const email = req.query.email;
      const tickets = await ticketColl.find({
        vendorEmail: email
      }).toArray();
      res.send(tickets);
    });

    /* ================= BOOKINGS ================= */

    app.post('/booking-ticket', async (req, res) => {
      const result = await buyTicketColl.insertOne(req.body);
      res.send(result);
    });

    app.get('/booking-ticket', async (req, res) => {
      const email = req.query.email;
      const query = email ? { bookingEmail: email } : {};
      const bookings = await buyTicketColl.find(query).toArray();
      res.send(bookings);
    });

    app.get('/booking-ticket-pending', async (req, res) => {
      let { email } = req.query;
      if (!email) return res.status(400).send({ message: "Vendor email required" });

      email = email.trim().toLowerCase();

      const bookings = await buyTicketColl.find({
        bookingStatus: "pending",
        vendorsEmail: email
      }).toArray();

      res.send(bookings);
    });

    app.patch('/booking-ticket-pending/:id', async (req, res) => {
      const result = await buyTicketColl.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.send(result);
    });

    console.log("MongoDB connected successfully");
  } finally {
    // no close (same as your first code)
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
