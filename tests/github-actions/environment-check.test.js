/**
 * Environment Check Test
 * Verifies that the testing environment is properly set up
 */

const { expect } = require('chai');
const { describe, it } = require('mocha');

describe('🔧 Testing Environment Check', function() {
    it('should have working chai assertions', function() {
        expect(true).to.be.true;
        expect('test').to.be.a('string');
        expect([1, 2, 3]).to.have.lengthOf(3);
    });

    it('should have working mocha test runner', function() {
        // If this test runs, mocha is working
        expect(this.timeout()).to.be.a('number');
    });

    it('should be able to require Node.js modules', function() {
        const fs = require('fs');
        const path = require('path');
        
        expect(fs).to.have.property('existsSync');
        expect(path).to.have.property('join');
    });
});