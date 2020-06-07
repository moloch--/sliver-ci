import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

import * as common from './common';

import { SliverClient, ParseConfigFile } from 'sliver-script'
import { ImplantConfig, ImplantC2 } from 'sliver-script/lib/pb/clientpb/client_pb';

let client: SliverClient;

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function initClient(): Promise<void> {
    try {
        const config = await ParseConfigFile(common.CLIENT_CONFIG_PATH)
        client = new SliverClient(config)
        console.log(`Connecting to ${config.lhost}:${config.lport} ...`)
        await client.connect()
        console.log('Connection successful!')
    } catch (err) {
        console.error(err) // Because Node is _fucking_ dumb
        process.exit(1)    // this can only be caught here.
    }
}

async function compileImplant(c2URL: string): Promise<string> {
    try {
        await initClient()
        const c2 = new ImplantC2()
        c2.setUrl(c2URL)
        const implantConfig = new ImplantConfig()
        implantConfig.setC2List([c2])
        implantConfig.setDebug(true)
        implantConfig.setGoos(process.platform === 'win32' ? 'windows' : process.platform)
        implantConfig.setGoarch('amd64')
        implantConfig.setObfuscatesymbols(false)
        implantConfig.setFormat(2) // Executable
        implantConfig.setMaxconnectionerrors(10)
        implantConfig.setReconnectinterval(1)
        const implantFile = await client.generate(implantConfig)
        const filename = process.platform === 'win32' ? `${implantFile.getName()}.exe` : implantFile.getName()
        fs.writeFileSync(path.join(common.REPO_ROOT, filename), implantFile.getData(), {
            mode: 0o777,
        })
        return path.join(common.REPO_ROOT, filename)
    } catch (err) {
        console.error(err) // Because Node is _fucking_ dumb
        process.exit(1)    // this can only be caught here.
    }
}

export async function setup() {
    try {

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
    
        // Server Setup
        let serverChild = cp.spawn(server)
        fs.writeFileSync(`${server}.log`, '')
        serverChild.stdout.on('data', (data) => {
            fs.appendFileSync(`${server}.log`, data.toString())
        })
        serverChild.stderr.on('data', (data) => {
            console.log(`\x1b[31m${data.toString()}\x1b[0m`)
            fs.appendFileSync(`${server}.log`, data.toString())
        })
        serverChild.on('close', (code) => {
            console.log(`\nServer child process exited with code ${code}`)
            fs.appendFileSync(`${server}.log`, `\n*** Server child process exited with code ${code} ***`)
            process.exit(1)
        })
        fs.writeFileSync(path.join(common.REPO_ROOT, 'server.pid'), serverChild.pid.toString())
        await sleep(2000)
    
        // Compile implants
        const mtlsImplant = await compileImplant('mtls://127.0.0.1:8888')
        const httpsImplant = await compileImplant('https://127.0.0.1')
    
        // Start listeners
        const mtlsListener = await client.startMTLSListener('127.0.0.1', 8888)
        console.log(`MTLS Listener - Job #${mtlsListener.getJobid()}`)
        const httpsListener = await client.startHTTPSListener('', '127.0.0.1', 443)
        console.log(`HTTPS Listener - Job #${httpsListener.getJobid()}`)

        // MTLS Implant Setup
        let mtlsImplantChild = cp.spawn(mtlsImplant)
        fs.writeFileSync(`${mtlsImplant}.log`, '')
        mtlsImplantChild.stdout.on('data', (data) => {
            fs.appendFileSync(`${mtlsImplant}.log`, data.toString())
        })
        mtlsImplantChild.stderr.on('data', (data) => {
            fs.appendFileSync(`${mtlsImplant}.log`, data.toString())
        })
        mtlsImplantChild.on('close', (code) => {
            console.log(`mtls implant child process exited with code ${code}`)
            fs.appendFileSync(`${mtlsImplant}.log`, `\n*** mtls implant child process exited with code ${code} ***`)
            process.exit(1)
        })
        fs.writeFileSync(path.join(common.REPO_ROOT, 'mtls-implant.pid'),  mtlsImplantChild.pid.toString())
        
        // HTTPS Implant Setup
        let httpsImplantChild = cp.spawn(httpsImplant)
        fs.writeFileSync(`${httpsImplant}.log`, '')
        httpsImplantChild.stdout.on('data', (data) => {
            fs.appendFileSync(`${httpsImplant}.log`, data.toString())
        })
        httpsImplantChild.stderr.on('data', (data) => {
            fs.appendFileSync(`${httpsImplant}.log`, data.toString())
        })
        httpsImplantChild.on('close', (code) => {
            console.log(`https implant child process exited with code ${code}`)
            fs.appendFileSync(`${httpsImplant}.log`, `\n*** https implant child process exited with code ${code} ***`)
            process.exit(1)
        })
        fs.writeFileSync(path.join(common.REPO_ROOT, 'https-implant.pid'), httpsImplantChild.pid.toString())
        
        await sleep(1000)
        const sessions = await client.sessions()
        console.log(`Setup created ${sessions.length} session(s)`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

export async function teardown() {
    process.exit(0)
}
