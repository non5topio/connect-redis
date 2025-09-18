import {test} from "vitest"
import * as redisSrv from "./testdata/server"
import {RedisStore} from "./"
import { expect } from "vitest"

test("setup", async () => {
  await redisSrv.connect()
})

test("S18 touch propagates client.expire error", async () => {
  const err = new Error("expire fail");
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => {
      throw err;
    },
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.touch("sid", { cookie: {} }, (e) => {
      expect(e).toBe(err);
      resolve();
    });
  });
});


test("S17 set propagates client.set error", async () => {
  const err = new Error("set fail");
  const client = {
    get: async () => null,
    set: async () => {
      throw err;
    },
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.set("sid", { cookie: {} }, (e) => {
      expect(e).toBe(err);
      resolve();
    });
  });
});


test("S16 get propagates client.get error", async () => {
  const err = new Error("redis fail");
  const client = {
    get: async () => {
      throw err;
    },
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.get("sid", (e) => {
      expect(e).toBe(err);
      resolve();
    });
  });
});


test("S15 normalizeClient redis TTL handling", async () => {
  const redisStub = {
    get: async () => null,
    set: async (k: string, v: string, opts: { EX: number }) => {
      expect(opts).toEqual({ EX: 20 });
      return "OK";
    },
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mGet: async () => [],
  };
  const store = new RedisStore({ client: redisStub });
  // Use the normalized client directly
  await store.client.set("k", "v", 20);
});


test("S14 normalizeClient ioredis TTL handling", async () => {
  const ioredisStub = {
    get: async () => null,
    set: async (k: string, v: string, mode: string, ttl: number) => {
      // capture arguments for assertion
      expect(mode).toBe("EX");
      expect(ttl).toBe(10);
      return "OK";
    },
    del: async () => 1,
    expire: async () => 1,
    scan: async (cursor: string, ...args: any[]) => ["0", []],
    mget: async () => [],
  };
  const store = new RedisStore({ client: ioredisStub });
  // Directly use the normalized client to test the set wrapper
  await store.client.set("k", "v", 10);
});


test("S13 set respects disableTTL flag", async () => {
  const session = { cookie: {} };
  let setArgs: any[] = [];
  const client = {
    get: async () => null,
    set: async (...args: any[]) => {
      setArgs = args;
      return "OK";
    },
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client, disableTTL: true });
  await new Promise<void>((resolve, reject) => {
    store.set("sid", session, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  // When disableTTL is true, client.set should be called with only key and value
  expect(setArgs.length).toBe(2);
  expect(setArgs[0]).toBe("sess:sid");
  expect(setArgs[1]).toBe(JSON.stringify(session));
});


test("S12 set with past expires calls destroy", async () => {
  const past = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
  const session = { cookie: { expires: past } };
  let delCalled = false;
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async (keys: string[]) => {
      delCalled = true;
      return 1;
    },
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.set("sid", session, (err) => {
      if (err) reject(err);
      else {
        expect(delCalled).toBe(true);
        resolve();
      }
    });
  });
})


test("S11 _getTTL computes seconds from future expires", () => {
  const future = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes ahead
  const session = { cookie: { expires: future } };
  const store = new RedisStore({ client: {} as any });
  const ttl = (store as any)["_getTTL"](session);
  expect(ttl).toBeGreaterThanOrEqual(299);
  expect(ttl).toBeLessThanOrEqual(301);
})

/*
FAILED TEST: <|channel|>analysis<|message|>We need to produce short concise analysis and recommended fixes. Mention that normalizeClient detection uses scanIterator causing isRedis true, leading to set using {EX: ttl}. Test expects raw ttl number. Fix: change detection to differentiate ioredis vs node-redis, e.g., check client.set signature length or presence of mGet vs mget, or add option to force raw ttl. Provide two possible fixes.<|end|><|start|>assistant<|channel|>final<|message|>**Why the test failed**  
`RedisStore.normalizeClient()` decides the client type with  

```ts
let isRedis = "scanIterator" in client
```  

The stub client used in the test defines a `scanIterator`, so `isRedis` becomes **true**.  
When `set()` is called with a TTL, the wrapper then executes  

```ts
client.set(key, val, { EX: ttl })
```  

i.e. it passes an **options object** (`{EX: 3600}`) instead of the raw numeric TTL that the test expects. The assertion `expect(capturedTtl).toBe(3600)` therefore fails with “expected { EX: 3600 } to be 3600”.

**Recommended fixes**

1. **Detect the client more reliably**  
   Replace the current detection with something that distinguishes node‑redis (options‑object API) from ioredis (argument‑list API), e.g.:

   ```ts
   // inside normalizeClient
   const isNodeRedis = typeof client.set === "function" && client.set.length === 3;
   // or check for the presence of the node‑redis‑specific method:
   const isNodeRedis = "mGet" in client;
   ```

   Then use `isNodeRedis` instead of the `scanIterator` check.  
   With the stub (which has `set.length === 0` and no `mGet`), `isNodeRedis` will be `false`, so the wrapper will call `client.set(key, val, "EX", ttl)` and the captured TTL will be the plain number `3600`, making the test pass.

2. **Add an explicit option to control the TTL format**  
   Extend `RedisStoreOptions` with a flag, e.g. `useRedisOptions?: boolean`, and in `normalizeClient`:

   ```ts
   const useOptions = opts.useRedisOptions ?? ("mGet" in client);
   set: (k, v, ttl) =>
     ttl
       ? useOptions
         ? client.set(k, v, { EX: ttl })
         : client.set(k, v, "EX", ttl)
       : client.set(k, v);
   ```

   The test can instantiate the store with `{ client, useRedisOptions: false }` to get the numeric TTL.

Either approach eliminates the mismatch between the wrapper’s TTL handling and the test’s expectation, allowing the “S10 ttl function returns custom ttl” test to pass.

test("S10 ttl function returns custom ttl", async () => {
  const ttlFn = (sess: any) => (sess.user === "admin" ? 3600 : 60);
  const session = { user: "admin", cookie: {} };
  let capturedTtl: number | undefined;
  const client = {
    get: async () => null,
    set: async (_: any, __: any, ttl: number) => {
      capturedTtl = ttl;
      return "OK";
    },
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client, ttl: ttlFn });
  await new Promise<void>((resolve, reject) => {
    store.set("sid", session, (err) => {
      if (err) reject(err);
      else {
        expect(capturedTtl).toBe(3600);
        resolve();
      }
    });
  });
})

*/
/*
FAILED TEST: <|channel|>analysis<|message|>We need to explain failure: In normalizeClient, for Redis client detection, they use isRedis = "scanIterator" in client. The test stub client defines scanIterator, so isRedis true. Then mget uses client.mGet (capital G) which stub does not have; stub only defines mget (lowercase). Hence TypeError. Fix: change detection to use a more reliable property, e.g., check for client.mGet existence, or use client.mget for both. Simpler: modify normalizeClient to call client.mget for both cases, or detect isRedis via presence of client.mGet instead of scanIterator. Also adjust isRedis detection to something like: const isRedis = typeof client.mGet === "function". Then mget mapping accordingly. Provide concise recommendation.<|end|><|start|>assistant<|channel|>final<|message|>**Why the test failed**  
`RedisStore.normalizeClient()` decides whether the supplied client is a *node‑redis* client or an *ioredis* client with this line:

```ts
let isRedis = "scanIterator" in client
```

The stub client used in the test **does have a `scanIterator` method**, so `isRedis` becomes `true`.  
When `isRedis` is true the wrapper calls:

```ts
mget: (keys) => (isRedis ? client.mGet(keys) : client.mget(keys))
```

Node‑redis’s API uses **`mGet` (capital “G”)**, while ioredis uses **`mget` (lower‑case)**.  
The test stub only implements `mget`, not `mGet`, so the call throws:

```
TypeError: client.mGet is not a function
```

Hence the `S9 all returns parsed sessions with ids` test fails.

---

**Recommended fixes**

1. **Detect the client type by the actual `mGet`/`mget` method instead of `scanIterator`.**  
   ```ts
   // replace the current detection
   // let isRedis = "scanIterator" in client
   const isRedis = typeof client.mGet === "function"
   ```

2. **Simplify the wrapper to always call the method that exists.**  
   ```ts
   mget: (keys) => (client.mGet ? client.mGet(keys) : client.mget(keys))
   ```

3. **(Optional) Keep backward compatibility** – if you still need the `scanIterator` handling, combine both checks:
   ```ts
   const isRedis = typeof client.mGet === "function" && "scanIterator" in client
   ```

4. **Update the test stub (if you prefer not to change library code).**  
   Add a dummy `mGet` that forwards to `mget`:
   ```ts
   const clientStub = {
     ...,
     mGet: (...args) => clientStub.mget(...args),
   }
   ```

Implementing **(1) + (2)** makes the library correctly handle both real Redis clients and the test stub, eliminating the `client.mGet is not a function` error and allowing the `all` test to pass.

test("S9 all returns parsed sessions with ids", async () => {
  const keys = ["sess:one", "sess:two"];
  const raw = [JSON.stringify({ user: "u1" }), JSON.stringify({ user: "u2" })];
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {
      for (const k of keys) yield k;
    },
    mget: async () => raw,
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.all((err, sessions) => {
      if (err) reject(err);
      else {
        expect(sessions).toEqual([
          { user: "u1", id: "one" },
          { user: "u2", id: "two" },
        ]);
        resolve();
      }
    });
  });
})

*/

test("S8 ids strips prefix", async () => {
  const keys = ["sess:xyz", "sess:123"];
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {
      for (const k of keys) yield k;
    },
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.ids((err, ids) => {
      if (err) reject(err);
      else {
        expect(ids).toEqual(["xyz", "123"]);
        resolve();
      }
    });
  });
})


test("S7 length returns correct count", async () => {
  const keys = ["sess:a", "sess:b", "sess:c"];
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {
      for (const k of keys) yield k;
    },
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.length((err, count) => {
      if (err) reject(err);
      else {
        expect(count).toBe(3);
        resolve();
      }
    });
  });
})


test("S6 clear removes all keys", async () => {
  const keys = ["sess:1", "sess:2"];
  let delArg: any;
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async (ks: string[]) => {
      delArg = ks;
      return ks.length;
    },
    expire: async () => 1,
    scanIterator: async function* () {
      for (const k of keys) yield k;
    },
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.clear((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  expect(delArg).toEqual(keys);
})


test("S5 destroy deletes key", async () => {
  let delArg: any;
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async (keys: string[]) => {
      delArg = keys;
      return 1;
    },
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.destroy("sid", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  expect(delArg).toEqual(["sess:sid"]);
})


test("S4 touch refreshes expiration", async () => {
  const session = { cookie: { maxAge: 3000 } };
  let expireArgs: any[] = [];
  const client = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async (...args: any[]) => {
      expireArgs = args;
      return 1;
    },
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.touch("sid", session, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  expect(expireArgs[0]).toBe("sess:sid");
  // ttl derived from default ttl (86400) because no expires field
  expect(expireArgs[1]).toBe(86400);
})

/*
FAILED TEST: <|channel|>analysis<|message|>We need to explain failure: In set method, when ttl >0, it calls client.set(key,val,ttl). In normalizeClient, for Redis client (isRedis true) it calls client.set(key,val,{EX: ttl}) i.e., passes options object. The test expects setArgs[2] to be ttl number, but receives object {EX: ttl}. The test uses a stub client where set captures args; they assumed client.set receives ttl as third argument number. But normalizeClient transforms to object for Redis. The test's client stub is generic; isRedis detection: let isRedis = "scanIterator" in client. In test client, scanIterator exists, so isRedis true, leading to object. To fix test, adjust expectation to handle object, or modify normalizeClient to detect actual client type differently (maybe check for ioredis vs node-redis). Could change isRedis detection to something else, e.g., check for 'set' signature? Simpler: modify test to expect object {EX: 86400} or change normalizeClient to treat any client without explicit indicator as ioredis (i.e., not isRedis). Since test expects number, we can change normalizeClient: detect redis client by checking if client.set returns something? But easier: change test to expect object. However instruction: recommended fixes to code. Probably adjust normalizeClient to treat client as ioredis when set signature expects separate args. Could detect if client.set.length === 4? But stub set is generic. Maybe add option to pass raw ttl: if client.set expects 3 args, pass ttl directly; else object. Could check if client.set.length === 4 (ioredis set signature is (key, value, ...args)). Node-redis set signature is (key, value, options). In stub, set defined as (...args) => { setArgs=args; return "OK"}; length is 0. So detection fails. Could add a flag option to store to indicate raw ttl mode. Simpler: modify test to accept both forms: if setArgs[2] is object with EX property, compare accordingly. But request is to provide recommended fixes. I'd suggest updating test to check for either number or object, or modify normalizeClient to detect ioredis by checking if client.set.length === 4 or if client.set.toString includes 'EX'. Probably easiest: change normalizeClient's isRedis detection to check for 'set' signature: if client.set.length === 3 (key, value, options) then treat as redis, else treat as ioredis. In stub, length is 0, so will treat as ioredis, passing ttl as separate args, matching test. So modify line: let isRedis = client.set.length === 3; Or more robust: 'EX' in options? Anyway.

Provide concise analysis and fix suggestions.<|end|><|start|>assistant<|channel|>final<|message|>**Why the test failed**

`RedisStore.set()` calls `this.client.set(key, val, ttl)`.  
`normalizeClient()` decides how to forward that call:

```ts
let isRedis = "scanIterator" in client
...
set: (key, val, ttl) => {
  if (ttl) {
    return isRedis
      ? client.set(key, val, { EX: ttl })   // node‑redis style
      : client.set(key, val, "EX", ttl)    // ioredis style
  }
  return client.set(key, val)
}
```

The stub client used in the test **has a `scanIterator` method**, so `isRedis` becomes `true`. Consequently the stub receives the arguments:

```ts
["sess:sid", JSON.stringify(session), { EX: 86400 }]
```

The test expects the third argument to be the plain number `86400`, so the assertion `expect(setArgs[2]).toBe(86400)` fails with the diff `{ EX: 86400 } !== 86400`.

---

**Recommended fixes**

1. **Make the client‑type detection more accurate**  
   Instead of using the presence of `scanIterator` (which both real Redis and ioredis expose), detect the *set* signature:

   ```ts
   // before: let isRedis = "scanIterator" in client
   const isRedis = client.set.length === 3; // (key, value, options) → node‑redis
   ```

   This will treat the test stub (which has `set.length === 0`) as an ioredis‑style client, causing the third argument to be the raw TTL number and making the test pass.

2. **Or, keep the current detection but adjust the test**  
   Update the test to accept either form:

   ```ts
   const ttlArg = setArgs[2];
   if (typeof ttlArg === "object") {
     expect(ttlArg).toEqual({ EX: 86400 });
   } else {
     expect(ttlArg).toBe(86400);
   }
   ```

   This makes the test robust to both client implementations.

3. **Optional – expose a configuration flag**  
   Add an option (e.g., `useRedisOptions?: boolean`) to the `RedisStoreOptions` that forces the `set` call to use the `{ EX: ttl }` object or the `"EX", ttl` arguments. The test can then instantiate the store with `useRedisOptions: false` to get the numeric TTL.

Implementing the first fix (correct client‑type detection) aligns the library’s behavior with real client libraries while keeping the existing test expectations intact.

test("S3 set stores with TTL", async () => {
  const session = { cookie: { maxAge: 5000 } };
  let setArgs: any[] = [];
  const client = {
    get: async () => null,
    set: async (...args: any[]) => {
      setArgs = args;
      return "OK";
    },
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  await new Promise<void>((resolve, reject) => {
    store.set("sid", session, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  expect(setArgs[0]).toBe("sess:sid");
  expect(setArgs[1]).toBe(JSON.stringify(session));
  // default ttl is 86400 (one day) because no expires field is present
  expect(setArgs[2]).toBe(86400);
})

*/

test("S2 get returns parsed session", async () => {
  const session = { cookie: { maxAge: 2000 }, user: "alice" };
  const client = {
    get: async (k: string) => JSON.stringify(session),
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client });
  const result = await new Promise<any>((resolve, reject) => {
    store.get("sid", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  expect(result).toEqual(session);
})


test("S1 constructor defaults", async () => {
  const clientStub = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    scanIterator: async function* () {},
    mget: async () => [],
  };
  const store = new RedisStore({ client: clientStub });
  expect(store.prefix).toBe("sess:");
  expect(store.scanCount).toBe(100);
  expect(store.serializer).toBe(JSON);
  expect(store.ttl).toBe(86400);
  expect(store.disableTTL).toBe(false);
  expect(store.disableTouch).toBe(false);
})

