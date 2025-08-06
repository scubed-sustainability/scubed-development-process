/**
 * TDD Unit Test: Version Display Logic
 * 🔴 RED PHASE: This test should FAIL initially
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getDisplayedVersion } from '../../../src/version-utils';

describe('🔴 Version Display Logic (TDD - RED Phase)', function() {
    
    it('should use dynamic version from package.json, not hard-coded', function() {
        // 🔴 RED: This test documents the requirement and should FAIL
        
        // Import the actual extension logic we need to test
        // This will fail until we export the version logic for testing
        
        const packageJson = require('../../../package.json');
        const expectedVersion = `v${packageJson.version}`;
        
        // 🔴 This will FAIL - we need to extract version display logic from extension.ts
        // Currently version is hard-coded as "v1.0.48" in extension.ts:15
        
        // Arrange: Mock extension context (this simulates what extension.ts should do)
        const mockContext = {
            extension: {
                packageJSON: packageJson
            }
        } as any;
        
        // Act: Get displayed version (this function doesn't exist yet - RED phase)
        // We need to extract this logic from extension.ts for testing
        let displayedVersion: string;
        
        try {
            // This should now work - GREEN phase
            displayedVersion = getDisplayedVersion(mockContext);
        } catch (error) {
            expect.fail(`getDisplayedVersion should work now: ${error}`);
        }
        
        // Assert: Version should be dynamic, not hard-coded
        expect(displayedVersion).to.equal(expectedVersion, 
            'Version display must be dynamic from package.json, not hard-coded');
    });

    it('should format version with "v" prefix consistently', function() {
        // 🔴 RED: Test for consistent version formatting
        
        const testCases = [
            { input: '1.0.51', expected: 'v1.0.51' },
            { input: '1.2.3-beta', expected: 'v1.2.3-beta' },
            { input: '2.0.0', expected: 'v2.0.0' }
        ];
        
        for (const testCase of testCases) {
            const mockContext = {
                extension: {
                    packageJSON: { version: testCase.input }
                }
            } as any;
            
            try {
                const result = getDisplayedVersion(mockContext);
                expect(result).to.equal(testCase.expected);
            } catch (error) {
                expect.fail(`Version formatting should work: ${error}`);
            }
        }
    });
});

// getDisplayedVersion is now imported from version-utils.ts - GREEN phase complete!