import mongoose from "mongoose";

const MONGO_URI = process.env.NEXT_PUBLIC_MONGO_DB_URI || "";

if (!MONGO_URI) {
  throw new Error(
    "Missing NEXT_PUBLIC_MONGO_DB_URI environment variable."
  );
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global._mongooseCache || { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        dbName: undefined,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  global._mongooseCache = cached;
  return cached.conn;
}



