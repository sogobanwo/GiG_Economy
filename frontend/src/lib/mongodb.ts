import { MongoClient, Db, ServerApiVersion } from 'mongodb'

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

const globalAny = global as any

export async function getDb(): Promise<Db> {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error('Missing MONGODB_URI or MONGODB_DB in environment')
  }

  if (!globalAny._mongoClientPromise) {
    const uri = process.env.MONGODB_URI
    // Configure client with Atlas-friendly defaults and optional dev TLS relaxations
    const isDev = process.env.NODE_ENV !== 'production'
    const allowInsecureTls = process.env.MONGODB_TLS_INSECURE === 'true'
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      tls: true,
      // Only relax TLS in local/dev when explicitly enabled
      tlsAllowInvalidCertificates: isDev && allowInsecureTls ? true : false,
      tlsAllowInvalidHostnames: isDev && allowInsecureTls ? true : false,
    })
    globalAny._mongoClientPromise = client.connect()
  }
  clientPromise = globalAny._mongoClientPromise

  const conn = await clientPromise!
  return conn.db(process.env.MONGODB_DB)
}