import * as os from 'os'

import * as jest from 'jest'
import { setup, teardown } from './src/global-setup'

try {
    setup().then(async () => { await jest.run([]) }).then(teardown)
} catch(err) {
    console.error(err)
    process.exit(1)
}

