
import * as redisSrv from "./testdata/server"
import {RedisStore} from "./"

test("setup", async () => {
  await redisSrv.connect()
})

