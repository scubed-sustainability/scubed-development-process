/**
 * Template Path Resolution Utilities
 * Provides testable template path resolution for TDD
 */

import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Custom error for template not found scenarios
 */
export class TemplateNotFoundError extends Error {
    constructor(public templateName: string, public searchedPaths: string[]) {
        super(`Template not found: ${templateName}. Searched paths: ${searchedPaths.join(', ')}`);
        this.name = 'TemplateNotFoundError';
    }
}

/**
 * Resolves template path with proper fallback logic
 * @param templateName - Name of template to resolve
 * @param extensionPath - Base extension path (__dirname)
 * @param fileExistsCheck - Optional function to check file existence (for testing)
 * @returns Resolved template path or null if not found
 */
export async function resolveTemplatePath(
    templateName: string,
    extensionPath: string,
    fileExistsCheck?: (path: string) => boolean | Promise<boolean>
): Promise<string> {
    const checkExists = fileExistsCheck || fs.pathExists;
    const searchedPaths: string[] = [];
    
    // Try 1: Extension bundled templates (production)
    const bundledPath = path.join(extensionPath, '..', 'templates', templateName);
    searchedPaths.push(bundledPath);
    
    if (await checkExists(bundledPath)) {
        return bundledPath;
    }
    
    // Try 2: Repository root templates (development)
    const repoPath = path.join(extensionPath, '..', '..', 'templates', templateName);
    searchedPaths.push(repoPath);
    
    if (await checkExists(repoPath)) {
        return repoPath;
    }
    
    // Try 3: Workspace relative (if extension is in same repo)
    const workspacePath = path.join(extensionPath, '..', '..', '..', 'templates', templateName);
    searchedPaths.push(workspacePath);
    
    if (await checkExists(workspacePath)) {
        return workspacePath;
    }
    
    // Template not found - throw specific error
    throw new TemplateNotFoundError(templateName, searchedPaths);
}

/**
 * Validates that a template directory contains expected files
 * @param templatePath - Path to template directory
 * @param requiredFiles - Optional array of required files (defaults to basic check)
 * @returns True if template is valid
 */
export async function validateTemplate(
    templatePath: string, 
    requiredFiles: string[] = ['README.md']
): Promise<boolean> {
    try {
        // Check if template directory exists
        if (!await fs.pathExists(templatePath)) {
            return false;
        }
        
        // Check if it's a directory
        const stats = await fs.stat(templatePath);
        if (!stats.isDirectory()) {
            return false;
        }
        
        // Check for required files
        for (const requiredFile of requiredFiles) {
            const filePath = path.join(templatePath, requiredFile);
            if (!await fs.pathExists(filePath)) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}