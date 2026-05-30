import { Log } from './log';
import { Level, Package, Stack } from './types';

async function main() {
    const data = await Log(
        Stack.backend,
        Level.debug,
        Package.controller,
        'testing log. sorry for inconvenience'
    );

    console.log(data);
}

main().catch((error) => {
    console.error('Logging failed:', error);
});



