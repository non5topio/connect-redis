import {Cookie} from "express-session"
import {Redis} from "ioredis"
import {promisify} from "node:util"
import {createClient} from "redis"
import {expect, test} from "vitest"
import {RedisStore} from "./"
import * as redisSrv from "./testdata/server"
import { vi } from "vitest"
import { promisify } from "node:util"
import { Cookie } from "express-session";
import { createClient } from "redis";
import { promisify } from "node:util";
import { vi } from "vitest";

test("setup", async () => {
  await redisSrv.connect()
})

test("defaults", async () => {
  let client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()

  let store = new RedisStore({client})

  expect(store.client).toBeDefined()
  expect(store.prefix).toBe("sess:")
  expect(store.ttl).toBe(86400) // defaults to one day
  expect(store.scanCount).toBe(100)
  expect(store.serializer).toBe(JSON)
  expect(store.disableTouch).toBe(false)
  expect(store.disableTTL).toBe(false)
  await client.disconnect()
})

// test("session with expired cookie", async () => {
//   const client = createClient({url: `redis://localhost:${redisSrv.port}`})
//   await client.connect()
  
//   const store = new RedisStore({client})
//   const sid = "expired-session-id"
  
//   // Create a session with an expired cookie
//   const pastDate = new Date(Date.now() - 10000) // 10 seconds in the past
//   const sess = {
//     cookie: { expires: pastDate }
//   }
  
//   // Set should call destroy internally for expired sessions
//   const destroySpy = vi.spyOn(store, 'destroy')
//   await promisify(store.set.bind(store))(sid, sess)
  
//   // Verify destroy was called
//   expect(destroySpy).toHaveBeenCalledWith(sid, expect.any(Function))
  
//   // Verify session doesn't exist
//   const result = await promisify(store.get.bind(store))(sid)
//   expect(result).toBeUndefined()
  
//   destroySpy.mockRestore()
//   await client.disconnect()
// })


// test("clear length and ids methods", async () => {
//   const client = createClient({url: `redis://localhost:${redisSrv.port}`})
//   await client.connect()
  
//   const store = new RedisStore({client})
  
//   // Clear any existing sessions
//   await promisify(store.clear.bind(store))()
  
//   // Create multiple sessions
//   const sessions = [
//     { id: "session1", data: { cookie: {}, value: "data1" } },
//     { id: "session2", data: { cookie: {}, value: "data2" } },
//     { id: "session3", data: { cookie: {}, value: "data3" } }
//   ]
  
//   for (const session of sessions) {
//     await promisify(store.set.bind(store))(session.id, session.data)
//   }
  
//   // Test length
//   const length = await promisify(store.length.bind(store))()
//   expect(length).toBe(sessions.length)
  
//   // Test ids
//   const ids = await promisify(store.ids.bind(store))()
//   expect(ids).toHaveLength(sessions.length)
//   expect(ids.sort()).toEqual(sessions.map(s => s.id).sort())
  
//   // Test all method
//   const allSessions = await promisify(store.all.bind(store))()
//   expect(allSessions).toHaveLength(sessions.length)
  
//   // Test clear
//   await promisify(store.clear.bind(store))()
//   const lengthAfterClear = await promisify(store.length.bind(store))()
//   expect(lengthAfterClear).toBe(0)
  
//   await client.disconnect()
// })


// test("handle Redis client errors", async () => {
//   // Create a mock client that throws errors
//   const mockClient = {
//     get: vi.fn().mockRejectedValue(new Error("get error")),
//     set: vi.fn().mockRejectedValue(new Error("set error")),
//     expire: vi.fn().mockRejectedValue(new Error("expire error")),
//     del: vi.fn().mockRejectedValue(new Error("del error")),
//     mget: vi.fn().mockRejectedValue(new Error("mget error")),
//     scanIterator: vi.fn().mockImplementation(() => {
//       throw new Error("scan error")
//     })
//   }
  
//   const store = new RedisStore({client: mockClient})
  
//   // Test get error handling
//   await expect(promisify(store.get.bind(store))("test-id"))
//     .rejects.toThrow("get error")
  
//   // Test set error handling
//   await expect(promisify(store.set.bind(store))("test-id", {cookie: {}}))
//     .rejects.toThrow("set error")
  
//   // Test touch error handling
//   await expect(promisify(store.touch.bind(store))("test-id", {cookie: {}}))
//     .rejects.toThrow("expire error")
  
//   // Test destroy error handling
//   await expect(promisify(store.destroy.bind(store))("test-id"))
//     .rejects.toThrow("del error")
  
//   // Test clear error handling
//   await expect(promisify(store.clear.bind(store))())
//     .rejects.toThrow("scan error")
  
//   // Test length error handling
//   await expect(promisify(store.length.bind(store))())
//     .rejects.toThrow("scan error")
  
//   // Test ids error handling
//   await expect(promisify(store.ids.bind(store))())
//     .rejects.toThrow("scan error")
  
//   // Test all error handling
//   await expect(promisify(store.all.bind(store))())
//     .rejects.toThrow("scan error")
// })


// test("handle whitespace-only session ID", async () => {
//   const client = createClient({url: `redis://localhost:${redisSrv.port}`})
//   await client.connect()
  
//   const store = new RedisStore({client})
//   const sid = "   "
//   const sess = { cookie: {}, data: "whitespace-session-id" }
  
//   // Set the session
//   await promisify(store.set.bind(store))(sid, sess)
  
//   // Get the session
//   const result = await promisify(store.get.bind(store))(sid)
  
//   // Verify the session was stored and retrieved correctly
//   expect(result).toEqual(sess)
  
//   // Verify that the key with whitespace is correctly stored
//   const keys = await store["_getAllKeys"]()
//   expect(keys).toContain(store.prefix + sid)
  
//   // Clean up
//   await promisify(store.destroy.bind(store))(sid)
//   await client.disconnect()
// })


// test("handle empty session ID", async () => {
//   const client = createClient({url: `redis://localhost:${redisSrv.port}`})
//   await client.connect()
  
//   const store = new RedisStore({client})
//   const sid = ""
//   const sess = { cookie: {}, data: "empty-session-id" }
  
//   // Set the session
//   await promisify(store.set.bind(store))(sid, sess)
  
//   // Get the session
//   const result = await promisify(store.get.bind(store))(sid)
  
//   // Verify the session was stored and retrieved correctly
//   expect(result).toEqual(sess)
  
//   // Verify that only the prefix key is set in Redis
//   const keys = await store["_getAllKeys"]()
//   expect(keys).toContain(store.prefix)
  
//   // Clean up
//   await promisify(store.destroy.bind(store))(sid)
//   await client.disconnect()
// })


// test("handle extremely large session ID", async () => {
//   const client = createClient({url: `redis://localhost:${redisSrv.port}`})
//   await client.connect()
  
//   const store = new RedisStore({client})
//   const sid = "x".repeat(100000) // 100,000+ character session ID
//   const sess = { cookie: {}, data: "test data" }
  
//   // Set the session
//   await promisify(store.set.bind(store))(sid, sess)
  
//   // Get the session
//   const result = await promisify(store.get.bind(store))(sid)
  
//   // Verify the session was stored and retrieved correctly
//   expect(result).toEqual(sess)
  
//   // Clean up
//   await promisify(store.destroy.bind(store))(sid)
//   await client.disconnect()
// })

// test("normalizeClient set without TTL", async () => {
//   // Mock redis client (v4+)
//   const mockRedisClient = {
//     get: vi.fn(),
//     set: vi.fn(),
//     del: vi.fn(),
//     expire: vi.fn(),
//     mGet: vi.fn(),
//     scanIterator: vi.fn().mockImplementation(() => async function*() {}()), // Make it identifiable as redis v4+
//   }
//   const redisStore = new RedisStore({ client: mockRedisClient, disableTTL: true }) // disableTTL ensures set is called without ttl internally

//   // Call set via store, which uses normalizeClient internally
//   await promisify(redisStore.set.bind(redisStore))("redis-key", { cookie: {} })
//   // Expect underlying client.set to be called with only key and value
//   expect(mockRedisClient.set).toHaveBeenCalledWith(redisStore.prefix + "redis-key", expect.any(String))
//   expect(mockRedisClient.set).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything())


//   // Mock ioredis client
//   const mockIoRedisClient = {
//     get: vi.fn(),
//     set: vi.fn(),
//     del: vi.fn(),
//     expire: vi.fn(),
//     mget: vi.fn(),
//     scan: vi.fn().mockResolvedValue(["0", []]), // Make it identifiable as ioredis
//   }
//   const ioredisStore = new RedisStore({ client: mockIoRedisClient, disableTTL: true })

//   // Call set via store
//   await promisify(ioredisStore.set.bind(ioredisStore))("ioredis-key", { cookie: {} })
//   // Expect underlying client.set to be called with only key and value
//   expect(mockIoRedisClient.set).toHaveBeenCalledWith(ioredisStore.prefix + "ioredis-key", expect.any(String))
//   expect(mockIoRedisClient.set).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything())
// })


// test("successful touch operation", async () => {
//   const client = createClient({ url: `redis://localhost:${redisSrv.port}` })
//   await client.connect()
//   const store = new RedisStore({ client, ttl: 60 }) // Default 60s TTL
//   const sid = "successful-touch-sid"
//   const initialSess = { cookie: {} }
//   const touchSess = { cookie: { expires: new Date(Date.now() + 120 * 1000) } } // Expires in 120s

//   try {
//     // Set initial session
//     await promisify(store.set.bind(store))(sid, initialSess)
//     const initialTTL = await client.ttl(store.prefix + sid)
//     expect(initialTTL).toBeGreaterThan(0)
//     expect(initialTTL).toBeLessThanOrEqual(60)

//     // Touch the session to update TTL
//     const touchResult = await promisify(store.touch.bind(store))(sid, touchSess)
//     expect(touchResult).toBeUndefined() // Callback should receive (null), promisified gives undefined

//     // Verify TTL was updated
//     const updatedTTL = await client.ttl(store.prefix + sid)
//     expect(updatedTTL).toBeGreaterThan(60) // Should be around 120 now
//     expect(updatedTTL).toBeLessThanOrEqual(120)

//   } finally {
//     await store.destroy(sid)
//     await client.disconnect()
//   }
// })

test("get with malformed data in Redis", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` })
  await client.connect()
  const store = new RedisStore({ client, prefix: "malformed:" })
  const sid = "malformed-data-sid-1"
  const key = store.prefix + sid
  const malformedData = "{invalid json"

  try {
    // Manually set malformed data in Redis
    await client.set(key, malformedData)

    // Attempt to get the session
    await expect(promisify(store.get.bind(store))(sid))
      .rejects.toThrow() // Expect JSON parse error or similar

    // Verify the key still exists (get shouldn't delete it)
    const redisVal = await client.get(key)
    expect(redisVal).toBe(malformedData)

  } finally {
    // Clean up
    await client.del(key)
    await client.disconnect()
  }
})


test("set with TTL function returning 0", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` })
  await client.connect()
  const ttlFunc = vi.fn((_sess) => 0)
  const store = new RedisStore({ client, ttl: ttlFunc, prefix: "ttlzero:" })
  const sid = "ttl-zero-sid-1"
  const sess = { cookie: new Cookie() }
  const key = store.prefix + sid

  const destroySpy = vi.spyOn(store, 'destroy')
  const clientDelSpy = vi.spyOn(store.client, 'del')
  const clientSetSpy = vi.spyOn(store.client, 'set')

  try {
    await promisify(store.set.bind(store))(sid, sess)

    expect(ttlFunc).toHaveBeenCalledWith(sess)
    // Check that destroy was called internally
    expect(destroySpy).toHaveBeenCalledWith(sid, expect.any(Function))
    // Check that client.del was called by destroy
    expect(clientDelSpy).toHaveBeenCalledWith([key])
    // Check that client.set was NOT called
    expect(clientSetSpy).not.toHaveBeenCalled()

    // Verify data does not exist
    const result = await promisify(store.get.bind(store))(sid)
    expect(result).toBeUndefined()
    const redisVal = await client.get(key)
    expect(redisVal).toBeNull()

  } finally {
    destroySpy.mockRestore()
    await client.disconnect()
  }
})

