import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

// Import test setup for proper TDD environment
import './fixtures/test-setup';

export function run(): Promise<void> {
    // Create the mocha test with BDD interface for TDD approach
    const mocha = new Mocha({
        ui: 'bdd', // Changed from 'tdd' to 'bdd' for describe/it syntax
        color: true,
        timeout: 10000, // Extended timeout for VS Code operations
        reporter: 'spec' // Better test output formatting
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        // Include all test files including our new TDD structure
        const patterns = [
            'suite/basic-smoke.test.js',    // Run smoke test first
            'suite/unit/**.test.js',        // TDD unit tests
            'suite/integration/**.test.js', // TDD integration tests
            'suite/e2e/**.test.js',         // TDD end-to-end tests
            '**/**.test.js'                 // Other existing tests
        ];
        
        Promise.all(patterns.map(pattern => 
            glob(pattern, { cwd: testsRoot })
        )).then(results => {
            const files = results.flat();
            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        }).catch(e);
    });
}