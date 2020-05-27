import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cp from 'child_process';


export const REPO_ROOT = path.resolve(path.join(__dirname, '..'))
export const SERVER_FILENAME = process.platform === "win32" ? 'sliver-server.exe' : 'sliver-server'
export const SERVER_CONFIG_FILENAME = 'server.json'
export const DEFAULT_SERVER_PATH = path.join(REPO_ROOT, SERVER_FILENAME)
export const DEFAULT_SERVER_CONFIG_PATH = path.join(REPO_ROOT, SERVER_CONFIG_FILENAME)
export const SERVER_ENV_NAME = "SLIVER_SERVER"
export const SERVER_CONFIG_ENV_NAME = "SLIVER_CONFIG"
export const APP_ROOT = process.env['SLIVER_ROOT_DIR'] || path.join(os.homedir(), '.sliver')
export const CLIENT_CONFIG_PATH = path.join(REPO_ROOT, 'ci-client.cfg')


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


