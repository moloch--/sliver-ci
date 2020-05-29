import { SliverClient, ParseConfigFile } from 'sliver-script'
import * as common from '../common'

const TIMEOUT = 1000 * 30
let client: SliverClient|null = null


beforeAll(async () => {
    const config = await ParseConfigFile(common.CLIENT_CONFIG_PATH)
    client = new SliverClient(config)
    await client.connect()
}, TIMEOUT)

// --- Sessions ---

test('List Sessions', async () => {
    const sessions = await client.sessions()
    expect(sessions.length).toEqual(2)
}, TIMEOUT)

test('Session Interact / Ping', async () => {
    const sessions = await client.sessions()
    sessions.forEach(async (session) => {
        const interact = await client.interact(session)
        const pong = await interact.ping()
    })
}, TIMEOUT)

// --- Jobs ---

test('List Jobs', async () => {
    const jobs = await client.jobs()
    expect(jobs.length).toEqual(2)
}, TIMEOUT)

test('Start/Stop HTTP Listener', async () => {
    const httpJob = await client.startHTTPListener('', '127.0.0.1', 8080)
    let jobs = await client.jobs()
    expect(jobs.length).toEqual(3)
    
    await client.killJob(httpJob.getJobid())

    jobs = await client.jobs()
    expect(jobs.length).toEqual(2)
}, TIMEOUT)

test('Start/Stop HTTPS Listener', async () => {
    const httpsJob = await client.startHTTPSListener('', '127.0.0.1', 8443)
    let jobs = await client.jobs()
    expect(jobs.length).toEqual(3)

    await client.killJob(httpsJob.getJobid())

    jobs = await client.jobs()
    expect(jobs.length).toEqual(2)
}, TIMEOUT)

test('Start/Stop DNS Listener', async () => {
    const dnsJob = await client.startDNSListener(['example.com.'], false, '127.0.0.1', 8443)
    let jobs = await client.jobs()
    expect(jobs.length).toEqual(3)
    
    await client.killJob(dnsJob.getJobid())

    jobs = await client.jobs()
    expect(jobs.length).toEqual(2)
}, TIMEOUT)
