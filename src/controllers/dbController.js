// controllers/dbController.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.NOME_DB;
let client = null;
let db = null;

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('[MongoDB] Conectado com sucesso');
    return db;
  } catch (err) {
    console.error('[MongoDB] Erro na conexão:', err);
    throw err;
  }
}

async function getCollection(collectionName) {
  const database = await connectDB();
  return database.collection(collectionName);
}

module.exports = {
  connectDB,
  getCollection,
};
