import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

import * as common from './common';

import { SliverClient, ParseConfigFile } from 'sliver-script'
import { ImplantConfig, ImplantC2 } from 'sliver-script/lib/pb/clientpb/client_pb';


async function sleep(ms): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function getClient(): Promise<SliverClient> {
    try {
        const config = await ParseConfigFile(common.CLIENT_CONFIG_PATH)
        const client = new SliverClient(config)
        console.log(`Connecting to ${config.lhost}:${config.lport} ...`)
        await client.connect()
        console.log('Connection successful!')
        return client
    } catch (err) {
        console.error(err) // Because Node is _fucking_ dumb
        process.exit(1)    // this can only be caught here.
    }
}

async function compileImplant(): Promise<string> {
    try {
        const client = await getClient()

        const c2 = new ImplantC2()
        c2.setUrl('mtls://127.0.0.1:8888')

        const implantConfig = new ImplantConfig()
        implantConfig.setC2List([c2])
        implantConfig.setDebug(true)
        implantConfig.setGoos(process.platform)
        implantConfig.setGoarch('amd64')
        implantConfig.setObfuscatesymbols(false)
        implantConfig.setFormat(2) // Executable
        const implantFile = await client.generate(implantConfig)
        console.log(`Got: ${implantFile.getName()}`)
        return ''

    } catch (err) {
        console.error(err) // Because Node is _fucking_ dumb
        process.exit(1)    // this can only be caught here.
    }
}

export async function setup() {

    const server = common.getSliverServerPath()
    await common.run(server, ['unpack', '--force'])
    await common.run(server, [
        'operator',
        '--name', 'ci',
        '--lhost', '127.0.0.1',
        '--lport', '31337',
        '--save', common.CLIENT_CONFIG_PATH,
    ])
    const config = common.getSliverServerConfigPath()
    fs.copyFileSync(config, path.join(common.APP_ROOT, 'configs', 'server.json'))

    let child = cp.spawn(server)
    fs.writeFileSync(path.join(common.REPO_ROOT, 'pid'), child.pid.toString())

    await sleep(2000) // Wait for server to init



    await compileImplant()


}

export async function teardown() {
    process.exit(0)
}