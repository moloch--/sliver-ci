import * as jest from 'jest'
import { setup, teardown } from './src/global-setup'

try {
    const opts = ['--config', 'jestconfig.json']
    setup().then(async () => { await jest.run(opts) }).then(teardown)
} catch(err) {
    console.error(err)
    process.exit(1)
}

