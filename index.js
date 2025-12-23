const express = require('express')
var cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// ================= MongoDB URI with hardcoded user/pass =================
const uri = `mongodb+srv://rohan92:IlovemymotheR92@ticketbari.y5ynq6m.mongodb.net/?appName=TicketBari`;

const stripe = require('stripe')('sk_test_51ShPbtC3Eh2jVY1mzXw0iVq2FeI0bXmXdb29OOZpzgaUtaa7bpzjVBVO1P63egwnCfXWGK3FSoUhyH4xTHvqJpvj00tp8aaf08');

// ================= MongoDB Connection Cache =================
let cachedClient = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;

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

// ================= Base Route =================
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// ================= Main Run Function =================
async function run() {
  try {
    const client = await getMongoClient();

    const usersDB = client.db('usersDB');
    const usersColl = usersDB.collection('usersColl');

    const ticketDB = client.db('ticketDB');
    const ticketColl = ticketDB.collection('ticketColl');

    const buyTicketDB = client.db('buyTicketDB');
    const buyTicketColl = buyTicketDB.collection('buyTicketColl');

    // ============== USERS ==============
    app.post('/users-coll', async (req, res) => {
      const user = req.body;
      if (!user) return res.status(400).send({ message: 'No user data received' });
      const result = await usersColl.insertOne(user);
      res.send(result);
    });

    app.patch('/users-coll/:id', async (req, res) => {
      const { id } = req.params;
      const userData = req.body;

      const result = await usersColl.updateOne(
        { _id: new ObjectId(id) },
        { $set: userData }
      );

      res.send({
        success: true,
        modifiedCount: result.modifiedCount,
        result
      });
    });

    app.get('/users-coll', async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) query = { email: email };

        const cursor = usersColl.find(query);
        const allValues = await cursor.toArray();
        res.send(allValues);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch users' });
      }
    });

    // ============== TICKETS ==============
    app.post('/ticket-coll', async (req, res) => {
      const info = req.body;
      if (!info) return res.status(400).send({ message: 'No data received' });
      const result = await ticketColl.insertOne(info);
      res.send(result);
    });

    app.get('/user-ticket-coll', async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) query = { vendorEmail: email };

        const cursor = ticketColl.find(query);
        const allValues = await cursor.toArray();
        res.send(allValues);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch users' });
      }
    });

    app.get('/ticket-coll/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const ticket = await ticketColl.findOne({ _id: new ObjectId(id) });
        if (!ticket) return res.status(404).send({ message: "Ticket not found" });
        res.send(ticket);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch ticket" });
      }
    });

    app.patch('/ticket-coll/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedTicket = req.body;

        const result = await ticketColl.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedTicket }
        );

        res.send({
          success: true,
          modifiedCount: result.modifiedCount,
          result
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Update failed" });
      }
    });

    app.delete('/ticket-coll/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const result = await ticketColl.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ success: false, message: "Ticket not found" });

        res.send({ success: true, deletedCount: result.deletedCount, message: "Ticket deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Delete failed" });
      }
    });

    app.get('/ticket-coll', async (req, res) => {
      try {
        const { fromLocation, toLocation, departureDate } = req.query;
        let query = { verificationStatus: "approved" };
        if (fromLocation) query.fromLocation = fromLocation;
        if (toLocation) query.toLocation = toLocation;
        if (departureDate) query.departureDate = departureDate;

        const tickets = await ticketColl.find(query).toArray();
        res.send(tickets);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch tickets" });
      }
    });

    app.get('/ticket-coll-pending', async (req, res) => {
      try {
        const { fromLocation, toLocation, departureDate } = req.query;
        let query = { verificationStatus: "pending" };
        if (fromLocation) query.fromLocation = fromLocation;
        if (toLocation) query.toLocation = toLocation;
        if (departureDate) query.departureDate = departureDate;

        const tickets = await ticketColl.find(query).toArray();
        res.send(tickets);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch tickets" });
      }
    });

    // ============== BOOKINGS ==============
    app.post('/booking-ticket', async (req, res) => {
      const data = req.body;
      if (!data) return res.status(400).send({ message: 'No data received' });
      const result = await buyTicketColl.insertOne(data);
      res.send(result);
    });

    app.get('/booking-ticket', async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) query = { bookingEmail: email };

        const cursor = buyTicketColl.find(query);
        const allValues = await cursor.toArray();
        res.send(allValues);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch users' });
      }
    });

    app.patch('/booking-ticket-pending/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedBookingTicket = req.body;

        const result = await buyTicketColl.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedBookingTicket }
        );

        res.send({ success: true, modifiedCount: result.modifiedCount, result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Update failed" });
      }
    });

    app.get('/booking-ticket-pending', async (req, res) => {
      try {
        let { email } = req.query;
        if (!email) return res.status(400).send({ message: "Vendor email is required" });

        email = email.trim().toLowerCase();
        const query = { bookingStatus: "pending", vendorsEmail: email };

        const tickets = await buyTicketColl.find(query).toArray();
        res.send(tickets);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch tickets" });
      }
    });

    // Stripe Integrate


 app.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      title,
      totalPrice,
      quantity,
      userEmail,
      imageUrl,
      bookingId,
    } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      customer_email: userEmail,

      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: title,
              images: imageUrl ? [imageUrl] : [],
            },
            unit_amount: Math.round((totalPrice / quantity) * 100),
          },
          quantity: quantity,
        },
      ],

      metadata: {
        bookingId: bookingId,
        userEmail: userEmail,
      },

      success_url: `http://localhost:5173/payment-success?bookingId=${bookingId}`,
      cancel_url: `http://localhost:5173/payment-cancel`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Stripe session failed' });
  }
});


    

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
});

  } finally {
    // Do not close client, cached for Vercel
  }
}

run().catch(console.dir);


