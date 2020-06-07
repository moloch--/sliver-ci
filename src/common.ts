import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cp from 'child_process';
import * as crypto from 'crypto';


export const REPO_ROOT = path.resolve(path.join(__dirname, '..'))
export const SERVER_FILENAME = process.platform === "win32" ? 'sliver-server.exe' : 'sliver-server'
export const SERVER_CONFIG_FILENAME = 'server.json'
export const DEFAULT_SERVER_PATH = path.join(REPO_ROOT, SERVER_FILENAME)
export const DEFAULT_SERVER_CONFIG_PATH = path.join(REPO_ROOT, SERVER_CONFIG_FILENAME)
export const SERVER_ENV_NAME = "SLIVER_SERVER"
export const SERVER_CONFIG_ENV_NAME = "SLIVER_CONFIG"
export const APP_ROOT = process.env['SLIVER_ROOT_DIR'] || path.join(os.homedir(), '.sliver')
export const CLIENT_CONFIG_PATH = path.join(REPO_ROOT, 'ci-client.cfg')


export async function readFileAsync(path: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            err ? reject(err) : resolve(data)
        })
    })
}

export async function writeFileAsync(path: string, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            err ? reject(err) : resolve()
        })
    })
}


// getSliverServerPath - Get the path to the sliver server binary
export function getSliverServerPath(): string {
    const serverPath = process.env[SERVER_ENV_NAME] || DEFAULT_SERVER_PATH;
    if (fs.existsSync(serverPath)) {
        return serverPath;
    }
    throw Error(`Server binary not found ${serverPath}`)
}


// getSliverServerConfigPath - Get path to configuration file
export function getSliverServerConfigPath() {
    const configPath = process.env[SERVER_CONFIG_ENV_NAME] || DEFAULT_SERVER_CONFIG_PATH;
    if (fs.existsSync(configPath)) {
        return configPath;
    }
    throw Error(`Server config not found ${configPath}`)
}


export async function run(cmd: string, args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = cp.spawn(cmd, args)
        child.on('exit', (status) => {
            status === 0 ? resolve(status) : reject(status)
        })
    })
}

const CHUNK_SIZE = 16 * 1024 // 16k chunks
export async function generateRandomFile(size: number): Promise<string> {
    const fileName = randomFileName(8)
    const randomFilePath = path.join(os.tmpdir(), fileName)

    const chunks = Math.floor(size / CHUNK_SIZE)
    const leftover = size % CHUNK_SIZE
    for (let chunk = 0; chunk < chunks; ++chunk) {
        const data = crypto.randomBytes(CHUNK_SIZE)
        await writeFileAsync(randomFilePath, data)
    }
    const data = crypto.randomBytes(leftover)
    await writeFileAsync(randomFilePath, data)  

    return randomFilePath
}

function randomFileName(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let index = 0; index < length; index++) {
       result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function isSameFile(src: string, dst: string): Promise<boolean> {
    const srcMd5 = await md5File(src)
    const dstMd5 = await md5File(dst)
    return srcMd5 === dstMd5
}

async function md5File(target: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const md5 = crypto.createHash('md5')
        const stream = fs.createReadStream(target)
        stream.on('data', (data: Buffer) => {
            md5.update(data)
        })
        stream.on('error', reject)
        stream.on('end', () => {
            resolve(md5.digest('hex'))
        })
    })
}
