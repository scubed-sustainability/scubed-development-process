/**
 * 🟢 GREEN PHASE: Lazy Loading Utilities for Performance Optimization
 * 
 * This module provides lazy loading functionality for heavy dependencies
 * to reduce bundle size and improve startup time.
 */

import { logger } from './logger';

// Lazy loaded module cache
const moduleCache = new Map<string, any>();

/**
 * Lazy load @octokit/rest only when needed
 */
export async function getOctokit(): Promise<any> {
    const cacheKey = '@octokit/rest';
    
    if (moduleCache.has(cacheKey)) {
        logger.debug('Using cached Octokit instance');
        return moduleCache.get(cacheKey);
    }
    
    try {
        logger.debug('Lazy loading @octokit/rest...');
        const { Octokit } = await import('@octokit/rest');
        moduleCache.set(cacheKey, Octokit);
        logger.debug('@octokit/rest loaded successfully');
        return Octokit;
    } catch (error: any) {
        logger.error('Failed to lazy load @octokit/rest', error);
        throw new Error(`Failed to load GitHub integration: ${error.message}`);
    }
}

/**
 * Lazy load axios only when needed
 */
export async function getAxios(): Promise<any> {
    const cacheKey = 'axios';
    
    if (moduleCache.has(cacheKey)) {
        logger.debug('Using cached axios instance');
        return moduleCache.get(cacheKey);
    }
    
    try {
        // Note: axios was replaced with fetch API for performance
        logger.warn('Axios lazy loading requested but axios was removed in favor of fetch API');
        throw new Error('Axios is no longer available. Use native fetch API instead.');
    } catch (error: any) {
        logger.error('Failed to lazy load axios (removed dependency)', error);
        throw new Error('axios was removed for performance. Use native fetch API instead.');
    }
}

/**
 * Lazy load markdown-it only when needed
 */
export async function getMarkdownIt(): Promise<any> {
    const cacheKey = 'markdown-it';
    
    if (moduleCache.has(cacheKey)) {
        logger.debug('Using cached markdown-it instance');
        return moduleCache.get(cacheKey);
    }
    
    try {
        logger.debug('Lazy loading markdown-it...');
        const MarkdownIt = await import('markdown-it');
        const MarkdownItClass = (MarkdownIt as any).default || MarkdownIt;
        moduleCache.set(cacheKey, MarkdownItClass);
        logger.debug('markdown-it loaded successfully');
        return MarkdownItClass;
    } catch (error: any) {
        logger.error('Failed to lazy load markdown-it', error);
        throw new Error(`Failed to load markdown parser: ${error.message}`);
    }
}

/**
 * Lazy load yauzl only when needed
 */
export async function getYauzl(): Promise<any> {
    const cacheKey = 'yauzl';
    
    if (moduleCache.has(cacheKey)) {
        logger.debug('Using cached yauzl instance');
        return moduleCache.get(cacheKey);
    }
    
    try {
        logger.debug('Lazy loading yauzl...');
        const yauzl = await import('yauzl');
        moduleCache.set(cacheKey, yauzl);
        logger.debug('yauzl loaded successfully');
        return yauzl;
    } catch (error: any) {
        logger.error('Failed to lazy load yauzl', error);
        throw new Error(`Failed to load ZIP handler: ${error.message}`);
    }
}

/**
 * Lazy load service modules only when needed
 */
export async function lazyLoadService<T>(serviceName: string, importPath: string): Promise<T> {
    const cacheKey = `service:${serviceName}`;
    
    if (moduleCache.has(cacheKey)) {
        logger.debug(`Using cached ${serviceName} service`);
        return moduleCache.get(cacheKey);
    }
    
    try {
        logger.debug(`Lazy loading ${serviceName} service...`);
        const serviceModule = await import(importPath);
        const ServiceClass = serviceModule[serviceName];
        moduleCache.set(cacheKey, ServiceClass);
        logger.debug(`${serviceName} service loaded successfully`);
        return ServiceClass;
    } catch (error: any) {
        logger.error(`Failed to lazy load ${serviceName} service`, error);
        throw new Error(`Failed to load ${serviceName}: ${error.message}`);
    }
}

/**
 * Preload critical modules in the background (optional optimization)
 */
export function preloadCriticalModules(): void {
    // Preload most commonly used modules in background
    setTimeout(async () => {
        try {
            logger.debug('Preloading critical modules in background...');
            await Promise.all([
                getOctokit(),
                getAxios()
            ]);
            logger.debug('Critical modules preloaded successfully');
        } catch (error: any) {
            // Silently fail preloading - modules will be loaded on demand
            logger.debug('Background preloading failed, will load on demand', error);
        }
    }, 2000); // Preload after 2 seconds
}

/**
 * Clear module cache (useful for testing)
 */
export function clearLazyLoadCache(): void {
    moduleCache.clear();
    logger.debug('Lazy load cache cleared');
}