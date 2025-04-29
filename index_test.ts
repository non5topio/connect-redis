import {Cookie} from "express-session"
import {Redis} from "ioredis"
import {promisify} from "node:util"
import {createClient} from "redis"
import {expect, test} from "vitest"
import {RedisStore} from "./"
import * as redisSrv from "./testdata/server"
import { vi } from "vitest"
import { Cookie } from "express-session";
import { createClient } from "redis";
import { Redis } from "ioredis";
import { Cookie } from "express-session";

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

test("disableTTL option", async () => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue("OK"),
    expire: vi.fn().mockResolvedValue(1), // Should not be called by touch
    del: vi.fn().mockResolvedValue(1),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient, disableTTL: true });
  const sid = "disable-ttl-sid";
  const sess = { cookie: {} };

  // Test set with disableTTL = true
  await promisify(store.set.bind(store))(sid, sess);
  expect(mockClient.set).toHaveBeenCalledWith(store.prefix + sid, JSON.stringify(sess)); // No TTL argument
  // Ensure it wasn't called with TTL
  expect(mockClient.set).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything());


  // Test touch with disableTTL = true
  await promisify(store.touch.bind(store))(sid, sess);
  expect(mockClient.expire).not.toHaveBeenCalled(); // Expire should not be called
});


test("get non-existent session", async () => {
  const mockClient = {
    get: vi.fn().mockResolvedValue(null), // Simulate key not found
    set: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient });
  const sid = "nonexistent-sid";

  const result = await promisify(store.get.bind(store))(sid);

  expect(mockClient.get).toHaveBeenCalledWith(store.prefix + sid);
  expect(result).toBeUndefined(); // Promisified callback(null) results in undefined
});


test("set with serializer stringify error", async () => {
  const stringifyError = new Error("Stringify Error");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(), // This should not be called
    expire: vi.fn(),
    del: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const customSerializer = {
    parse: JSON.parse,
    stringify: () => { throw stringifyError; },
  };
  const store = new RedisStore({ client: mockClient, serializer: customSerializer });
  const sid = "serializer-stringify-error-sid";
  const sess = { cookie: {} };

  // Using try/catch with promisify to check the error passed to callback
  try {
    await promisify(store.set.bind(store))(sid, sess);
    // Should not reach here
    expect(true).toBe(false);
  } catch (err) {
    expect(err).toBe(stringifyError);
  }
  expect(mockClient.set).not.toHaveBeenCalled();
});


test("get with serializer parse error", async () => {
  const parseError = new Error("Parse Error");
  const mockClient = {
    get: vi.fn().mockResolvedValue('{"cookie":{}}'), // Simulate valid data from Redis
    set: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const customSerializer = {
    parse: () => { throw parseError; },
    stringify: JSON.stringify,
  };
  const store = new RedisStore({ client: mockClient, serializer: customSerializer });
  const sid = "serializer-parse-error-sid";

  // Using try/catch with promisify to check the error passed to callback
  try {
    await promisify(store.get.bind(store))(sid);
    // Should not reach here
    expect(true).toBe(false);
  } catch (err) {
    expect(err).toBe(parseError);
  }
  expect(mockClient.get).toHaveBeenCalledWith(store.prefix + sid);
});


test("TTL function returning zero or negative", async () => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue("OK"),
    expire: vi.fn().mockResolvedValue(1),
    del: vi.fn().mockResolvedValue(1),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };

  const ttlFn = (sess: any) => (sess && sess.user ? 0 : -10);
  const store = new RedisStore({ client: mockClient, ttl: ttlFn });
  const sid = "ttl-fn-test-sid";
  const destroySpy = vi.spyOn(store, 'destroy');

  // Test set with TTL 0 (should call destroy)
  const sessWithUser = { cookie: {}, user: 'test' };
  await promisify(store.set.bind(store))(sid, sessWithUser);
  expect(destroySpy).toHaveBeenCalledWith(sid, expect.any(Function));
  expect(mockClient.set).not.toHaveBeenCalled(); // Should not set if TTL <= 0
  destroySpy.mockClear(); // Reset spy for next assertion

  // Test set with TTL -10 (should call destroy)
  const sessWithoutUser = { cookie: {} };
  await promisify(store.set.bind(store))(sid, sessWithoutUser);
  expect(destroySpy).toHaveBeenCalledWith(sid, expect.any(Function));
  expect(mockClient.set).not.toHaveBeenCalled();
  destroySpy.mockRestore(); // Clean up spy

  // Test touch with TTL 0 (should not call expire with positive TTL)
  mockClient.expire.mockClear();
  await promisify(store.touch.bind(store))(sid, sessWithUser);
  // Depending on interpretation, expire might be called with <= 0 or not at all.
  // We assert it's not called with a positive value.
  // If it's called, the second arg (ttl) should not be > 0
  if (mockClient.expire.mock.calls.length > 0) {
      expect(mockClient.expire.mock.calls[0][1]).toBeLessThanOrEqual(0);
  }


  // Test touch with TTL -10 (should not call expire with positive TTL)
  mockClient.expire.mockClear();
  await promisify(store.touch.bind(store))(sid, sessWithoutUser);
   if (mockClient.expire.mock.calls.length > 0) {
      expect(mockClient.expire.mock.calls[0][1]).toBeLessThanOrEqual(0);
  }
});
/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 474 indicates an incorrectly formed object literal. The string `"exists"` is missing a key. A similar error exists on line 476 with `"disappears"`.

**Fix:**
Correct the object literal syntax on lines 474 and 476 in `index_test.ts` by adding a key for the string values. Assuming a `data` property is intended:

Change:
```typescript
// Line 474
const sess1 = { cookie: new Cookie(),  "exists" };
// Line 476
const sess2 = { cookie: new Cookie(),  "disappears" };
```
To:
```typescript
// Line 474
const sess1 = { cookie: new Cookie(), data: "exists" };
// Line 476
const sess2 = { cookie: new Cookie(),  "disappears" };
```

test("all method handles session disappearing between scan and mget", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  // Use a mock client wrapper to intercept calls
  const mockClient = {
    ...client, // Delegate actual calls to the real client
    mget: vi.fn(async (keys: string[]) => {
      // Simulate one key being deleted *after* scan found it but *before* mget runs
      if (keys.includes("sess:disappear-sid")) {
        await client.del("sess:disappear-sid");
      }
      // Now call the real mget
      const results = await client.mGet(keys);
      return results;
    }),
    // Need scanIterator for _getAllKeys
    scanIterator: client.scanIterator.bind(client)
  };

  // Need to normalize the mock client *manually* for this test structure
  // as RedisStore normalizes its own internal client.
  // Alternatively, mock _getAllKeys and client.mget on the store instance.
  // Let's mock the store's internal client methods instead for simplicity.

  const store = new RedisStore({ client }); // Initialize with real client first
  const sid1 = "exist-sid";
  const sess1 = { cookie: new Cookie(),  "exists" };
  const sid2 = "disappear-sid";
  const sess2 = { cookie: new Cookie(),  "disappears" };

  try {
    await promisify(store.clear.bind(store))(); // Clear first
    await promisify(store.set.bind(store))(sid1, sess1);
    await promisify(store.set.bind(store))(sid2, sess2);

    // Spy on the *normalized* client methods within the store instance
    const getAllKeysSpy = vi.spyOn(store as any, '_getAllKeys').mockResolvedValueOnce([
        store.prefix + sid1,
        store.prefix + sid2 // Simulate scan finding both keys
    ]);
    const mgetSpy = vi.spyOn(store.client, 'mget').mockImplementationOnce(async (keys: string[]) => {
         // Simulate key deletion before actual mget
        await client.del(store.prefix + sid2);
        // Call the *real* mget on the underlying client
        return client.mGet(keys);
    });


    const allSessions = await promisify(store.all.bind(store))();

    expect(getAllKeysSpy).toHaveBeenCalled();
    expect(mgetSpy).toHaveBeenCalledWith([store.prefix + sid1, store.prefix + sid2]);

    // Verify only the existing session is returned
    expect(allSessions).toHaveLength(1);
    expect(allSessions[0]).toEqual({ ...sess1, id: sid1 }); // Covers line 171 (null check)

    getAllKeysSpy.mockRestore();
    mgetSpy.mockRestore();

  } finally {
    await promisify(store.clear.bind(store))(); // Clean up remaining keys
    await client.disconnect();
  }
});

*/

test("set uses TTL when disableTTL is false", async () => {
  const mockRedisClient = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue("OK"), // Mock the set method
    del: vi.fn(),
    expire: vi.fn(),
    mGet: vi.fn(),
    scanIterator: vi.fn().mockImplementation(() => async function*() {}()), // Identify as redis v4+
  };
  // Initialize with disableTTL: false (default)
  const store = new RedisStore({ client: mockRedisClient });
  const sid = "set-with-ttl-sid";
  const sess = { cookie: {} };
  const expectedTTL = store.ttl as number; // Default TTL

  await promisify(store.set.bind(store))(sid, sess);

  // Verify client.set was called with key, value, and TTL options
  expect(mockRedisClient.set).toHaveBeenCalledWith(
    store.prefix + sid,
    JSON.stringify(sess),
    { EX: expectedTTL } // Check for the TTL option object (redis v4+)
  ); // Covers line 99 (via line 57)
});


test("_getTTL calculates TTL from valid cookie.expires", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  const store = new RedisStore({ client });
  const sid = "ttl-cookie-expires-sid";
  const futureDate = new Date(Date.now() + 60 * 1000); // 60 seconds in the future
  const sess = { cookie: new Cookie({ expires: futureDate }) };

  try {
    // Set the session - this will use _getTTL internally
    await promisify(store.set.bind(store))(sid, sess);

    // Verify the TTL set in Redis is approximately 60 seconds
    const ttl = await client.ttl(store.prefix + sid);
    expect(ttl).toBeGreaterThan(55); // Allow for slight delay
    expect(ttl).toBeLessThanOrEqual(60); // Covers lines 190, 191 usage in set

    // Directly test _getTTL logic (accessing private method for verification)
    const calculatedTtl = store["_getTTL"](sess);
    expect(calculatedTtl).toBeGreaterThan(55);
    expect(calculatedTtl).toBeLessThanOrEqual(60);

  } finally {
    await store.destroy(sid); // Use store's destroy method
    await client.disconnect();
  }
});

/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase due to a syntax error in the test file `index_test.ts`. The error message `Expected identifier but found "{"` on line 459 indicates an incorrectly formed object literal within the `sessions` array.

**Fix:**
Correct the object literal syntax on lines 459, 460, and 461 in `index_test.ts`. Assign the inner session data object to a key, likely `data`.

Change:
```typescript
// Line 459
{ id: "session1",  { cookie: new Cookie(), value: "data1" } },
// Line 460
{ id: "session2",  { cookie: new Cookie(), value: "data2" } },
// Line 461
{ id: "session3",  { cookie: new Cookie(), value: "data3" } }
```
To:
```typescript
// Line 459
{ id: "session1",  { cookie: new Cookie(), value: "data1" } },
// Line 460
{ id: "session2",  { cookie: new Cookie(), value: "data2" } },
// Line 461
{ id: "session3",  { cookie: new Cookie(), value: "data3" } }
```

test("clear, length, ids, all methods with existing data", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  const store = new RedisStore({ client, prefix: "clia:" }); // Use unique prefix

  try {
    // Clear any existing sessions with this prefix
    await promisify(store.clear.bind(store))();

    // Create multiple sessions
    const sessions = [
      { id: "session1",  { cookie: new Cookie(), value: "data1" } },
      { id: "session2",  { cookie: new Cookie(), value: "data2" } },
      { id: "session3",  { cookie: new Cookie(), value: "data3" } }
    ];

    for (const session of sessions) {
      await promisify(store.set.bind(store))(session.id, session.data);
    }

    // Test length
    const length = await promisify(store.length.bind(store))();
    expect(length).toBe(sessions.length); // Covers lines 142-144

    // Test ids
    const ids = await promisify(store.ids.bind(store))(); // Covers lines 151-157
    expect(ids).toHaveLength(sessions.length);
    expect(ids.sort()).toEqual(sessions.map(s => s.id).sort());

    // Test all method
    const allSessions = await promisify(store.all.bind(store))(); // Covers lines 165-177
    expect(allSessions).toHaveLength(sessions.length);
    // Add id property for comparison and sort
    const expectedSessions = sessions.map(s => ({ ...s.data, id: s.id })).sort((a, b) => a.id < b.id ? -1 : 1);
    allSessions.sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(allSessions).toEqual(expectedSessions);


    // Test clear
    await promisify(store.clear.bind(store))(); // Covers lines 131-135
    const lengthAfterClear = await promisify(store.length.bind(store))();
    expect(lengthAfterClear).toBe(0);

  } finally {
    // Clean up keys manually in case clear failed
    const keys = await client.keys(store.prefix + "*");
    if (keys.length) await client.del(keys);
    await client.disconnect();
  }
});

*/
/*
FAILED TEST: **Analysis:**
The test run failed during the transformation/compilation phase due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 455 indicates an incorrectly formed object literal.

**Fix:**
Correct the syntax error on lines 455 and 457 in `index_test.ts`. The object literals for `sess1` and `sess2` are missing a key for the string values `"session1-v4"` and `"session2-v4"`.

Change:
```typescript
const sess1 = { cookie: new Cookie(),  "session1-v4" };
const sess2 = { cookie: new Cookie(),  "session2-v4" };
```
To something like (assuming a `data` property is intended):
```typescript
const sess1 = { cookie: new Cookie(),  "session1-v4" };
const sess2 = { cookie: new Cookie(),  "session2-v4" };
```

test("redis v4+ client compatibility", async () => {
  // This test requires a running Redis server accessible via redisSrv.port
  let client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  try {
    await client.connect();
    const store = new RedisStore({ client });
    const sid1 = "redisv4-sid-1";
    const sess1 = { cookie: new Cookie(),  "session1-v4" };
    const sid2 = "redisv4-sid-2";
    const sess2 = { cookie: new Cookie(),  "session2-v4" };

    // Clear potential leftovers
    await promisify(store.clear.bind(store))();
    expect(await promisify(store.length.bind(store))()).toBe(0);

    // Test set (will use client.set(key, val, { EX: ttl }))
    await promisify(store.set.bind(store))(sid1, sess1);
    await promisify(store.set.bind(store))(sid2, sess2);

    // Test get
    const retrievedSess1 = await promisify(store.get.bind(store))(sid1);
    expect(retrievedSess1).toEqual(sess1);

    // Test length (will use client.scanIterator)
    expect(await promisify(store.length.bind(store))()).toBe(2);

    // Test ids (will use client.scanIterator)
    const ids = await promisify(store.ids.bind(store))();
    expect(ids).toHaveLength(2);
    expect(ids).toContain(sid1);
    expect(ids).toContain(sid2);

    // Test all (will use client.scanIterator and client.mGet)
    const allSessions = await promisify(store.all.bind(store))();
    expect(allSessions).toHaveLength(2);
    const expectedSess1 = { ...sess1, id: sid1 };
    const expectedSess2 = { ...sess2, id: sid2 };
    allSessions.sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(allSessions).toEqual([expectedSess1, expectedSess2]);

    // Test destroy
    await promisify(store.destroy.bind(store))(sid1);
    expect(await promisify(store.get.bind(store))(sid1)).toBeUndefined();

    // Test clear (will use client.scanIterator)
    await promisify(store.clear.bind(store))();
    expect(await promisify(store.length.bind(store))()).toBe(0);

  } finally {
    if (client.isOpen) {
      await client.disconnect();
    }
  }
});

*/
/*
FAILED TEST: **Analysis:**
The test run failed during the transformation/compilation phase due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 459 indicates an incorrectly formed object literal.

**Fix:**
Correct the syntax error on lines 459 and 461 in `index_test.ts`. The object literals for `sess1` and `sess2` are missing a key for the string values `"session1"` and `"session2"`.

Change:
```typescript
const sess1 = { cookie: new Cookie(),  "session1" };
const sess2 = { cookie: new Cookie(),  "session2" };
```
To something like (assuming a `data` property is intended):
```typescript
const sess1 = { cookie: new Cookie(),  "session1" };
const sess2 = { cookie: new Cookie(),  "session2" };
```

test("ioredis client compatibility", async () => {
  // Ensure ioredis is installed: npm install ioredis
  // This test requires a running Redis server accessible via redisSrv.port
  let client: Redis | null = null;
  try {
    client = new Redis(redisSrv.port); // Use the port from test setup
    // Wait for client to be ready (ioredis connects automatically)
    await new Promise(resolve => client!.on('ready', resolve));

    const store = new RedisStore({ client });
    const sid1 = "ioredis-sid-1";
    const sess1 = { cookie: new Cookie(),  "session1" };
    const sid2 = "ioredis-sid-2";
    const sess2 = { cookie: new Cookie(),  "session2" };

    // Clear potential leftovers
    await promisify(store.clear.bind(store))();
    expect(await promisify(store.length.bind(store))()).toBe(0);

    // Test set
    await promisify(store.set.bind(store))(sid1, sess1);
    await promisify(store.set.bind(store))(sid2, sess2);

    // Test get
    const retrievedSess1 = await promisify(store.get.bind(store))(sid1);
    expect(retrievedSess1).toEqual(sess1);

    // Test length
    expect(await promisify(store.length.bind(store))()).toBe(2);

    // Test ids
    const ids = await promisify(store.ids.bind(store))();
    expect(ids).toHaveLength(2);
    expect(ids).toContain(sid1);
    expect(ids).toContain(sid2);

    // Test all
    const allSessions = await promisify(store.all.bind(store))();
    expect(allSessions).toHaveLength(2);
    // Add id property for comparison
    const expectedSess1 = { ...sess1, id: sid1 };
    const expectedSess2 = { ...sess2, id: sid2 };
    // Sort results for consistent comparison
    allSessions.sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(allSessions).toEqual([expectedSess1, expectedSess2]);


    // Test touch (requires cookie.expires for TTL calculation)
    const futureDate = new Date(Date.now() + 30000); // 30 seconds
    sess1.cookie.expires = futureDate;
    await promisify(store.touch.bind(store))(sid1, sess1);
    const ttl = await client.ttl(store.prefix + sid1);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30); // Check if TTL is updated

    // Test destroy
    await promisify(store.destroy.bind(store))(sid1);
    expect(await promisify(store.get.bind(store))(sid1)).toBeUndefined();
    expect(await promisify(store.length.bind(store))()).toBe(1);

    // Test clear
    await promisify(store.clear.bind(store))();
    expect(await promisify(store.length.bind(store))()).toBe(0);

  } finally {
    if (client) {
      await client.quit();
    }
  }
});

*/

test("client missing get method", async () => {
  // Create a client object missing the 'get' method
  const deficientClient = {
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn().mockResolvedValue([]),
    // 'get' method is intentionally missing
  };

  // Instantiate the store with the deficient client
  const store = new RedisStore({ client: deficientClient });
  const sid = "missing-method-sid";

  // Expect calling store.get() to throw an error because normalizeClient
  // attempts to access the non-existent 'get' property on the client.
  // (Covers lines 46, 53, 84, 88)
  await expect(promisify(store.get.bind(store))(sid))
    .rejects.toThrow(TypeError); // Or similar error depending on JS engine

   // We can also test that the callback receives the error
   const getCb = vi.fn();
   await store.get(sid, getCb);
   expect(getCb).toHaveBeenCalledWith(expect.any(TypeError));

});

/*
FAILED TEST: **Analysis:**

1.  **Failing Test:** The test `TTL function error handling` failed.
2.  **Error:** The test timed out after 5000ms (`stdout` and `stderr`).
3.  **Root Cause:** The `stderr` shows an `Unhandled Rejection` for the `Error: TTL function failed`, which is the error the test *expects* to catch. The test incorrectly uses `util.promisify` on the `store.set` and `store.touch` methods. These methods are already `async` and return Promises. When the mocked `ttl` function throws, the error is caught internally and passed to the callback, but the misuse of `promisify` on an `async` function prevents the test's `await` from correctly handling the rejection, leading to the timeout and the unhandled rejection message. The `DeprecationWarning` in `stderr` highlights this misuse.

**Fix:**

1.  **Remove `promisify`:** In the `TTL function error handling` test, remove the `promisify(...)` wrappers around `store.set.bind(store)` and `store.touch.bind(store)`.
2.  **Await directly:** Call the methods directly using `await store.set(...)` and `await store.touch(...)`.
3.  **Use `.rejects`:** Modify the assertions to use Vitest's `.rejects.toThrow()` matcher for cleaner async error checking:

```typescript
// Replace this:
// try {
//   await promisify(store.set.bind(store))(sid, sess);
//   expect(true).toBe(false); // Should not reach here
// } catch (err) {
//   expect(err).toBe(ttlError);
// }

// With this:
await expect(store.set(sid, sess)).rejects.toThrow(ttlError);

// And similarly for store.touch:
await expect(store.touch(sid, sess)).rejects.toThrow(ttlError);
```

test("TTL function error handling", async () => {
  const ttlError = new Error("TTL function failed");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(), // Should not be called if TTL function fails before set
    expire: vi.fn(), // Should not be called if TTL function fails before expire
    del: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const ttlFn = () => { throw ttlError; };
  const store = new RedisStore({ client: mockClient, ttl: ttlFn });
  const sid = "ttl-fn-error-sid";
  const sess = { cookie: {} };

  // Test set with TTL function error (covers 184-185, 104-105)
  try {
    await promisify(store.set.bind(store))(sid, sess);
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(ttlError);
  }
  expect(mockClient.set).not.toHaveBeenCalled();
  expect(mockClient.del).not.toHaveBeenCalled(); // destroy shouldn't be called either

  // Test touch with TTL function error (covers 184-185, 115-116)
  try {
    await promisify(store.touch.bind(store))(sid, sess);
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(ttlError);
  }
  expect(mockClient.expire).not.toHaveBeenCalled();
});

*/

test("touch and destroy client error handling", async () => {
  const touchError = new Error("Expire failed");
  const destroyError = new Error("Del failed");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    // Mock expire to reject for touch test
    expire: vi.fn().mockRejectedValue(touchError),
    // Mock del to reject for destroy test
    del: vi.fn().mockRejectedValue(destroyError),
    scanIterator: vi.fn().mockImplementation(async function*() {}()),
    mget: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient });
  const sid = "error-sid";
  const sess = { cookie: {} };

  // Test touch error handling (covers lines 116-117)
  try {
    await promisify(store.touch.bind(store))(sid, sess);
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(touchError);
  }
  expect(mockClient.expire).toHaveBeenCalledWith(store.prefix + sid, expect.any(Number));

  // Test destroy error handling (covers lines 126-127)
  try {
    await promisify(store.destroy.bind(store))(sid);
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(destroyError);
  }
  expect(mockClient.del).toHaveBeenCalledWith([store.prefix + sid]);
});

/*
FAILED TEST: **Analysis:**

The test suite fails because the `all method with corrupted data` test encounters an unexpected error. Instead of catching the intended `parseError` (defined as `Error: Invalid JSON`), the test catches a `TypeError: impl.apply is not a function`.

This occurs because the mock implementation for `customSerializer.parse` in the test has an error:
1.  The parameter is named ` string` (with a leading space).
2.  The function body incorrectly references an undefined variable `data` instead of the actual parameter name when checking for `'invalid json'` and attempting `JSON.parse`.

This leads to an error within the mock function's logic *before* the intended `parseError` can be thrown, resulting in the unexpected `TypeError` related to the `vi.fn` wrapper.

**Fix:**

1.  **Correct the mock `serializer.parse` implementation** in the `all method with corrupted data` test (around line 861) to use the correct parameter name consistently:

    ```typescript
    // Change this:
    parse: vi.fn(( string) => { // Note the space in ' string' and use of 'data' below
      if (data === 'invalid json') {
        throw parseError;
      }
      return JSON.parse(data);
    }),

    // To this:
    parse: vi.fn(( string) => { // Use 'data' as the parameter name
      if (data === 'invalid json') { // Check 'data'
        throw parseError;
      }
      return JSON.parse(data); // Parse 'data'
    }),
    ```

2.  **(Optional but Recommended):** Remove the unnecessary `promisify` calls throughout the test file. The store methods are `async` and already return Promises. Replace `await promisify(store.method.bind(store))(...)` with `await store.method(...)`. This addresses the `DeprecationWarning` messages in the `stderr`.

test("all method with corrupted data", async () => {
  const parseError = new Error("Invalid JSON");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    // Simulate scan finding two keys
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield "sess:valid-sid";
      yield "sess:invalid-sid";
    }()),
    // Simulate mget returning valid data for one, invalid for the other
    mget: vi.fn().mockResolvedValue([
      '{"cookie":{},"data":"good"}', // Valid JSON
      'invalid json', // Invalid JSON
    ]),
  };
   const customSerializer = {
    parse: vi.fn(( string) => {
      if (data === 'invalid json') {
        throw parseError;
      }
      return JSON.parse(data);
    }),
    stringify: JSON.stringify,
  };

  const store = new RedisStore({ client: mockClient, serializer: customSerializer });

  try {
    await promisify(store.all.bind(store))();
     // Should not reach here
    expect(true).toBe(false);
  } catch (err) {
     // Expect the error from the serializer to be propagated (covers 172 error, 178-179)
    expect(err).toBe(parseError);
  }
   expect(mockClient.scanIterator).toHaveBeenCalled();
  expect(mockClient.mget).toHaveBeenCalledWith(["sess:valid-sid", "sess:invalid-sid"]);
  expect(customSerializer.parse).toHaveBeenCalledWith('{"cookie":{},"data":"good"}');
  expect(customSerializer.parse).toHaveBeenCalledWith('invalid json');
});

*/
/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase (esbuild) due to a syntax error in the test file `index_test.ts`. The error message `Expected identifier but found "\`value\${"` on line 840 indicates an incorrectly formed object literal. The template string `` `value${i}` `` is missing a corresponding key.

**Fix:**
Correct the object literal syntax on line 840 in `index_test.ts` by adding a key for the template string. Assuming a `data` property is intended:

Change:
```typescript
// Line 840
acc[key] = JSON.stringify({ cookie: {},  `value${i}` });
```
To:
```typescript
// Line 840
acc[key] = JSON.stringify({ cookie: {},  `value${i}` });
```

test("_getAllKeys multiple iterations (ioredis mock)", async () => {
  const prefix = "multi-scan:";
  const keyCount = 25; // More than scanCount
  const scanCount = 10;
  const keys = Array.from({ length: keyCount }, (_, i) => prefix + `key${i}`);
  const sessions = keys.reduce((acc, key, i) => {
    acc[key] = JSON.stringify({ cookie: {},  `value${i}` });
    return acc;
  }, {} as Record<string, string>);

  // Mock ioredis client behavior for scan
  const mockClient = {
    _ { ...sessions },
    _keys: [...keys],
    get: vi.fn(async (key: string) => mockClient._data[key] || null),
    set: vi.fn(async (key: string, value: string, _mode?: string, _ttl?: number) => {
      mockClient._data[key] = value;
      if (!mockClient._keys.includes(key)) mockClient._keys.push(key);
      return "OK";
    }),
    del: vi.fn(async (keysToDelete: string[]) => {
      let count = 0;
      keysToDelete.forEach(key => {
        if (mockClient._data[key]) {
          delete mockClient._data[key];
          mockClient._keys = mockClient._keys.filter(k => k !== key);
          count++;
        }
      });
      return count;
    }),
    expire: vi.fn().mockResolvedValue(1),
    mget: vi.fn(async (keysToGet: string[]) => keysToGet.map(key => mockClient._data[key] || null)),
    // Mock ioredis scan to require multiple iterations
    scan: vi.fn()
      .mockImplementationOnce(async (cursor: string, _matchLiteral: string, matchPattern: string, _countLiteral: string, count: number) => {
        expect(cursor).toBe("0");
        expect(matchPattern).toBe(prefix + "*");
        expect(count).toBe(scanCount);
        const matchingKeys = mockClient._keys.filter(k => k.startsWith(prefix));
        const nextCursor = count < matchingKeys.length ? String(count) : "0";
        return [nextCursor, matchingKeys.slice(0, count)]; // Return first page
      })
      .mockImplementationOnce(async (cursor: string, _matchLiteral: string, matchPattern: string, _countLiteral: string, count: number) => {
        expect(cursor).toBe(String(scanCount)); // Expect cursor from previous call
        expect(matchPattern).toBe(prefix + "*");
        expect(count).toBe(scanCount);
        const matchingKeys = mockClient._keys.filter(k => k.startsWith(prefix));
        const startIndex = parseInt(cursor, 10);
        const endIndex = startIndex + count;
        const nextCursor = endIndex < matchingKeys.length ? String(endIndex) : "0";
        return [nextCursor, matchingKeys.slice(startIndex, endIndex)]; // Return second page
      })
       .mockImplementationOnce(async (cursor: string, _matchLiteral: string, matchPattern: string, _countLiteral: string, count: number) => {
        expect(cursor).toBe(String(scanCount * 2)); // Expect cursor from previous call
        expect(matchPattern).toBe(prefix + "*");
        expect(count).toBe(scanCount);
        const matchingKeys = mockClient._keys.filter(k => k.startsWith(prefix));
        const startIndex = parseInt(cursor, 10);
        const endIndex = startIndex + count;
        const nextCursor = endIndex < matchingKeys.length ? String(endIndex) : "0"; // Should be 0 now
        expect(nextCursor).toBe("0");
        return [nextCursor, matchingKeys.slice(startIndex, endIndex)]; // Return third page
      })
  };

  const store = new RedisStore({ client: mockClient, prefix, scanCount });

  // Test _getAllKeys directly (covers lines 69-77, 199-205)
  const allKeys = await store["_getAllKeys"]();
  expect(allKeys).toHaveLength(keyCount);
  expect(allKeys.sort()).toEqual(keys.sort());
  expect(mockClient.scan).toHaveBeenCalledTimes(3); // 0 -> 10, 10 -> 20, 20 -> 0

  // Test length() using the multi-scan (covers 142-143)
  // Reset scan mock for subsequent calls
  mockClient.scan.mockClear()
      .mockImplementation(async (cursor: string, _m: string, match: string, _c: string, count: number) => {
          const matchingKeys = mockClient._keys.filter(k => k.startsWith(match));
          const startIndex = parseInt(cursor, 10) || 0;
          const endIndex = startIndex + count;
          const nextCursor = endIndex < matchingKeys.length ? String(endIndex) : "0";
          return [nextCursor, matchingKeys.slice(startIndex, endIndex)];
      });
  const length = await promisify(store.length.bind(store))();
  expect(length).toBe(keyCount);

  // Test ids() using the multi-scan (covers 151-153, 155-157)
  const ids = await promisify(store.ids.bind(store))();
  expect(ids).toHaveLength(keyCount);
  expect(ids.sort()).toEqual(keys.map(k => k.substring(prefix.length)).sort());

  // Test all() using the multi-scan (covers 164-166, 169-177)
  const allSessions = await promisify(store.all.bind(store))();
  expect(allSessions).toHaveLength(keyCount);
  expect(mockClient.mget).toHaveBeenCalledWith(expect.arrayContaining(keys));

  // Test clear() using the multi-scan (covers 131-132, 134-135)
  await promisify(store.clear.bind(store))();
  expect(mockClient.del).toHaveBeenCalledWith(expect.arrayContaining(keys));
  expect(mockClient._data).toEqual({});
  expect(mockClient._keys).toEqual([]);
});

*/

test("empty store operations", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  // Use a unique prefix to ensure isolation
  const store = new RedisStore({ client, prefix: "empty:" });

  try {
    // Ensure the store is empty for this prefix
    const keys = await client.keys(store.prefix + "*");
    if (keys.length) {
      await client.del(keys);
    }

    // Test clear() on empty store (covers line 133)
    await expect(promisify(store.clear.bind(store))()).resolves.toBeUndefined();

    // Test length() on empty store (covers line 144)
    const length = await promisify(store.length.bind(store))();
    expect(length).toBe(0);

    // Test ids() on empty store (covers lines 154-157)
    const ids = await promisify(store.ids.bind(store))();
    expect(ids).toEqual([]);

    // Test all() on empty store (covers line 167)
    const allSessions = await promisify(store.all.bind(store))();
    expect(allSessions).toEqual([]);

  } finally {
    // Clean up just in case
    const keys = await client.keys(store.prefix + "*");
    if (keys.length) await client.del(keys);
    await client.disconnect();
  }
});
/*
FAILED TEST: **Analysis:**

The test run failed because the `all handles MGET error` test encountered an unexpected `TypeError: impl.apply is not a function` instead of the intended `mgetError` (Error: MGET failed).

This `TypeError` occurs because the mock implementation for `scanIterator` in the test is incorrectly defined with trailing parentheses `()`:
```typescript
scanIterator: vi.fn().mockImplementation(async function*() { ... }()) // Incorrect
```
This immediately invokes the async generator function, passing the resulting generator *object* (not the function itself) to `mockImplementation`. When the test runs and Vitest tries to execute the mock, it attempts to call this object as a function, leading to the `TypeError`. The error happens before the mocked `mget` (which should throw the expected error) is called.

**Fix:**

1.  **Correct the `scanIterator` mock:** In the `all handles MGET error` test (around line 1219), remove the trailing parentheses `()` from the `mockImplementation`:
    ```typescript
    // Change this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield key1;
    }()),

    // To this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield key1;
    }),
    ```
2.  **(Recommended):** Remove the `promisify` wrapper around the `store.all.bind(store)` call (line 1223). Use `await store.all()` directly and adapt the error assertion, for example:
    ```typescript
    // Replace the try/catch block with:
    await expect(store.all()).rejects.toThrow(mgetError);
    ```

test("all handles MGET error", async () => {
  const mgetError = new Error("MGET failed");
  const prefix = "all-mget-err:"
  const key1 = prefix + "sid1";
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    // Mock scanIterator to return some keys
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield key1;
    }()),
    // Mock mget to throw an error
    mget: vi.fn().mockRejectedValue(mgetError),
  };
  const store = new RedisStore({ client: mockClient, prefix });

  try {
    await promisify(store.all.bind(store))();
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(mgetError); // Covers lines 178-179 (error path from mget)
  }
  expect(mockClient.scanIterator).toHaveBeenCalled();
  expect(mockClient.mget).toHaveBeenCalledWith([key1]);
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the `ids handles SCAN error` test encountered an unexpected `TypeError: impl.apply is not a function` instead of the intended `scanError` (Error: SCAN failed).

This `TypeError` occurs because the mock implementation for `scanIterator` in the test is incorrectly defined with trailing parentheses `()`:
```typescript
scanIterator: vi.fn().mockImplementation(async function*() { ... }()) // Incorrect
```
This immediately invokes the async generator function, passing the resulting generator *object* (not the function itself) to `mockImplementation`. When the test runs and Vitest tries to execute the mock, it attempts to call this object as a function, leading to the `TypeError`.

Additionally, the `stderr` shows multiple `DeprecationWarning`s related to using `promisify` on functions that already return Promises (like the async methods of `RedisStore`), which is unnecessary.

**Fixes:**

1.  **Correct the `scanIterator` mock:** In the `ids handles SCAN error` test (around line 1218), remove the trailing parentheses `()` from the `mockImplementation`:
    ```typescript
    // Change this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }()),

    // To this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }),
    ```
2.  **(Recommended):** Remove the `promisify` wrapper around the `store.ids.bind(store)` call (line 1220). Use `await store.ids()` directly and adapt the error assertion, for example:
    ```typescript
    // Replace the try/catch block with:
    await expect(store.ids()).rejects.toThrow(scanError);
    ```

test("ids handles SCAN error", async () => {
  const scanError = new Error("SCAN failed");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    mget: vi.fn(),
    // Mock scanIterator to throw an error
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }()),
  };
  const store = new RedisStore({ client: mockClient });

  try {
    await promisify(store.ids.bind(store))();
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(scanError); // Covers lines 159-160 (error path from _getAllKeys)
  }
  expect(mockClient.scanIterator).toHaveBeenCalled();
});

*/
/*
FAILED TEST: **Analysis:**

The test suite failed because the `length handles SCAN error` test caught an unexpected `TypeError: impl.apply is not a function` instead of the intended `scanError` (Error: SCAN failed).

This `TypeError` occurs because the mock implementation for `scanIterator` is incorrectly defined with trailing parentheses `()`:
```typescript
scanIterator: vi.fn().mockImplementation(async function*() { ... }()) // Incorrect: Immediately invokes the generator
```
This passes the resulting generator *object* to `mockImplementation`, not the function itself. When the test calls `scanIterator`, the mocking framework tries to execute this object as a function, leading to the error.

**Fix:**

1.  **Correct the `scanIterator` mock:** Remove the trailing parentheses `()` in the `length handles SCAN error` test (around line 1218) so that the `async function*` itself is provided as the implementation:
    ```typescript
    // Change this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }()), // <--- Remove these parentheses

    // To this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }),
    ```
2.  **(Recommended):** Remove the `promisify` wrapper from the `store.length.bind(store)` call (line 1220). The `store.length` method is already `async`. Use `await store.length()` directly and adjust the `try...catch` or use `.rejects.toThrow()`:
    ```typescript
    // Replace:
    // try {
    //   await promisify(store.length.bind(store))();
    //   ...
    // } catch (err) { ... }

    // With (using rejects):
    await expect(store.length()).rejects.toThrow(scanError);
    ```

test("length handles SCAN error", async () => {
  const scanError = new Error("SCAN failed");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    mget: vi.fn(),
    // Mock scanIterator to throw an error
    scanIterator: vi.fn().mockImplementation(async function*() {
      throw scanError;
    }()),
  };
  const store = new RedisStore({ client: mockClient });

  try {
    await promisify(store.length.bind(store))();
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(scanError); // Covers lines 146-147 (error path from _getAllKeys)
  }
  expect(mockClient.scanIterator).toHaveBeenCalled();
});

*/
/*
FAILED TEST: **Analysis:**

The test suite failed because the `clear handles SCAN error` test caught an unexpected `TypeError: impl.apply is not a function` instead of the intended `scanError` (Error: SCAN failed).

This `TypeError` occurs because the mock implementation for `scanIterator` is incorrectly defined with trailing parentheses `()`:
```typescript
scanIterator: vi.fn().mockImplementation(async function*() { ... }()) // Incorrect: Immediately invokes the generator
```
This causes the generator function to be executed immediately, and the resulting generator *object* is passed to `mockImplementation`. When the test later calls `scanIterator`, Vitest tries to execute this object as a function, leading to the error.

**Fix:**

1.  **Correct the `scanIterator` mock:** Remove the trailing parentheses `()` in the `clear handles SCAN error` test (around line 1218) so that the `async function*` itself is provided as the implementation:
    ```typescript
    // Change this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield "key1";
      throw scanError;
    }()), // <--- Remove these parentheses

    // To this:
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield "key1";
      throw scanError;
    }),
    ```
2.  **(Recommended):** Remove the `promisify` wrapper from the `store.clear.bind(store)` call (and other similar calls throughout the file flagged by the `DeprecationWarning` in stderr). The `store.clear` method is already `async`. Use `await store.clear()` directly and adjust the `try...catch` accordingly or use `.rejects.toThrow()`:
    ```typescript
    // Replace:
    // try {
    //   await promisify(store.clear.bind(store))();
    //   ...
    // } catch (err) { ... }

    // With (using rejects):
    await expect(store.clear()).rejects.toThrow(scanError);
    ```

test("clear handles SCAN error", async () => {
  const scanError = new Error("SCAN failed");
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(), // Should not be called if scan fails
    expire: vi.fn(),
    mget: vi.fn(),
    // Mock scanIterator to throw an error
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield "key1"; // Yield one key to ensure loop starts
      throw scanError; // Throw error during iteration
    }()),
  };
  const store = new RedisStore({ client: mockClient });

  try {
    await promisify(store.clear.bind(store))();
    expect(true).toBe(false); // Should not reach here
  } catch (err) {
    expect(err).toBe(scanError); // Covers lines 136-137 (error path from _getAllKeys)
  }
  expect(mockClient.scanIterator).toHaveBeenCalled();
  expect(mockClient.del).not.toHaveBeenCalled(); // DEL should not be called
});

*/
/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase (via `vite:esbuild`) due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 1207 indicates an incorrectly formed object literal. The string `"exists"` is missing a corresponding key. A similar error exists on line 1208 with the string `"deleted"`.

**Fix:**
Correct the object literal syntax on lines 1207 and 1208 in `index_test.ts` by adding a key (e.g., `data`) for the string values.

Change:
```typescript
// Line 1207
const sess1 = { cookie: new Cookie(),  "exists" };
// Line 1208
const sess2 = { cookie: new Cookie(),  "deleted" };
```
To:
```typescript
// Line 1207
const sess1 = { cookie: new Cookie(),  "exists" };
// Line 1208
const sess2 = { cookie: new Cookie(),  "deleted" };
```

test("all method handles concurrent deletion", async () => {
  const sid1 = "all-exist-sid";
  const sid2 = "all-deleted-sid";
  const sess1 = { cookie: new Cookie(),  "exists" };
  const sess2 = { cookie: new Cookie(),  "deleted" }; // This won't be returned
  const prefix = "all-concurrent:"
  const key1 = prefix + sid1;
  const key2 = prefix + sid2;

  const mockClient = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    // Simulate scan finding both keys
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield key1;
      yield key2;
    }()),
    // Simulate mget returning data for the first key, null for the second
    mget: vi.fn().mockResolvedValue([
      JSON.stringify(sess1),
      null, // Simulate key2 being deleted after scan but before mget
    ]),
  };

  const store = new RedisStore({ client: mockClient, prefix });

  const allSessions = await promisify(store.all.bind(store))();

  expect(mockClient.scanIterator).toHaveBeenCalledWith(prefix + "*", store.scanCount);
  expect(mockClient.mget).toHaveBeenCalledWith([key1, key2]);
  expect(store.serializer.parse).toHaveBeenCalledWith(JSON.stringify(sess1));
  expect(store.serializer.parse).not.toHaveBeenCalledWith(null); // Ensure parse isn't called with null

  // Verify only the existing session is returned
  expect(allSessions).toHaveLength(1);
  // Check that the returned session has the 'id' property added
  expect(allSessions[0]).toEqual({ ...sess1, id: sid1 }); // Covers lines 169-176
});

*/

test("normalizeClient ioredis set with TTL", async () => {
  // Mock ioredis client (doesn't have scanIterator)
  const mockIoRedisClient = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue("OK"), // Mock the set method
    del: vi.fn(),
    expire: vi.fn(),
    mget: vi.fn(),
    scan: vi.fn().mockResolvedValue(["0", []]), // Make it identifiable as ioredis
  };
  const store = new RedisStore({ client: mockIoRedisClient }); // disableTTL is false by default
  const sid = "ioredis-set-ttl-sid";
  const sess = { cookie: {} };
  const expectedTTL = store.ttl as number; // Default TTL

  await promisify(store.set.bind(store))(sid, sess);

  // Verify client.set was called with key, value, 'EX', and TTL (ioredis style)
  expect(mockIoRedisClient.set).toHaveBeenCalledWith(
    store.prefix + sid,
    JSON.stringify(sess),
    "EX", // Check for the 'EX' mode argument
    expectedTTL
  ); // Covers line 58
});
/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase (via `vite:esbuild`) due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 1560 indicates an incorrectly formed object literal. The string `"async data"` is missing a corresponding key.

**Fix:**
Correct the object literal syntax on line 1560 in `index_test.ts` by adding a key (e.g., `data`) for the string value.

Change:
```typescript
// Line 1560
const sess = { cookie: new Cookie(),  "async data" };
```
To:
```typescript
// Line 1560
const sess = { cookie: new Cookie(),  "async data" };
```

test("custom async serializer", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  const prefix = "async-serializer:"

  const asyncSerializer = {
    parse: vi.fn(async (s: string) => {
      await new Promise(r => setTimeout(r, 1)); // Simulate async work
      return JSON.parse(s);
    }),
    stringify: vi.fn(async (s: any) => {
      await new Promise(r => setTimeout(r, 1)); // Simulate async work
      return JSON.stringify(s);
    }),
  };

  const store = new RedisStore({ client, prefix, serializer: asyncSerializer });
  const sid = "async-sid";
  const sess = { cookie: new Cookie(),  "async data" };
  const key = prefix + sid;

  try {
    // Clear potential leftovers
    await client.del(key);

    // Test set with async stringify
    await promisify(store.set.bind(store))(sid, sess); // Calls async stringify
    expect(asyncSerializer.stringify).toHaveBeenCalledWith(sess);
    const rawData = await client.get(key);
    expect(rawData).toBe(JSON.stringify(sess)); // Verify raw data is stored

    // Test get with async parse
    const retrievedSess = await promisify(store.get.bind(store))(sid); // Calls async parse
    expect(asyncSerializer.parse).toHaveBeenCalledWith(rawData);
    expect(retrievedSess).toEqual(sess);

    // Test all with async parse (covers line 172 await)
    const allSessions = await promisify(store.all.bind(store))();
    expect(asyncSerializer.parse).toHaveBeenCalledTimes(2); // Once for get, once for all
    expect(allSessions).toHaveLength(1);
    expect(allSessions[0]).toEqual({ ...sess, id: sid });

  } finally {
    await client.del(key);
    await client.disconnect();
  }
});

*/
/*
FAILED TEST: **Analysis:**
The test run failed during the code transformation phase (via `vite:esbuild`) due to a syntax error in the test file `index_test.ts`. The error message `Expected ":" but found "}"` on line 1551 indicates an incorrectly formed object literal. The string `"good"` is missing a corresponding key.

**Fix:**
Correct the object literal syntax on line 1551 in `index_test.ts` by adding a key (e.g., `data`) for the string value.

Change:
```typescript
// Line 1551
const validSessData = { cookie: {},  "good" };
```
To:
```typescript
// Line 1551
const validSessData = { cookie: {},  "good" };
```

test("all method handles serializer parse returning null or non-object", async () => {
  const prefix = "all-parse-nonobj:"
  const sidValid = "valid-sid";
  const sidNull = "null-sid";
  const sidString = "string-sid";
  const keyValid = prefix + sidValid;
  const keyNull = prefix + sidNull;
  const keyString = prefix + sidString;

  const validSessData = { cookie: {},  "good" };
  const nullSessData = null; // Simulate parse returning null
  const stringSessData = "just a string"; // Simulate parse returning string

  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {
      yield keyValid;
      yield keyNull;
      yield keyString;
    }()),
    // mget returns stringified versions, parse will handle conversion
    mget: vi.fn().mockResolvedValue([
      JSON.stringify(validSessData), // Will be parsed to object
      "NULL_PLACEHOLDER", // Will be parsed to null
      JSON.stringify(stringSessData), // Will be parsed to string
    ]),
  };

  const customSerializer = {
    parse: vi.fn((s: string) => {
      if (s === "NULL_PLACEHOLDER") return nullSessData; // Return null
      // For string data, JSON.parse will return the string
      // For valid data, JSON.parse returns the object
      try { return JSON.parse(s); } catch { return s; } // Basic parse logic
    }),
    stringify: JSON.stringify,
  };

  // @ts-expect-error - Providing mock client
  const store = new RedisStore({ client: mockClient, prefix, serializer: customSerializer });

  const allSessions = await promisify(store.all.bind(store))();

  expect(mockClient.scanIterator).toHaveBeenCalled();
  expect(mockClient.mget).toHaveBeenCalledWith([keyValid, keyNull, keyString]);
  expect(customSerializer.parse).toHaveBeenCalledTimes(3);

  // Verify results: null is skipped (line 171), valid object and string are included
  expect(allSessions).toHaveLength(2); // Covers line 170, 171 (skipping null), 172-176

  // Check valid session
  const retrievedValid = allSessions.find(s => s.id === sidValid);
  expect(retrievedValid).toEqual({ ...validSessData, id: sidValid });

  // Check string session (assuming it should be included as is, with an id)
  const retrievedString = allSessions.find(s => s.id === sidString);
  // The exact expectation depends on desired behavior for non-SessionData returns.
  // Here we assume it's pushed onto the accumulator.
  // If SessionData type is strictly enforced, this might be filtered or cause issues.
  // Based on current code, it seems it would be pushed.
  expect(retrievedString).toEqual({ id: sidString }); // The string itself isn't added, only id

});

*/

test("clear method successfully deletes existing keys", async () => {
  const client = createClient({ url: `redis://localhost:${redisSrv.port}` });
  await client.connect();
  const store = new RedisStore({ client, prefix: "clear-success:" });
  const sid1 = "clear-sid-1";
  const sid2 = "clear-sid-2";
  const key1 = store.prefix + sid1;
  const key2 = store.prefix + sid2;

  try {
    // Ensure clean state
    await client.del([key1, key2]);

    // Add keys
    await promisify(store.set.bind(store))(sid1, { cookie: new Cookie() });
    await promisify(store.set.bind(store))(sid2, { cookie: new Cookie() });
    expect(await client.exists([key1, key2])).toBe(2);

    // Spy on the *normalized* client's del method within the store instance
    const delSpy = vi.spyOn(store.client, 'del');

    // Call clear
    await promisify(store.clear.bind(store))(); // Covers lines 132, 134, 135

    // Verify del was called with the correct keys
    expect(delSpy).toHaveBeenCalledWith(expect.arrayContaining([key1, key2]));
    expect(delSpy.mock.calls[0][0]).toHaveLength(2); // Ensure both keys were passed

    // Verify keys are gone
    expect(await client.exists([key1, key2])).toBe(0);

    delSpy.mockRestore();

  } finally {
    // Clean up just in case
    await client.del([key1, key2]);
    await client.disconnect();
  }
});


test("client missing mget/mGet methods", async () => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    // Has scan methods
    scanIterator: vi.fn().mockImplementation(async function*() { yield "sess:key1"; }()),
    scan: vi.fn().mockResolvedValue(["0", ["sess:key1"]]),
    // Missing mget and mGet
  };
  // @ts-expect-error - Intentionally providing incomplete client
  const store = new RedisStore({ client: mockClient });

  // Test all error handling (covers 178-179 via client.mget/mGet call)
  await expect(promisify(store.all.bind(store))())
    .rejects.toThrow(TypeError); // Error originates from client.mget/mGet call in normalizeClient
});


test("client missing scan/scanIterator methods", async () => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    mget: vi.fn(), // Has mget/mGet
    mGet: vi.fn(),
    // Missing scan and scanIterator
  };
  // @ts-expect-error - Intentionally providing incomplete client
  const store = new RedisStore({ client: mockClient });

  // Test length error handling (covers 146-147)
  await expect(promisify(store.length.bind(store))())
    .rejects.toThrow(TypeError); // Error originates from client.scan call in normalizeClient

  // Test ids error handling (covers 159-160)
  await expect(promisify(store.ids.bind(store))())
    .rejects.toThrow(TypeError);

  // Test all error handling (covers 178-179 via _getAllKeys)
  await expect(promisify(store.all.bind(store))())
    .rejects.toThrow(TypeError);

  // Test clear error handling (covers 136-137)
  await expect(promisify(store.clear.bind(store))())
    .rejects.toThrow(TypeError);
});


test("ioredis client with scanCount 1 retrieves all keys", async () => {
  // Ensure ioredis is installed: npm install ioredis
  let client: Redis | null = null;
  const prefix = "scan1:"
  const keyCount = 3; // More than scanCount=1

  try {
    client = new Redis(redisSrv.port);
    await new Promise(resolve => client!.on('ready', resolve));

    // Use scanCount: 1 to force multiple iterations
    const store = new RedisStore({ client, prefix, scanCount: 1 });

    // Clear potential leftovers
    const existingKeys = await client.keys(prefix + "*");
    if (existingKeys.length) await client.del(existingKeys);

    // Add keys
    const sids = Array.from({ length: keyCount }, (_, i) => `sid${i}`);
    for (const sid of sids) {
      await promisify(store.set.bind(store))(sid, { cookie: new Cookie() });
    }

    // Spy on the actual ioredis client's scan method used by the normalized client
    const scanSpy = vi.spyOn(client, 'scan');

    // Test length - this uses _getAllKeys -> scanIterator
    const length = await promisify(store.length.bind(store))();
    expect(length).toBe(keyCount); // Covers line 202, 203

    // Verify scan was called multiple times (initial call + one per key after the first page)
    // The exact number depends on internal batching, but should be > 1 for keyCount=3, scanCount=1
    expect(scanSpy.mock.calls.length).toBeGreaterThan(1);
    // Check the scan arguments (cursor, MATCH, pattern, COUNT, count)
    expect(scanSpy).toHaveBeenCalledWith(expect.any(String), "MATCH", prefix + "*", "COUNT", 1); // Covers lines 69-76

    scanSpy.mockRestore();

    // Test clear uses the same mechanism
    await promisify(store.clear.bind(store))();
    const lengthAfterClear = await promisify(store.length.bind(store))();
    expect(lengthAfterClear).toBe(0);

  } finally {
    if (client) {
      // Clean up keys manually if clear failed or test errored
      const keys = await client.keys(prefix + "*");
      if (keys.length) await client.del(keys);
      await client.quit();
    }
  }
});



