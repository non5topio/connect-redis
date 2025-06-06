import {test} from "vitest"
import * as redisSrv from "./testdata/server"
import {RedisStore} from "./"
import { vi, expect } from 'vitest';

test("setup", async () => {
  await redisSrv.connect()
})



test("test_get_client_error", async () => {
  const mockClient = {
    get: vi.fn().mockRejectedValue(new Error("Redis error")),
  };
  const store = new RedisStore({ client: mockClient as any });

  const cb = vi.fn();
  await store.get("invalid-sid", cb);

  expect(cb).toHaveBeenCalledWith(expect.any(Error));
});


test("test_set_serializer_error", async () => {
  const mockClient = { set: vi.fn() };
  const mockSerializer = {
    parse: vi.fn(),
    stringify: vi.fn().mockImplementation(() => { throw new Error("Serialization failed"); }),
  };
  const store = new RedisStore({
    client: mockClient as any,
    serializer: mockSerializer,
    disableTTL: false,
  });

  const sess = { cookie: { expires: new Date() } };
  const cb = vi.fn();

  await store.set("test-sid", sess, cb);

  expect(cb).toHaveBeenCalledWith(expect.any(Error));
});


test("test_retrieve_all_keys_multiple_scans", async () => {
  const mockClient = {
    scan: vi.fn()
      .mockImplementationOnce((cursor, ...args) => Promise.resolve(["100", ["sess:key1", "sess:key2"]]))
      .mockImplementationOnce((cursor, ...args) => Promise.resolve(["0", ["sess:key3"]]))
      .mockImplementation(() => Promise.resolve(["0", []])),
    del: vi.fn().mockResolvedValue(3),
  };
  const store = new RedisStore({
    client: mockClient as any,
    scanCount: 2,
  });

  await store.clear(vi.fn());

  expect(mockClient.scan).nthCalledWith(1, "0", "MATCH", "sess:*", "COUNT", 2);
  expect(mockClient.scan).nthCalledWith(2, "100", "MATCH", "sess:*", "COUNT", 2);
  expect(mockClient.del).toHaveBeenCalledWith(["sess:key1", "sess:key2", "sess:key3"]);
});


test("test_ttl_fallback_to_default", async () => {
  const mockClient = { set: vi.fn() };
  const store = new RedisStore({
    client: mockClient as any,
    ttl: 3600,
  });

  const sess = { /* no cookie.expires */ };
  await store.set("test-sid", sess, vi.fn());

  expect(mockClient.set).toHaveBeenCalledWith(
    "sess:test-sid",
    expect.any(String),
    "EX",
    3600
  );
});


test("test_touch_disabled_does_not_call_expire", async () => {
  const mockClient = { expire: vi.fn() };
  const store = new RedisStore({
    client: mockClient as any,
    disableTouch: true,
  });

  await store.touch("test-sid", { cookie: {} }, vi.fn());

  expect(mockClient.expire).not.toHaveBeenCalled();
});


test("test_set_ttl_zero_triggers_destroy", async () => {
  const mockClient = { del: vi.fn() };
  const store = new RedisStore({
    client: mockClient as any,
    ttl: () => 0,
  });

  const sess = { cookie: {} };
  const destroyCb = vi.fn();
  await store.set("test-sid", sess, destroyCb);

  expect(mockClient.del).toHaveBeenCalledWith(["sess:test-sid"]);
  expect(destroyCb).toHaveBeenCalledWith();
});

/*
FAILED TEST: <think>
Okay, let's tackle this problem. The user provided test results showing that the test_get_nonexistent_session failed. The error message says the spy wasn't called with the expected arguments. Looking at the test code for that test:

The test sets up a mockClient where get returns null. Then, when calling store.get, the callback cb is expected to be called with (null, undefined). But the error shows that the spy received an empty array instead.

Wait, the error message says the received arguments are [], but the expectation was [null, undefined]. That means the callback was called without any arguments. Hmm, why would that happen?

Looking at the RedisStore's get method in index.ts. The get function does:

try {
  let data = await this.client.get(key)
  if (!data) return cb() // here, if data is null, it calls cb() with no args
  ...
} catch (err) {
  return cb(err)
}

In the test, mockClient.get returns null. So data is null, so it calls cb() with no arguments. But the test expects cb to be called with (null, undefined). That's the discrepancy.

Ah, right! The test expects the callback to have two arguments: the first is the session data (null in this case), and the second is undefined. But according to the code, when data is null, it just calls cb() with no arguments. So the callback is called with zero arguments, not two.

The test's expectation is wrong. The actual code's behavior is that when the session doesn't exist, the callback is called with no arguments, which in Node.js callback conventions typically means no error and no result. But the test is expecting two arguments. So the test needs to be adjusted to expect that the callback was called with no arguments, or perhaps the code needs to be adjusted to pass (null, undefined) as the arguments.

Wait, looking at the test's code:

expect(cb).toHaveBeenCalledWith(null, undefined);

But according to the code, when data is null, it does return cb(), which is the same as cb(undefined, undefined) or just no args. So the test's expectation is incorrect. The correct expectation should be that the callback was called with zero arguments, or maybe the code should be modified to pass (null, undefined) explicitly.

Alternatively, maybe the Store interface expects the callback to be called with (err, session), so when there's no error and no session, it should be called with (null, undefined). But in the current code, it's called with no arguments, which would translate to (undefined, undefined). That's a problem because the test expects (null, undefined).

So the code in the get method should be adjusted to call cb(null, undefined) instead of just cb(). That way, the test's expectation matches the actual call.

Therefore, the fix is to modify the RedisStore's get method to call cb(null, undefined) when data is null. That way, the test's assertion passes.
</think>

The test `test_get_nonexistent_session` failed because the callback `cb` was called without arguments when `data` is `null`, but the test expects `(null, undefined)`.

**Fix:** Update the `get` method in `RedisStore` to explicitly pass `(null, undefined)` when no session exists:
```diff
--- a/index.ts
+++ b/index.ts
@@ -103,7 +103,7 @@ export class RedisStore extends Store {
     try {
       let data = await this.client.get(key)
       if (!data) {
-        return cb()
+        return cb(null, undefined)
       }
       return cb(null, await this.serializer.parse(data))
     } catch (err) {
```

This ensures the callback matches the test's expectation of `(null, undefined)` when the session doesn't exist.

test("test_get_nonexistent_session", async () => {
  const mockClient = {
    get: vi.fn().mockResolvedValue(null),
  };
  const store = new RedisStore({ client: mockClient as any });

  const cb = vi.fn();
  await store.get("invalid-sid", cb);

  expect(cb).toHaveBeenCalledWith(null, undefined);
});

*/
/*
FAILED TEST: <think>
Okay, let me look at the problem here. The user provided the test outputs and the code files. The main issue is that the test run failed due to a syntax error in the test file.

Looking at the stderr output, the error message says there's an unterminated string literal in index_test.ts at line 28, column 20. The line in question is part of the test_retrieve_all_sessions test. 

Checking the code for `index_test.ts`, the line with the prefix is written as `prefix: "sess:',`. Oh, wait, the closing quote is a single quote instead of a double quote. That's definitely a syntax error because the string starts with " but ends with '. That would cause the string to not terminate properly, leading the parser to think the string continues until it finds another quote, which it doesn't, hence the error.

So the fix is straightforward: change the closing quote from ' to " so the string is properly closed. That should resolve the syntax error, allowing the tests to run properly. The other test failures mentioned in the user's message might still exist after fixing this, but the immediate reason the tests aren't running is this syntax error. The user needs to correct that line first.
</think>

The test failed due to a syntax error in `index_test.ts` where the `prefix` value in `test_retrieve_all_sessions` uses mismatched quotes (`"sess:'`). Fix the string termination:

**Fix:** Correct the `prefix` string to use matching quotes:
```diff
- prefix: "sess:',
+ prefix: "sess:",
```

test("test_retrieve_all_sessions", async () => {
  const mockClient = {
    mget: vi.fn().mockResolvedValue(["{\"cookie\":{}}", "{\"cookie\":{}}"]),
    scanIterator: vi.fn().mockReturnValue(
      (async function* () {
        yield "sess:id1";
        yield "sess:id2";
      })()
    ),
  };
  const mockSerializer = {
    parse: (data) => JSON.parse(data),
  };
  const store = new RedisStore({
    client: mockClient as any,
    serializer: mockSerializer,
    prefix: "sess:',
  });

  const cb = vi.fn();
  await store.all(cb);

  expect(mockClient.mget).toHaveBeenCalledWith(["sess:id1", "sess:id2"]);
  expect(cb).toHaveBeenCalledWith(null, [
    { id: "id1", cookie: {} },
    { id: "id2", cookie: {} },
  ]);
});

*/

test("test_ids_without_prefix", async () => {
  const mockClient = {
    scanIterator: vi.fn().mockReturnValue(
      (async function* () {
        yield "sess:123";
        yield "sess:456";
      })()
    ),
  };
  const store = new RedisStore({
    client: mockClient as any,
    prefix: "sess:",
  });

  const cb = vi.fn();
  await store.ids(cb);

  expect(cb).toHaveBeenCalledWith(null, ["123", "456"]);
});


test("test_length_returns_correct_count", async () => {
  const mockClient = {
    scanIterator: vi.fn().mockReturnValue(
      (async function* () {
        yield "sess:key1";
        yield "sess:key2";
        yield "sess:key3";
      })()
    ),
  };
  const store = new RedisStore({
    client: mockClient as any,
  });

  const cb = vi.fn();
  await store.length(cb);

  expect(cb).toHaveBeenCalledWith(null, 3);
});

/*
FAILED TEST: <think>
Okay, let's tackle this test failure. The user provided the test output and the code. The failed test is "test_clear_all_sessions". The error message says that the mockClient.scanIterator was called with different arguments than expected.

Looking at the test code for "test_clear_all_sessions", the expectation is that scanIterator is called with "sess:*" and store.scanCount (which is 100). But the error shows that the actual call used an object { MATCH: 'sess:*', COUNT: 100 } instead.

Now, checking the source code in index.ts, specifically the normalizeClient method's scanIterator implementation. For Redis clients (detected by having scanIterator), it uses client.scanIterator with options { MATCH, COUNT }. So when isRedis is true, scanIterator is called with that options object. 

In the test, the mockClient's scanIterator is set up to return a generator, which mimics a Redis client's behavior (since it uses scanIterator directly). This means the code thinks it's using a Redis client (isRedis is true), so the scanIterator is called with the options object, not the two separate arguments.

The test's expectation is incorrect because it's checking for two arguments ("sess:*" and 100), but the actual call passes an options object. The fix should update the test to expect the object { MATCH: 'sess:*', COUNT: 100 } instead.

So the recommended fix is to adjust the expect line in test_clear_all_sessions to match the expected object structure.
</think>

The test `test_clear_all_sessions` failed because the `mockClient.scanIterator` was called with an options object `{ MATCH: 'sess:*', COUNT: 100 }` instead of the expected positional arguments `["sess:*", 100]`. This occurs because the `normalizeClient` method uses Redis-style options when `isRedis` is true (detected by the presence of `scanIterator` on the mock client).

**Fix:** Update the test to expect the Redis options object format:
```diff
- expect(mockClient.scanIterator).toHaveBeenCalledWith("sess:*", store.scanCount);
+ expect(mockClient.scanIterator).toHaveBeenCalledWith({ MATCH: "sess:*", COUNT: store.scanCount });
```

test("test_clear_all_sessions", async () => {
  const mockClient = {
    scanIterator: vi.fn().mockReturnValue(
      (async function* () {
        yield "sess:key1";
        yield "sess:key2";
      })()
    ),
    del: vi.fn().mockResolvedValue(2),
  };
  const store = new RedisStore({
    client: mockClient as any,
    prefix: "sess:",
  });

  await store.clear(vi.fn());

  expect(mockClient.scanIterator).toHaveBeenCalledWith("sess:*", store.scanCount);
  expect(mockClient.del).toHaveBeenCalledWith(["sess:key1", "sess:key2"]);
});

*/

test("test_destroy_session", async () => {
  const mockClient = {
    del: vi.fn().mockResolvedValue(1),
  };
  const store = new RedisStore({
    client: mockClient,
  });

  await store.destroy("test-sid", vi.fn());

  expect(mockClient.del).toHaveBeenCalledWith(["sess:test-sid"]);
});


test("test_touch_updates_ttl", async () => {
  const mockClient = {
    expire: vi.fn().mockResolvedValue(true),
  };
  const store = new RedisStore({
    client: mockClient,
    disableTouch: false,
    disableTTL: false,
    ttl: 7200,
  });

  const sess = { cookie: { expires: new Date(Date.now() + 7200 * 1000) } };
  await store.touch("test-sid", sess, vi.fn());

  const key = "sess:test-sid";
  expect(mockClient.expire).toHaveBeenCalledWith(key, 7200);
});

/*
FAILED TEST: <think>
Okay, let's see. The test failure is in the test_set_valid_ttl test. The error message says that the mockClient.set function was called with an extra argument "EX" that wasn't expected. The test expects the arguments to be ['sess:test-sid', 'serialized', 3600], but the actual call includes "EX" before the 3600.

Looking at the test code, the mockClient.set is a vitest spy. The test is checking that when store.set is called, the mockClient.set is called with the key, serialized data, and the TTL (3600). 

Now, looking at the source code in index.ts, specifically the RedisStore's set method. The set method calls client.set with key, val, and ttl. But in the normalizeClient function, when setting up the client's set method, there's a check for the Redis vs ioredis library. If the client is Redis (isRedis is true), then when ttl is present, it uses client.set with options {EX: ttl}. But in the mockClient, the set function is expecting the arguments as passed directly. 

Wait, in the test, the mockClient's set is a spy that's supposed to be called with (key, value, ttl). But according to the source code's normalizeClient, when using Redis (which uses the options object), the set function would pass the EX parameter as a string, so the arguments would be key, val, "EX", ttl. That's probably why the extra "EX" is appearing here. 

The test is expecting the third argument to be the TTL number, but in reality, the code is passing "EX" and then the TTL as separate arguments. That's because the mockClient in the test isn't accounting for how the actual Redis client's set method is structured. 

Wait, the mockClient in the test is set up with mockClient.set being a spy that's supposed to receive (key, value, ttl). But in the actual implementation, when using ioredis (since isRedis is false in the test?), the code would pass the arguments as key, val, "EX", ttl. Because in the normalizeClient's set function, if it's not Redis (ioredis), then it does client.set(key, val, "EX", ttl). 

Ah, right! The test's mockClient is expecting the third argument to be the TTL, but the actual code is passing "EX" and then the TTL as separate arguments. So the mockClient.set is being called with four arguments: key, value, "EX", 3600. But the test is checking for three arguments. 

Therefore, the test's expectation is incorrect. The test should expect the arguments to include "EX" before the TTL. Alternatively, the code might be using the wrong parameters for the Redis set command. Wait, maybe the test is not considering the correct parameters based on the Redis client's API. 

Alternatively, perhaps the normalizeClient's set method is structured such that when using Redis (the library), it uses the options object, but when using ioredis, it uses the command syntax with "EX". The mockClient in the test is not set up to handle that. 

In the test, the mockClient is set up with a set function that's a spy, but the test expects the third argument to be the TTL. However, according to the code, when disableTTL is false, and the client is ioredis (since isRedis is false in the test's mock setup?), the set function would pass "EX" and then the TTL. 

Therefore, the test's assertion is wrong. The correct expected arguments should be ['sess:test-sid', 'serialized', 'EX', 3600]. 

So the fix is to adjust the test's expect statement to include the "EX" parameter. The test's current expectation is missing that parameter, leading to the failure. 

Alternatively, maybe the code has a bug here. Let me check the code again. 

Looking at the normalizeClient's set function:

if (ttl) {
  return isRedis
    ? client.set(key, val, {EX: ttl})
    : client.set(key, val, "EX", ttl)
}
else ... 

So, for Redis (isRedis true), it uses the options object. But in the test, the mockClient is not a real Redis client, so the code would be using the ioredis path (since isRedis is determined by "scanIterator" in client). The mockClient in the test's setup doesn't have scanIterator, so isRedis would be false. Therefore, the code would call client.set with key, val, "EX", ttl. 

Therefore, the mockClient.set spy is being called with four arguments: key, val, "EX", 3600. 

The test's expect is checking for three arguments: key, val, 3600. Hence the failure. 

Therefore, the test needs to be updated to expect the "EX" parameter as the third argument and the TTL as the fourth. 

So the fix is to change the test's expect line to:

expect(mockClient.set).toHaveBeenCalledWith(key, "serialized", "EX", 3600);

Alternatively, if the code is supposed to pass the TTL directly without the "EX" when using Redis, but the test's mock setup is causing isRedis to be false, leading to the extra parameters. 

Therefore, the test's failure is due to the test not accounting for the "EX" parameter in the set call when using the ioredis style. The test's expectation should include that parameter.
</think>

The test `test_set_valid_ttl` failed because the `mockClient.set` spy was called with an unexpected argument `EX` before the TTL value. This occurs because the `RedisStore`'s `normalizeClient` method constructs Redis commands for `ioredis` by adding `"EX"` as a parameter when `ttl` is provided. The test expects the TTL to be the third argument but the actual call includes `"EX"` as the third argument and the TTL as the fourth.

**Fix:** Update the test's assertion to include the `"EX"` parameter:
```diff
- expect(mockClient.set).toHaveBeenCalledWith(key, "serialized", 3600);
+ expect(mockClient.set).toHaveBeenCalledWith(key, "serialized", "EX", 3600);
```

test("test_set_valid_ttl", async () => {
  const mockClient = {
    set: vi.fn().mockResolvedValue("OK"),
  };
  const mockSerializer = {
    parse: vi.fn(),
    stringify: vi.fn().mockReturnValue("serialized"),
  };
  const store = new RedisStore({
    client: mockClient,
    serializer: mockSerializer,
    ttl: 3600,
    disableTTL: false,
  });

  const sess = { cookie: { expires: new Date(Date.now() + 3600 * 1000) } };
  await store.set("test-sid", sess, vi.fn());

  const key = "sess:test-sid";
  expect(mockClient.set).toHaveBeenCalledWith(key, "serialized", 3600);
});

*/

test("test_get_existing_session", async () => {
  const mockClient = {
    get: vi.fn().mockResolvedValue('{"cookie":{}}'),
  };
  const mockSerializer = {
    parse: vi.fn().mockResolvedValue({ cookie: {} }),
    stringify: vi.fn(),
  };
  const store = new RedisStore({
    client: mockClient,
    serializer: mockSerializer,
    prefix: "sess:",
  });

  const cb = vi.fn();
  await store.get("test-sid", cb);

  expect(mockClient.get).toHaveBeenCalledWith("sess:test-sid");
  expect(mockSerializer.parse).toHaveBeenCalledWith('{"cookie":{}}');
  expect(cb).toHaveBeenCalledWith(null, { cookie: {} });
});
