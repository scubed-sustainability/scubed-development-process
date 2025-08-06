/**
 * Test Data Validation Tests - No VS Code Required
 * Tests our test fixtures and data structures
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { 
    VALID_REQUIREMENTS_MD, 
    INVALID_REQUIREMENTS_MD,
    GITHUB_USER_RESPONSE,
    createRequirementsWithStakeholders 
} from './test-data';

describe('🔬 Test Data Fixtures', function() {
    
    describe('Requirements Templates', function() {
        it('should have valid requirements template', function() {
            expect(VALID_REQUIREMENTS_MD).to.be.a('string');
            expect(VALID_REQUIREMENTS_MD).to.include('# Project Requirements');
            expect(VALID_REQUIREMENTS_MD).to.include('👥 Stakeholders');
            expect(VALID_REQUIREMENTS_MD).to.include('📋 Functional Requirements');
        });

        it('should have invalid requirements template for testing', function() {
            expect(INVALID_REQUIREMENTS_MD).to.be.a('string');
            expect(INVALID_REQUIREMENTS_MD).to.not.include('👥 Stakeholders');
        });

        it('should generate requirements with custom stakeholders', function() {
            const stakeholders = ['john-doe', 'jane-smith'];
            const requirements = createRequirementsWithStakeholders(stakeholders);
            
            expect(requirements).to.include('john-doe');
            expect(requirements).to.include('jane-smith');
            expect(requirements).to.include('👥 Stakeholders');
        });
    });

    describe('GitHub API Fixtures', function() {
        it('should have valid GitHub user response', function() {
            expect(GITHUB_USER_RESPONSE).to.have.property('login');
            expect(GITHUB_USER_RESPONSE).to.have.property('id');
            expect(GITHUB_USER_RESPONSE.login).to.equal('john-doe');
        });
    });

    describe('Test Infrastructure', function() {
        it('should have chai assertions working', function() {
            expect(true).to.be.true;
            expect(false).to.be.false;
            expect('test').to.be.a('string');
            expect(42).to.be.a('number');
        });

        it('should support async testing', async function() {
            const promise = Promise.resolve('async works');
            const result = await promise;
            expect(result).to.equal('async works');
        });
    });
});