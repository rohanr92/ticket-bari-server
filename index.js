const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://rohan92:IlovemymotheR92@ticketbari.y5ynq6m.mongodb.net/?appName=TicketBari";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    const usersDB = client.db('usersDB');
    const usersColl = usersDB.collection('usersColl');


    const ticketDB = client.db('ticketDB');
    const ticketColl = ticketDB.collection('ticketColl')

    const buyTicketDB = client.db('buyTicketDB');
    const buyTicketColl = buyTicketDB.collection('buyTicketColl');


    // User Post

    app.post('/users-coll', async (req, res) => {
      const user = req.body;
      if (!user) {
        return res.status(400).send({ message: 'No user data received' });
      }
      const result = await usersColl.insertOne(user);
      res.send(result);
    })
    // user get
    // app.get('/users-coll', async (req, res) => {
    //   const cursor = usersColl.find({});
    //   const allValues = await cursor.toArray();
    //   res.send(allValues);
    // })

    // user patch

    // app.patch('/users-coll/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const { displayName, photoURL, role } = req.body;

    //   if (!email) return res.status(400).send({ message: 'Email is required' });

    //   const updateDoc = {
    //     $set: {
    //       displayName,
    //       photoURL,
    //       role,        // automatically set role
    //       updatedAt: new Date()  // timestamp
    //     },
    //     $setOnInsert: { createdAt: new Date() } // auto-create if email doesn't exist
    //   };

    //   const result = await usersColl.updateOne(
    //     { email },       // filter by email
    //     updateDoc,
    //     { upsert: true } // create if not exists
    //   );

    //   res.send({
    //     success: true,
    //     message: 'Vendor updated/created by email',
    //     result
    //   });
    // });



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



    })



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

    // Delete single ticket collection


    app.delete('/ticket-coll/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const result = await ticketColl.deleteOne({
          _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Ticket not found"
          });
        }

        res.send({
          success: true,
          deletedCount: result.deletedCount,
          message: "Ticket deleted successfully"
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Delete failed" });
      }
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


    // Ticket post

    app.post('/ticket-coll', async (req, res) => {
      const info = req.body;
      if (!info) {
        return res.status(400).send({ message: 'No data received' });
      }
      const result = await ticketColl.insertOne(info);
      res.send(result);
    })
    // get all items not approved, including, rejected, approve and others too
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
    })


    // Get ticket by id


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






    // ✅ New: Approved tickets with filters
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

    // New: Non-Approved Tickets

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


    app.post('/booking-ticket', async (req, res) => {
      const data = req.body;
      if (!data) {
        return res.status(400).send({ message: 'No data received' });
      }
      const result = await buyTicketColl.insertOne(data);
      res.send(result);
    })


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
    })




    app.patch('/booking-ticket-pending/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedBookingTicket = req.body;

        const result = await buyTicketColl.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedBookingTicket }
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



//  app.get('/booking-ticket-pending', async (req, res) => {
//   try {
//     const email = req.query.email;

//     if (!email) {
//       return res.status(400).send({ message: "Vendor email is required" });
//     }

//     const query = {
//       bookingStatus: "pending",
//       vendorsEmail: email
//     };

//     const tickets = await buyTicketColl.find(query).toArray();
//     res.send(tickets);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: "Failed to fetch tickets" });
//   }
// });

app.get('/booking-ticket-pending', async (req, res) => {
  try {
    let { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "Vendor email is required" });
    }

    // 🔥 normalize email
    email = email.trim().toLowerCase();

    const query = {
      bookingStatus: "pending",
      vendorsEmail: email
    };

    const tickets = await buyTicketColl.find(query).toArray();
    res.send(tickets);

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch tickets" });
  }
});





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
