import * as jest from 'jest'
import { setup, teardown } from './src/global-setup'

try {
    setup().then(async () => {

        console.log('Running jest tests ...')
        await jest.run(['--config', 'jestconfig.json']) 
    
    }).then(teardown)
} catch(err) {
    console.error(err)
    process.exit(1)
}

