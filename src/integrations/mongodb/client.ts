import { MongoClient, Db } from "mongodb";

const uri =
  import.meta.env.VITE_MONGODB_URI ||
  import.meta.env.MONGODB_URI ||
  (typeof process !== "undefined" ? process.env.MONGODB_URI : undefined) ||
  (typeof process !== "undefined" ? process.env.VITE_MONGODB_URI : undefined);

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    try {
      const newClient = new MongoClient(uri);
      await newClient.connect();
      client = newClient;
    } catch (err) {
      client = null;
      throw err;
    }
  }
  return client;
}

export async function getDb(): Promise<Db> {
  try {
    const activeClient = await getMongoClient();
    if (!db) {
      db = activeClient.db("nutrient");
    }
    return db;
  } catch (error) {
    client = null;
    db = null;
    throw error;
  }
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
