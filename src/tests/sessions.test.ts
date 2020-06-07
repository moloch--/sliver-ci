import * as fs from 'fs'
import * as path from 'path'

import { SliverClient, ParseConfigFile } from 'sliver-script'
import * as common from '../common'

const PINGS = 25
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

test('Session Interact: ping', async () => {
    const sessions = await client.sessions()
    sessions.forEach(async (session) => {
        for (let index = 0; index < PINGS; ++index) {
            const interact = await client.interact(session)
            const nonce = Math.ceil(Math.random() * 10000000)
            const pong = await interact.ping(nonce)
            expect(pong.getNonce()).toEqual(nonce)
        }
    })
}, TIMEOUT)

test('Session Interact: ls', async () => {
    const sessions = await client.sessions()
    sessions.forEach(async (session) => {
        const interact = await client.interact(session)
        const ls = await interact.ls('./data')
        expect(ls.getExists()).toBeTruthy()

        const data = ['a.txt', 'b.txt', 'c']

        ls.getFilesList().forEach(file => {
            expect(data.some(a => a === file.getName())).toBeTruthy()
            if (file.getName() === 'c') {
                expect(file.getIsdir()).toBeTruthy()
            } else {
                expect(file.getIsdir()).toBeFalsy()
            }
        })
    })
}, TIMEOUT)

test('Session Interact: pwd / cd', async () => {
    const sessions = await client.sessions()
    sessions.forEach(async (session) => {
        const interact = await client.interact(session)
        const cwd = await interact.pwd()
        const parent = await interact.cd('..')
        expect(cwd.getPath().startsWith(parent.getPath()))
        const orig = await interact.cd(cwd.getPath())
        expect(cwd.getPath() === orig.getPath())
        const test = await interact.cd('test')
        expect(test.getPath().endsWith('test'))
        const orig2 = await interact.cd('..')
        expect(cwd.getPath() === orig2.getPath())
    })
}, TIMEOUT)

test('Session Interact: mkdir', async () => {
    const sessions = await client.sessions()
    sessions.forEach(async (session) => {
        const interact = await client.interact(session)
        const cwd = await interact.pwd()

        await interact.cd('test')
        await interact.mkdir('z')
        const z = await interact.cd('z')
        expect(z.getPath().endsWith('z'))

        await interact.cd(cwd.getPath())
    })
}, TIMEOUT)

test('Session Interact: upload', async () => {
    const smallFile = await common.generateRandomFile(1024)
    const mediumFile = await common.generateRandomFile(1024*1024*2)
    const largeFile = await common.generateRandomFile(1024*1024*100)

    // console.log(`smallFile = ${smallFile}`)
    // console.log(`mediumFile = ${mediumFile}`)
    // console.log(`largeFile = ${largeFile}`)

    const sessions = await client.sessions()
    for (let index = 0; index < sessions.length; ++index) {
        const interact = await client.interact(sessions[index])
        const smallData = await common.readFileAsync(smallFile)
        const smallDst = `${smallFile}.up`
        //console.log(`Upload small file: ${smallFile} -> ${smallDst}`)
        //console.log(typeof smallData)
        const upload = await interact.upload(smallDst, smallData)
        let same = await common.isSameFile(smallFile, smallDst)
        expect(same).toBeTruthy()
        fs.unlinkSync(smallDst)
    }

    fs.unlinkSync(smallFile)
    fs.unlinkSync(mediumFile)
    fs.unlinkSync(largeFile)
}, TIMEOUT)


// test('Session Interact: download / cat', async () => {
//     const smallFile = await common.generateRandomFile(1024)
//     const mediumFile = await common.generateRandomFile(1024*1024*2)
//     const largeFile = await common.generateRandomFile(1024*1024*100)

//     console.log(`smallFile = ${smallFile}`)
//     console.log(`mediumFile = ${mediumFile}`)
//     console.log(`largeFile = ${largeFile}`)


//     const sessions = await client.sessions()
//     sessions.forEach(async (session) => {
//         const interact = await client.interact(session)

//     })

//     fs.unlinkSync(smallFile)
//     fs.unlinkSync(mediumFile)
//     fs.unlinkSync(largeFile)
// }, TIMEOUT)

