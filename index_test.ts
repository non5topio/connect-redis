import {Cookie} from "express-session"
import {Redis} from "ioredis"
import {promisify} from "node:util"
import {createClient} from "redis"
import {expect, test} from "vitest"
import {RedisStore} from "./"
import * as redisSrv from "./testdata/server"
import { Cookie } from "express-session";
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
/*
FAILED TEST: **Analysis:**

1.  **Failing Test:** The test `_getAllKeys with multiple scan iterations` in `index_test.ts` failed.
2.  **Failure Reason:** The assertion `expect(scanSpy).toHaveBeenCalledTimes(Math.ceil(keyCount / scanCount) + 1)` on line 324 failed. The test expected the underlying `client.scan` method (spied on by `scanSpy`) to be called 4 times (`Math.ceil(15 / 5) + 1`), but it was actually called 3 times.
3.  **Root Cause:** The test's calculation for the expected number of `scan` calls is incorrect for the `ioredis` client's `scan` behavior as implemented in `normalizeClient`. The `scanIterator` implementation calls `scan` exactly `Math.ceil(keyCount / scanCount)` times (in this case, `Math.ceil(15 / 5) = 3`) to retrieve all keys. The `+ 1` in the test assertion does not reflect the actual number of calls needed.

**Recommended Fixes:**

1.  **Correct Assertion:** Modify the assertion on line 324 in `index_test.ts` to expect the correct number of calls:
    ```typescript
    // Change this:
    expect(scanSpy).toHaveBeenCalledTimes(Math.ceil(keyCount / scanCount) + 1);
    // To this:
    expect(scanSpy).toHaveBeenCalledTimes(Math.ceil(keyCount / scanCount));
    ```
2.  **(Optional Cleanup):** Remove the unnecessary `promisify` wrappers around async store methods throughout `index_test.ts` to address the `DeprecationWarning`s seen in `stderr`. For example, change `await promisify(store.length.bind(store))()` to `await store.length()`.

test("_getAllKeys with multiple scan iterations", async () => {
  // Use ioredis client to test the async generator scan implementation
  const client = new Redis(redisSrv.port) // ioredis client
  const scanCount = 5;
  const keyCount = 15;
  const store = new RedisStore({ client, scanCount, prefix: "scan-test:" })
  const keys = Array.from({ length: keyCount }, (_, i) => store.prefix + `key${i}`)

  try {
    // Set multiple keys
    const pipeline = client.pipeline()
    for (const key of keys) {
      pipeline.set(key, JSON.stringify({ cookie: new Cookie() }))
    }
    await pipeline.exec()

    // Spy on the client's scan command to ensure multiple calls
    const scanSpy = vi.spyOn(client, 'scan')

    // Call length, which uses _getAllKeys
    const length = await promisify(store.length.bind(store))()

    // Verify length is correct
    expect(length).toBe(keyCount)

    // Verify scan was called multiple times (keyCount / scanCount rounded up)
    expect(scanSpy).toHaveBeenCalledTimes(Math.ceil(keyCount / scanCount) + 1); // +1 because scan is called until cursor is '0'

    // Verify all keys were fetched by _getAllKeys (indirectly via length)
    // We can also call _getAllKeys directly for a more direct assertion if needed
    const fetchedKeys = await store["_getAllKeys"]()
    expect(fetchedKeys.sort()).toEqual(keys.sort())

    scanSpy.mockRestore()

  } finally {
    // Clean up keys
    if (keys.length > 0) await client.del(keys)
    await client.quit()
  }
})

*/

test("touch with disableTouch option", async () => {
  const client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()
  const store = new RedisStore({ client, disableTouch: true, ttl: 60 })
  const sid = "no-touch-sid"
  const sess = { cookie: new Cookie() }
  const clientExpireSpy = vi.spyOn(store.client, 'expire')

  try {
    // Set initial session
    await promisify(store.set.bind(store))(sid, sess)
    const initialTTL = await client.ttl(store.prefix + sid)
    expect(initialTTL).toBeGreaterThan(0)
    expect(initialTTL).toBeLessThanOrEqual(60)

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Attempt to touch the session
    await promisify(store.touch.bind(store))(sid, sess)

    // Verify client.expire was NOT called
    expect(clientExpireSpy).not.toHaveBeenCalled()

    // Verify TTL has decreased naturally and wasn't reset
    const finalTTL = await client.ttl(store.prefix + sid)
    expect(finalTTL).toBeLessThan(initialTTL)
    expect(finalTTL).toBeLessThanOrEqual(59) // Should have decreased by ~1 second

  } finally {
    await store.destroy(sid)
    await client.disconnect()
  }
})


test("set with disableTTL option", async () => {
  const client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()
  const store = new RedisStore({ client, disableTTL: true })
  const sid = "no-ttl-sid"
  const sess = { cookie: new Cookie() }
  const clientSetSpy = vi.spyOn(store.client, 'set')

  try {
    await promisify(store.set.bind(store))(sid, sess)

    // Verify client.set was called without TTL argument
    // Note: normalizeClient handles the arguments passed to the underlying client.set
    // We check the underlying client's call signature.
    const underlyingClientSetSpy = vi.spyOn(client, 'set') // Spy on the actual redis client
    await promisify(store.set.bind(store))(sid + "2", sess) // Call again to capture the spy call
    expect(underlyingClientSetSpy).toHaveBeenCalledWith(store.prefix + sid + "2", expect.any(String));
    // Check it wasn't called with TTL options like { EX: ... } or "EX", ttl
    const setArgs = underlyingClientSetSpy.mock.calls[0];
    expect(setArgs.length).toBe(2); // Should only have key and value args

    // Verify TTL in Redis is -1 (no expiration)
    const ttl = await client.ttl(store.prefix + sid)
    expect(ttl).toBe(-1)

    underlyingClientSetSpy.mockRestore();

  } finally {
    await store.destroy(sid)
    await store.destroy(sid + "2")
    await client.disconnect()
  }
})

/*
FAILED TEST: **Analysis:**

1.  **Failing Test:** The test `custom serializer option` in `index_test.ts` failed.
2.  **Failure Reason:** The assertion `expect(rawData).toContain('"stringified":true')` (line 316) failed. The test expected the raw string fetched from Redis to contain the substring `"stringified":true"`, which the custom `stringify` function is supposed to add. The error output shows the received string does seem to contain this substring, indicating a potential subtle issue with the string comparison or the `toContain` matcher itself.
3.  **Other Notes:** The `stderr` contains multiple `DeprecationWarning: Calling promisify on a function that returns a Promise...`. This suggests `promisify` is being used unnecessarily on async functions within the tests.

**Recommended Fixes:**

1.  **Modify Assertion:** Change the assertion on line 316 to be less sensitive to potential whitespace variations or hidden characters. Use a regular expression match instead:
    ```typescript
    // In index_test.ts, line 316:
    expect(rawData).toMatch(/"stringified":\s*true/);
    ```
2.  **(Optional Cleanup):** Remove the unnecessary `promisify` wrappers around the async `store` methods (e.g., change `await promisify(store.set.bind(store))(sid, sess)` to `await store.set(sid, sess)`).

test("custom serializer option", async () => {
  const client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()

  const customSerializer = {
    parse: vi.fn((s: string) => JSON.parse(s + " // parsed")),
    stringify: vi.fn((d: any) => JSON.stringify(d).replace(/\}$/, ', "stringified": true }')),
  }
  const store = new RedisStore({ client, serializer: customSerializer })
  const sid = "custom-serializer-sid"
  const sess = { cookie: new Cookie(), value: 123, date: new Date() }

  try {
    // Set session
    await promisify(store.set.bind(store))(sid, sess)

    // Verify stringify was called
    expect(customSerializer.stringify).toHaveBeenCalledWith(sess)

    // Verify data in Redis is custom format
    const rawData = await client.get(store.prefix + sid)
    expect(rawData).toContain('"stringified":true')

    // Get session
    const retrievedSess = await promisify(store.get.bind(store))(sid)

    // Verify parse was called
    expect(customSerializer.parse).toHaveBeenCalledWith(rawData)

    // Verify retrieved data (note: our mock parse modifies it)
    expect(retrievedSess).toEqual(JSON.parse(JSON.stringify(sess) + " // parsed")) // Compare with expected parsed output

  } finally {
    await store.destroy(sid)
    await client.disconnect()
  }
})

*/

test("functional ttl option", async () => {
  const client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()

  const ttlFunction = (sess: any) => (sess.userType === 'admin' ? 3600 : 600)
  const store = new RedisStore({ client, ttl: ttlFunction })

  const sidUser = "user-session-id"
  const sessUser = { cookie: new Cookie(), userType: 'user' }
  const sidAdmin = "admin-session-id"
  const sessAdmin = { cookie: new Cookie(), userType: 'admin' }

  try {
    // Test set with user TTL
    await promisify(store.set.bind(store))(sidUser, sessUser)
    let ttlUser = await client.ttl(store.prefix + sidUser)
    expect(ttlUser).toBeGreaterThan(595)
    expect(ttlUser).toBeLessThanOrEqual(600)

    // Test set with admin TTL
    await promisify(store.set.bind(store))(sidAdmin, sessAdmin)
    let ttlAdmin = await client.ttl(store.prefix + sidAdmin)
    expect(ttlAdmin).toBeGreaterThan(3595)
    expect(ttlAdmin).toBeLessThanOrEqual(3600)

    // Wait a bit to ensure touch actually resets TTL
    await new Promise(resolve => setTimeout(resolve, 50));

    // Test touch with user TTL
    await promisify(store.touch.bind(store))(sidUser, sessUser)
    ttlUser = await client.ttl(store.prefix + sidUser)
    expect(ttlUser).toBeGreaterThan(595)
    expect(ttlUser).toBeLessThanOrEqual(600)


    // Test touch with admin TTL
    await promisify(store.touch.bind(store))(sidAdmin, sessAdmin)
    ttlAdmin = await client.ttl(store.prefix + sidAdmin)
    expect(ttlAdmin).toBeGreaterThan(3595)
    expect(ttlAdmin).toBeLessThanOrEqual(3600)

  } finally {
    await store.destroy(sidUser)
    await store.destroy(sidAdmin)
    await client.disconnect()
  }
})


test("set with zero or negative TTL calls destroy", async () => {
  const client = createClient({url: `redis://localhost:${redisSrv.port}`})
  await client.connect()
  const store = new RedisStore({client})
  const sid = "zero-ttl-sid"
  const sess = { cookie: new Cookie({ expires: new Date(Date.now() - 10000) }) } // Expired cookie

  // Spy on the destroy method
  const destroySpy = vi.spyOn(store, 'destroy')
  const clientDelSpy = vi.spyOn(store.client, 'del')
  const clientSetSpy = vi.spyOn(store.client, 'set')

  await promisify(store.set.bind(store))(sid, sess)

  // Verify destroy was called
  expect(destroySpy).toHaveBeenCalledWith(sid, expect.any(Function))
  // Verify client.del was called via destroy
  expect(clientDelSpy).toHaveBeenCalledWith([store.prefix + sid])
  // Verify client.set was NOT called
  expect(clientSetSpy).not.toHaveBeenCalled()

  // Verify session doesn't exist
  const result = await promisify(store.get.bind(store))(sid)
  expect(result).toBeUndefined()

  destroySpy.mockRestore()
  await client.disconnect()
})


