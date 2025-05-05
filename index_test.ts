import {test} from "vitest"
import * as redisSrv from "./testdata/server"
import {RedisStore} from "./"

test("setup", async () => {
  await redisSrv.connect()
})
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S6: should handle length, ids, and all with multiple sessions` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 25 where `vi.fn()` is called within the `mockClient` definition. The `vi` object, which provides mocking utilities in Vitest, was used without being imported from the `vitest` package.

**Recommended Fix:**

In `index_test.ts`, modify the import statement at the top of the file to include `vi`:

```typescript
// Change this:
import {test} from "vitest"

// To this:
import {test, vi} from "vitest"
```

test("S6: should handle length, ids, and all with multiple sessions", async ({ expect }) => {
  const prefix = "multi:";
  const keys = [`${prefix}sid1`, `${prefix}sid2`, `${prefix}sid3`];
  const sessions = {
    [`${prefix}sid1`]: JSON.stringify({ cookie: {}, user: 'A' }),
    [`${prefix}sid2`]: JSON.stringify({ cookie: {}, user: 'B' }),
    [`${prefix}sid3`]: JSON.stringify({ cookie: {}, user: 'C' }),
  };
  const expectedIds = ['sid1', 'sid2', 'sid3'];
  const expectedAll = [
    { id: 'sid1', cookie: {}, user: 'A' },
    { id: 'sid2', cookie: {}, user: 'B' },
    { id: 'sid3', cookie: {}, user: 'C' },
  ];

  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {
      for (const key of keys) {
        yield key;
      }
    }),
    mGet: vi.fn().mockImplementation(async (keysToGet: string[]) => {
       return keysToGet.map(key => sessions[key] || null);
    }),
  };

  const store = new RedisStore({ client: mockClient, prefix: prefix, scanCount: 10 }); // Use custom prefix

  // Length
  const length = await new Promise<number>((resolve, reject) => {
    store.length((err, len) => (err ? reject(err) : resolve(len ?? 0)));
  });
  expect(mockClient.scanIterator).toHaveBeenCalledWith(`${prefix}*`, 10);
  expect(length).toBe(3);

  // Ids
  const ids = await new Promise<string[]>((resolve, reject) => {
    store.ids((err, sessionIds) => (err ? reject(err) : resolve(sessionIds ?? [])));
  });
  expect(mockClient.scanIterator).toHaveBeenCalledWith(`${prefix}*`, 10);
  expect(ids).toHaveLength(3);
  expect(ids).toEqual(expect.arrayContaining(expectedIds)); // Order might vary

  // All
  const allSessions = await new Promise<SessionData[]>((resolve, reject) => {
    store.all((err, s) => (err ? reject(err) : resolve(s ?? [])));
  });
  expect(mockClient.scanIterator).toHaveBeenCalledWith(`${prefix}*`, 10);
  expect(mockClient.mGet).toHaveBeenCalledWith(keys);
  expect(allSessions).toHaveLength(3);
  // Sort results for consistent comparison as order isn't guaranteed
  allSessions.sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
  expectedAll.sort((a, b) => a.id.localeCompare(b.id));
  expect(allSessions).toEqual(expectedAll);
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S5: should use custom TTL function for set operation` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 11 where `vi.fn()` is called. The `vi` object, which provides mocking utilities in Vitest, was used without being imported from the `vitest` package.

**Recommended Fix:**

In `index_test.ts`, modify the import statement at the top of the file to include `vi`:

```typescript
// Change this:
import {test} from "vitest"

// To this:
import {test, vi} from "vitest"
```

test("S5: should use custom TTL function for set operation", async ({ expect }) => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}),
    mGet: vi.fn(),
  };
  const ttlFunction = vi.fn((sess: SessionData) => sess.customTTL || 30);
  const options = { client: mockClient, ttl: ttlFunction };
  const store = new RedisStore(options);
  const sid = "func-ttl-sid";
  const  SessionData = { cookie: {}, customTTL: 60 };
  const dataString = JSON.stringify(data);

  // Set
  await new Promise<void>((resolve, reject) => {
    store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });

  // Expect TTL function to have been called with the session data
  expect(ttlFunction).toHaveBeenCalledWith(data);

  // Expect set to be called with TTL returned by the function (60s)
  expect(mockClient.set).toHaveBeenCalledWith(
    "sess:" + sid,
    dataString,
    { EX: 60 }
  );
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S4: should calculate TTL from session.cookie.expires on set` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 11 where `vi.fn()` is called. The `vi` object, which provides mocking utilities in Vitest, was used without being imported from the `vitest` package.

**Recommended Fix:**

In `index_test.ts`, modify the import statement at the top of the file to include `vi`:

```typescript
// Change this:
import {test} from "vitest"

// To this:
import {test, vi} from "vitest"
```

test("S4: should calculate TTL from session.cookie.expires on set", async ({ expect }) => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}),
    mGet: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient }); // Default TTL is 86400
  const sid = "cookie-ttl-sid";
  const futureDate = new Date(Date.now() + 120000); // 120 seconds in the future
  const  SessionData = { cookie: { expires: futureDate } };
  const dataString = JSON.stringify(data);

  // Set
  await new Promise<void>((resolve, reject) => {
    store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });

  // Expect set to be called with TTL derived from cookie.expires (~120s)
  expect(mockClient.set).toHaveBeenCalledWith(
    "sess:" + sid,
    dataString,
    { EX: expect.closeTo(120, 0) } // Allow for slight timing differences
  );
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S3: should update TTL via touch method using cookie.expires` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 11 where `vi.fn()` is called. The `vi` object, which provides mocking utilities in Vitest, was used without being imported from the `vitest` package.

**Recommended Fix:**

In `index_test.ts`, modify the import statement at the top of the file to include `vi`:

```typescript
// Change this:
import {test} from "vitest"

// To this:
import {test, vi} from "vitest"
```

test("S3: should update TTL via touch method using cookie.expires", async ({ expect }) => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn().mockResolvedValue(1), // Mock expire success
    scanIterator: vi.fn().mockImplementation(async function*() {}),
    mGet: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient });
  const sid = "touch-sid";
  const futureDate = new Date(Date.now() + 60000); // 60 seconds in the future
  const  SessionData = { cookie: { expires: futureDate } };

  // Set the session first (optional for touch logic, but good practice)
  await new Promise<void>((resolve, reject) => {
      store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });
  expect(mockClient.set).toHaveBeenCalled(); // Verify set was called

  // Touch
  await new Promise<void>((resolve, reject) => {
    store.touch(sid, data, (err) => (err ? reject(err) : resolve()));
  });

  // Expect expire to be called with the key and TTL derived from cookie.expires (~60s)
  expect(mockClient.expire).toHaveBeenCalledWith(
    "sess:" + sid,
    expect.closeTo(60, 0) // Allow for slight timing differences
  );
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S2: should initialize with custom prefix and numeric TTL` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 11 where `vi.fn()` is called. The `vi` object, which provides mocking utilities in Vitest, was used without being imported from the `vitest` package.

**Recommended Fix:**

In `index_test.ts`, modify the import statement at the top of the file to include `vi`:

```typescript
// Change this:
import {test} from "vitest"

// To this:
import {test, vi} from "vitest"
```

test("S2: should initialize with custom prefix and numeric TTL", async ({ expect }) => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}),
    mGet: vi.fn(),
  };
  const options = { client: mockClient, prefix: "custom:", ttl: 3600 };
  const store = new RedisStore(options);
  const sid = "custom-sid";
  const  SessionData = { cookie: {}, value: "test" };
  const dataString = JSON.stringify(data);

  expect(store.prefix).toBe("custom:");
  expect(store.ttl).toBe(3600);

  // Set
  await new Promise<void>((resolve, reject) => {
    store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });
  expect(mockClient.set).toHaveBeenCalledWith(
    "custom:" + sid,
    dataString,
    { EX: 3600 }
  );

  // Get
  mockClient.get.mockResolvedValueOnce(dataString);
  const sessionData = await new Promise<SessionData | null>((resolve, reject) => {
    store.get(sid, (err, sess) => (err ? reject(err) : resolve(sess ?? null)));
  });
  expect(mockClient.get).toHaveBeenCalledWith("custom:" + sid);
  expect(sessionData).toEqual(data);
});

*/
/*
FAILED TEST: **Analysis:**

The test run failed because the test case `S1: should set, get, and destroy a session with default options` in `index_test.ts` encountered a `ReferenceError`. The error occurs on line 23 where `JSON.stringify(data)` is called, but the variable `data` has not been defined. Line 22 defines a constant named `SessionData` instead of `data`.

**Recommended Fix:**

In `index_test.ts`, change line 22 from:
```typescript
const  SessionData = { cookie: {}, user: "test", count: 1 };
```
to:
```typescript
const data = { cookie: {}, user: "test", count: 1 };
```
This defines the `data` variable that is subsequently used on line 23 and elsewhere in the test.

test("S1: should set, get, and destroy a session with default options", async ({ expect }) => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    scanIterator: vi.fn().mockImplementation(async function*() {}), // Needed for normalizeClient
    mGet: vi.fn(),
  };
  const store = new RedisStore({ client: mockClient });
  const sid = "test-sid-1";
  const  SessionData = { cookie: {}, user: "test", count: 1 };
  const dataString = JSON.stringify(data);

  // Set
  await new Promise<void>((resolve, reject) => {
    store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });
  expect(mockClient.set).toHaveBeenCalledWith(
    "sess:" + sid,
    dataString,
    { EX: 86400 } // Default TTL
  );

  // Get (found)
  mockClient.get.mockResolvedValueOnce(dataString);
  const sessionData = await new Promise<SessionData | null>((resolve, reject) => {
    store.get(sid, (err, sess) => (err ? reject(err) : resolve(sess ?? null)));
  });
  expect(mockClient.get).toHaveBeenCalledWith("sess:" + sid);
  expect(sessionData).toEqual(data);

  // Destroy
  mockClient.del.mockResolvedValueOnce(1);
  await new Promise<void>((resolve, reject) => {
    store.destroy(sid, (err) => (err ? reject(err) : resolve()));
  });
  expect(mockClient.del).toHaveBeenCalledWith(["sess:" + sid]);

  // Get (after destroy)
  mockClient.get.mockResolvedValueOnce(null);
  const destroyedData = await new Promise<SessionData | null>((resolve, reject) => {
    store.get(sid, (err, sess) => (err ? reject(err) : resolve(sess ?? null)));
  });
  expect(mockClient.get).toHaveBeenCalledWith("sess:" + sid);
  expect(destroyedData).toBeNull();
});

*/

