import { SliverClient, ParseConfigFile } from 'sliver-script'
import * as common from '../common'

const TIMEOUT = 1000 * 30
let client: SliverClient|null = null


beforeAll(async () => {
    const config = await ParseConfigFile(common.CLIENT_CONFIG_PATH)
    client = new SliverClient(config)
    console.log(`Before all connect to ${config.lhost}:${config.lport} ...`)
    await client.connect()
    console.log('Connection successful!')
}, TIMEOUT)

test('List Sessions', async () => {
    const sessions = await client.sessions()
    console.log(`Number of sessions ${sessions.length}`)
    expect(sessions.length).toEqual(2)
}, TIMEOUT)
