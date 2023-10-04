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

app.get('/get_options', async (req, res) => {
  try {
    const searchTickerList = Object.values(req.query);
    const collection = db.collection(collectionName);

    let optionsData;
    let pipeline = []
    if (searchTickerList.length == 0) {
      optionsData = await collection.find({}).sort({ tradeId: -1 }).limit(20).toArray();
    } else {
      optionsData = await collection.find({ ticker: { $in: searchTickerList } }).sort({ tradeId: -1 }).limit(10).toArray();
      pipeline.push({
        $match: {
          $and: [
            {
              ticker: { $in: searchTickerList },
            },
          ],
        }
      })
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
      }, 0);*/

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
    console.error('Error fetching data from options collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get_news', async (req, res) => {
  try {
    let collectionName = "news"

    const collection = db.collection(collectionName);
    const searchTickerList = Object.values(req.query);

    let newsData;
    if (searchTickerList.length == 0) {
      newsData = await collection.find({}).limit(10).toArray();
    } else {
      newsData = await collection.find({
        "tickerMetadata": {
          $elemMatch: { "ticker": { $in: searchTickerList } }
        }
      }).limit(10).toArray();
    }


    res.json({ newsData: newsData });

  } catch (error) {
    console.error('Error fetching data from news collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/get_alerts', async (req, res) => {
  try {
    let collectionName = "alerts"
    const collection = db.collection(collectionName);

    let alertsData = await collection.find({}).limit(10).toArray();
    res.json({ alertsData: alertsData });

  } catch (error) {
    console.error('Error fetching data from alerts collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/get_app_gainers_losers', async (req, res) => {
  try {
    let collectionName = "app_gainers_losers"
    const collection = db.collection(collectionName);

    let appGainersLosersData = await collection.find({}).toArray();
    res.json({ appGainersLosersData: appGainersLosersData[0] });

  } catch (error) {
    console.error('Error fetching data from app_gainers_losers collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get_equities', async (req, res) => {
  try {
    let collectionName = "equities"
    const collection = db.collection(collectionName);

    let equitiesData = await collection.find({}).limit(10).toArray();
    res.json({ equitiesData: equitiesData });

  } catch (error) {
    console.error('Error fetching data from equities collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
