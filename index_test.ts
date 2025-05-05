import {test} from "vitest"
import * as redisSrv from "./testdata/server"

test("setup", async () => {
  await redisSrv.connect()
})

