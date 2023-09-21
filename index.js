const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 3000;

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'quantdataDB';
const collectionName = 'options';

const { optionsPipeline } = require("./mongoPipeline");

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
    const searchTickerList = Object.values(req.query);
    const collection = db.collection(collectionName);

    let optionsData;
    let pipeline = []
    if (searchTickerList.length == 0) {
      optionsData = await collection.find({}).sort({ tradeId: -1 }).limit(10).toArray();
    } else {
      optionsData = await collection.find({ ticker: { $in: searchTickerList } }).sort({ tradeId: -1 }).limit(10).toArray();
      pipeline.push({
        ticker: { $in: searchTickerList },
      },)
    }
    pipeline = [...pipeline, ...optionsPipeline];
    let result = await collection.aggregate(pipeline).toArray();

    if (result.length > 0) {
      const [callResult, putResult] = [result[0], result[1]];
      res.json({
        optionsData: optionsData.reverse(),
        callTotalVolume: callResult.totalVolume,
        putTotalVolume: putResult.totalVolume,
        callTotalPremiumPriceInCents: callResult.totalPremiumPriceInCents,
        putTotalPremiumPriceInCents: putResult.totalPremiumPriceInCents
      });

      /*
      const sumVolume = optionsData.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.volume;
      }, 0);

      const sumTotalPremiumPriceInCents = optionsData.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.premiumPriceInCents;
      }, 0); */

    } else {
      res.json({
        optionsData: [],
        callTotalVolume: 0,
        putTotalVolume: 0,
        callTotalPremiumPriceInCents: 0,
        putTotalPremiumPriceInCents: 0
      });
    }
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
