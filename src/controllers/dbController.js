const { MongoClient } = require('mongodb');
const config = require('../config/env');

let client;
let database;
let connectionPromise;

async function connectDB() {
  if (database) return database;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const mongoClient = new MongoClient(config.mongoUri, {
      appName: 'whatssap-bot-api',
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });

    try {
      await mongoClient.connect();
      client = mongoClient;
      database = mongoClient.db(config.databaseName);
      console.log('[MongoDB] Connected.');
      return database;
    } catch (error) {
      await mongoClient.close().catch(() => {});
      console.error('[MongoDB] Connection failed:', error.name, error.code || 'unknown');
      throw new Error('Could not connect to the configured MongoDB.', { cause: error });
    }
  })().catch((error) => {
    connectionPromise = undefined;
    throw error;
  });

  return connectionPromise;
}

async function getCollection(collectionName) {
  if (typeof collectionName !== 'string' || collectionName.trim() === '') {
    throw new TypeError('A collection name is required.');
  }
  const connectedDatabase = await connectDB();
  return connectedDatabase.collection(collectionName);
}

async function closeDB() {
  if (!client) return;
  const clientToClose = client;
  client = undefined;
  database = undefined;
  connectionPromise = undefined;
  await clientToClose.close();
  console.log('[MongoDB] Connection closed.');
}

module.exports = { connectDB, getCollection, closeDB };
