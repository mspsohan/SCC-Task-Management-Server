const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()

app.use(cors())
app.use(express.json())


const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
      client.connect();

      const userCollection = client.db("SccTaskDB").collection("users");
      const taskCollection = client.db("SccTaskDB").collection("allTask");



      // Get all User Data
      app.get("/users", async (req, res) => {
         const result = await userCollection.find().toArray()
         res.send(result)
      })

      // Post All User Data
      app.post("/users/:email", async (req, res) => {
         try {
            const email = req.params.email;
            const userData = req.body;

            const existingUser = await userCollection.findOne({ email });

            if (existingUser) {
               return res.send({ error: "User with this email already exists" });
            }

            const result = await userCollection.insertOne(userData);
            res.send(result);
         } catch (error) {
            res.send({ error: "Internal server error" });
         }
      });


      // Get All Task Data
      app.get("/allTask", async (req, res) => {
         const email = req.query?.email
         const result = await taskCollection.find({ email: email }).toArray()
         res.send(result)
      })

      // Save Task To Database
      app.post("/create-task", async (req, res) => {
         const taskData = req.body;
         const saveTask = {
            ...taskData,
            status: 'Todo',
            taskCreatedAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
         };
         try {
            const result = await taskCollection.insertOne(saveTask);
            res.send(result);
         } catch (error) {
            res.status(500).send({ error: 'Internal Server Error' });
         }
      });

      app.put('/tasks/update/:id', async (req, res) => {
         const id = req.params.id;
         const { updateData } = req.body;
         try {
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateTask = {
               $set: {
                  taskTitle: updateData?.taskTitle,
                  priority: updateData?.priority,
                  deadline: updateData?.deadline,
                  taskDescription: updateData?.taskDescription
               }
            }
            const result = await taskCollection.updateOne(query, updateTask, options);
            res.send(result)
         } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal server error.' });
         }
      });



      app.patch('/tasks/status/:taskId', async (req, res) => {
         const { taskId } = req.params;
         const { status } = req.body;

         try {
            const existingTask = await taskCollection.findOne({ _id: new ObjectId(taskId) });

            if (!existingTask) {
               return res.status(404).send({ error: 'Task not found' });
            }

            // Check if the status is the same
            if (existingTask.status === status) {
               return res.send({ message: 'Task status is already set to the requested status.' });
            }

            const result = await taskCollection.updateOne(
               { _id: new ObjectId(taskId) },
               { $set: { status } }
            );

            res.send(result);
         } catch (error) {
            res.status(500).send({ error: error.message });
         }
      });

      app.delete("/allTasks/:id", async (req, res) => {
         const id = req.params.id
         const result = await taskCollection.deleteOne({ _id: new ObjectId(id) })
         res.send(result)
      })





      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
   }
}
run().catch(console.dir);

app.get('/', (req, res) => {
   res.send('SCC-Task-Management Server is Running')
})

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
   console.log(`SCC-Task-Management Server is running on port ${port}`);
});