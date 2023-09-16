const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 3000;

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'quantdataDB';
const collectionName = 'options';

// Use the cors middleware
app.use(cors()); // This allows requests from all origins. You can configure it for specific origins if needed.

app.use(express.json());

let db;

async function connectToMongo() {
  const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

  try {
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToMongo();

app.get('/api/data', async (req, res) => {
  try {
    const collection = db.collection(collectionName);
    const data = await collection.find({}).sort({ tradeId: -1 }) .limit(10).toArray();
    res.json(data.reverse());
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
