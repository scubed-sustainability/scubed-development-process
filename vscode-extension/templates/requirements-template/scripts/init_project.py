#!/usr/bin/env python3
"""
Project Initialization Script
Creates standardized project structure with AI-enabled development workflow
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path

def get_project_info():
    """Collect project information from user"""
    print("🚀 AI-Enabled Project Initialization")
    print("=" * 50)
    
    project_name = input("Project Name: ").strip()
    project_description = input("Brief Description: ").strip()
    project_type = input("Project Type (web-app/api/mobile/desktop): ").strip()
    tech_stack = input("Primary Tech Stack (react/python/node/etc): ").strip()
    
    return {
        "name": project_name,
        "description": project_description,
        "type": project_type,
        "tech_stack": tech_stack,
        "created_date": datetime.now().isoformat(),
        "status": "discovery"
    }

def create_project_structure(project_info):
    """Create standardized project directory structure"""
    base_path = Path.cwd()
    
    # Create directory structure
    directories = [
        "docs/discovery",
        "docs/requirements", 
        "docs/architecture",
        "docs/user-stories",
        "docs/testing",
        "docs/deployment",
        "templates/claude-prompts",
        "templates/loop-components",
        "scripts/automation",
        "src",
        "tests",
        ".github/workflows"
    ]
    
    for directory in directories:
        (base_path / directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")
    
    return base_path

def create_project_metadata(base_path, project_info):
    """Create project metadata and configuration files"""
    
    # Project metadata
    metadata = {
        **project_info,
        "ai_workflow": {
            "discovery_phase": "pending",
            "requirements_phase": "pending", 
            "implementation_phase": "pending",
            "testing_phase": "pending",
            "deployment_phase": "pending"
        },
        "loop_workspace": {
            "created": False,
            "url": "",
            "components": []
        }
    }
    
    with open(base_path / "project.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print("✅ Created: project.json")

def create_claude_md(base_path, project_info):
    """Create CLAUDE.md with project context"""
    claude_content = f"""# {project_info['name']} - AI Development Context

## Project Overview
- **Description**: {project_info['description']}
- **Type**: {project_info['type']}
- **Tech Stack**: {project_info['tech_stack']}
- **Created**: {project_info['created_date']}

## Current Phase: Discovery

## AI Workflow Commands
- `npm run lint` - Run linting
- `npm run test` - Run tests  
- `npm run build` - Build project
- `npm run deploy` - Deploy to Azure

## Project Structure
```
docs/
├── discovery/          # Requirements gathering with Claude
├── requirements/       # Functional & non-functional requirements
├── architecture/       # Technical architecture decisions
├── user-stories/       # User stories and acceptance criteria
├── testing/           # Test plans and strategies
└── deployment/        # Deployment guides and configs

templates/
├── claude-prompts/    # Reusable prompts for Claude
└── loop-components/   # Loop workspace templates

scripts/
└── automation/        # Power Automate and integration scripts
```

## Loop Workspace Integration
- Workspace URL: [To be created]
- Auto-sync enabled: Yes
- Stakeholder notifications: Teams

## Development Notes
[Add development context, decisions, and notes here as you work with Claude]
"""
    
    with open(base_path / "CLAUDE.md", "w") as f:
        f.write(claude_content)
    
    print("✅ Created: CLAUDE.md")

def create_discovery_templates(base_path):
    """Create discovery phase templates"""
    
    # Discovery checklist
    discovery_checklist = """# Discovery Phase Checklist

## Pre-Discovery Preparation
- [ ] Define problem statement (1-2 sentences)
- [ ] Identify target users and their pain points
- [ ] Research 3-5 competitors
- [ ] Define success metrics
- [ ] Set timeline and budget constraints
- [ ] Gather stakeholder input

## Discovery Sessions with Claude
- [ ] Project scope and objectives
- [ ] User story generation  
- [ ] Technical requirements gathering
- [ ] Edge case identification
- [ ] Architecture decision records

## Expected Outputs
- [ ] Project Charter
- [ ] Requirements Document
- [ ] User Story Backlog
- [ ] Technical Specification
- [ ] Risk Register
- [ ] Stakeholder Map

## Loop Workspace Setup
- [ ] Create workspace from template
- [ ] Configure automation flows
- [ ] Set up stakeholder notifications
- [ ] Test integration workflows
"""
    
    with open(base_path / "docs/discovery/checklist.md", "w") as f:
        f.write(discovery_checklist)
    
    print("✅ Created: discovery/checklist.md")

def main():
    """Main initialization function"""
    try:
        print("\n🎯 Starting AI-Enabled Project Setup...\n")
        
        # Get project information
        project_info = get_project_info()
        
        # Create project structure
        base_path = create_project_structure(project_info)
        
        # Create configuration files
        create_project_metadata(base_path, project_info)
        create_claude_md(base_path, project_info)
        create_discovery_templates(base_path)
        
        print(f"\n🎉 Project '{project_info['name']}' initialized successfully!")
        print(f"📁 Location: {base_path}")
        print("\n🚀 Next Steps:")
        print("1. Run 'Generate Discovery Prompts' task")
        print("2. Run 'Create Loop Workspace' task") 
        print("3. Start discovery phase with Claude")
        print("4. Open CLAUDE.md to track progress")
        
    except KeyboardInterrupt:
        print("\n❌ Setup cancelled by user")
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")

if __name__ == "__main__":
    main()