#!/usr/bin/env python3
"""
S-cubed Development Process - Template Updater
This script helps manage and update project templates across the development process.
"""

import json
import os
import sys
import shutil
import requests
import zipfile
import tempfile
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class TemplateUpdater:
    """Manages S-cubed project templates"""
    
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path) if base_path else Path(__file__).parent.parent
        self.templates_path = self.base_path / "templates"
        self.registry_path = self.base_path / "vscode-extension" / "template-registry.json"
        
    def load_registry(self) -> Dict:
        """Load the template registry"""
        if not self.registry_path.exists():
            raise FileNotFoundError(f"Template registry not found: {self.registry_path}")
        
        with open(self.registry_path, 'r') as f:
            return json.load(f)
    
    def save_registry(self, registry: Dict):
        """Save the template registry"""
        with open(self.registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
    
    def list_templates(self) -> List[Dict]:
        """List all available templates"""
        registry = self.load_registry()
        return registry.get('templates', [])
    
    def get_template(self, template_id: str) -> Optional[Dict]:
        """Get a specific template by ID"""
        templates = self.list_templates()
        return next((t for t in templates if t['id'] == template_id), None)
    
    def validate_template(self, template_path: Path) -> Dict:
        """Validate a template structure"""
        issues = []
        warnings = []
        
        # Check required files
        required_files = ['README.md', 'project.json']
        for file in required_files:
            if not (template_path / file).exists():
                issues.append(f"Missing required file: {file}")
        
        # Check directory structure
        recommended_dirs = ['docs', 'scripts', 'templates']
        for dir_name in recommended_dirs:
            if not (template_path / dir_name).exists():
                warnings.append(f"Missing recommended directory: {dir_name}")
        
        # Validate project.json
        project_json = template_path / 'project.json'
        if project_json.exists():
            try:
                with open(project_json) as f:
                    project_data = json.load(f)
                    
                required_keys = ['name', 'version', 'description']
                for key in required_keys:
                    if key not in project_data:
                        issues.append(f"Missing key in project.json: {key}")
                        
            except json.JSONDecodeError as e:
                issues.append(f"Invalid JSON in project.json: {e}")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings
        }
    
    def create_template(self, template_id: str, template_data: Dict, source_path: str):
        """Create a new template"""
        template_path = self.templates_path / template_id
        
        # Create template directory
        template_path.mkdir(parents=True, exist_ok=True)
        
        # Copy source files if provided
        if source_path and Path(source_path).exists():
            shutil.copytree(source_path, template_path, dirs_exist_ok=True)
        
        # Validate template
        validation = self.validate_template(template_path)
        if not validation['valid']:
            print(f"Template validation failed: {validation['issues']}")
            return False
        
        # Update registry
        registry = self.load_registry()
        templates = registry.get('templates', [])
        
        # Remove existing template with same ID
        templates = [t for t in templates if t['id'] != template_id]
        
        # Add new template
        templates.append(template_data)
        registry['templates'] = templates
        registry['metadata']['totalTemplates'] = len(templates)
        registry['metadata']['lastUpdated'] = datetime.now().isoformat()
        
        self.save_registry(registry)
        print(f"Template '{template_id}' created successfully!")
        return True
    
    def update_template(self, template_id: str, updates: Dict):
        """Update an existing template"""
        registry = self.load_registry()
        templates = registry.get('templates', [])
        
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            print(f"Template '{template_id}' not found")
            return False
        
        # Apply updates
        template.update(updates)
        
        # Update metadata
        registry['metadata']['lastUpdated'] = datetime.now().isoformat()
        
        self.save_registry(registry)
        print(f"Template '{template_id}' updated successfully!")
        return True
    
    def remove_template(self, template_id: str):
        """Remove a template"""
        # Remove from registry
        registry = self.load_registry()
        templates = registry.get('templates', [])
        
        original_count = len(templates)
        templates = [t for t in templates if t['id'] != template_id]
        
        if len(templates) == original_count:
            print(f"Template '{template_id}' not found in registry")
            return False
        
        registry['templates'] = templates
        registry['metadata']['totalTemplates'] = len(templates)
        registry['metadata']['lastUpdated'] = datetime.now().isoformat()
        
        self.save_registry(registry)
        
        # Remove template directory
        template_path = self.templates_path / template_id
        if template_path.exists():
            shutil.rmtree(template_path)
            print(f"Template directory removed: {template_path}")
        
        print(f"Template '{template_id}' removed successfully!")
        return True
    
    def sync_from_remote(self, template_id: str, remote_url: str):
        """Sync a template from a remote source"""
        print(f"Syncing template '{template_id}' from {remote_url}")
        
        try:
            # Download and extract
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_path = Path(temp_dir) / "template.zip"
                
                response = requests.get(remote_url)
                response.raise_for_status()
                
                with open(zip_path, 'wb') as f:
                    f.write(response.content)
                
                # Extract
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Find the extracted directory
                extracted_dirs = [d for d in Path(temp_dir).iterdir() if d.is_dir()]
                if not extracted_dirs:
                    raise ValueError("No directories found in downloaded archive")
                
                source_dir = extracted_dirs[0]
                template_path = self.templates_path / template_id
                
                # Replace existing template
                if template_path.exists():
                    shutil.rmtree(template_path)
                
                shutil.copytree(source_dir, template_path)
                
                # Validate
                validation = self.validate_template(template_path)
                if validation['warnings']:
                    print("Warnings:", validation['warnings'])
                
                if not validation['valid']:
                    print("Errors:", validation['issues'])
                    return False
                
                print(f"Template '{template_id}' synced successfully!")
                return True
                
        except Exception as e:
            print(f"Failed to sync template: {e}")
            return False

def main():
    """CLI interface for template management"""
    import argparse
    
    parser = argparse.ArgumentParser(description="S-cubed Template Updater")
    parser.add_argument('--base-path', help="Base path for S-cubed development process")
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List templates
    subparsers.add_parser('list', help='List all templates')
    
    # Validate template
    validate_parser = subparsers.add_parser('validate', help='Validate a template')
    validate_parser.add_argument('template_id', help='Template ID to validate')
    
    # Update registry
    update_parser = subparsers.add_parser('update', help='Update template metadata')
    update_parser.add_argument('template_id', help='Template ID to update')
    update_parser.add_argument('--version', help='New version')
    update_parser.add_argument('--status', help='New status')
    
    # Sync from remote
    sync_parser = subparsers.add_parser('sync', help='Sync template from remote')
    sync_parser.add_argument('template_id', help='Template ID to sync')
    sync_parser.add_argument('remote_url', help='Remote URL to sync from')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    updater = TemplateUpdater(args.base_path)
    
    if args.command == 'list':
        templates = updater.list_templates()
        print(f"Found {len(templates)} templates:")
        for template in templates:
            status = template.get('status', 'available')
            print(f"  - {template['id']}: {template['name']} (v{template['version']}) [{status}]")
    
    elif args.command == 'validate':
        template_path = updater.templates_path / args.template_id
        if not template_path.exists():
            print(f"Template not found: {args.template_id}")
            return
        
        validation = updater.validate_template(template_path)
        if validation['valid']:
            print(f"Template '{args.template_id}' is valid!")
        else:
            print(f"Template '{args.template_id}' has issues:")
            for issue in validation['issues']:
                print(f"  - {issue}")
        
        if validation['warnings']:
            print("Warnings:")
            for warning in validation['warnings']:
                print(f"  - {warning}")
    
    elif args.command == 'update':
        updates = {}
        if args.version:
            updates['version'] = args.version
        if args.status:
            updates['status'] = args.status
        
        if updates:
            updater.update_template(args.template_id, updates)
        else:
            print("No updates specified")
    
    elif args.command == 'sync':
        updater.sync_from_remote(args.template_id, args.remote_url)

if __name__ == '__main__':
    main()