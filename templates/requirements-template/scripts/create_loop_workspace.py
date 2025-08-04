#!/usr/bin/env python3
"""
Microsoft Loop Workspace Creator
Automates creation of Loop workspaces with standardized templates
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime

def load_project_info():
    """Load project information from project.json"""
    try:
        with open("project.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ project.json not found. Run 'Initialize New Project' first.")
        return None

def create_loop_templates():
    """Create Loop workspace templates as JSON structures"""
    
    templates = {
        "project_charter": {
            "type": "loop_page",
            "title": "Project Charter",
            "content": {
                "sections": [
                    {
                        "title": "Project Overview",
                        "type": "text_block",
                        "content": "Executive summary of the project"
                    },
                    {
                        "title": "Problem Statement", 
                        "type": "text_block",
                        "content": "The specific problem this project solves"
                    },
                    {
                        "title": "Success Criteria",
                        "type": "checklist",
                        "items": [
                            "Define measurable success metrics",
                            "Set target completion dates",
                            "Identify key stakeholders"
                        ]
                    },
                    {
                        "title": "Scope & Boundaries",
                        "type": "text_block",
                        "content": "What's included and excluded from this project"
                    }
                ]
            }
        },
        
        "requirements_table": {
            "type": "loop_table",
            "title": "Requirements Register",
            "columns": [
                {"name": "Req ID", "type": "text"},
                {"name": "Type", "type": "choice", "options": ["Functional", "Non-Functional", "Business"]},
                {"name": "Description", "type": "text"},
                {"name": "Priority", "type": "choice", "options": ["Must Have", "Should Have", "Could Have", "Won't Have"]},
                {"name": "Status", "type": "choice", "options": ["Draft", "Approved", "In Development", "Complete"]},
                {"name": "Owner", "type": "person"},
                {"name": "Notes", "type": "text"}
            ]
        },
        
        "user_stories_table": {
            "type": "loop_table", 
            "title": "User Stories Backlog",
            "columns": [
                {"name": "Story ID", "type": "text"},
                {"name": "Epic", "type": "text"},
                {"name": "User Type", "type": "choice", "options": ["End User", "Admin", "System"]},
                {"name": "Story", "type": "text"},
                {"name": "Acceptance Criteria", "type": "text"},
                {"name": "Priority", "type": "choice", "options": ["High", "Medium", "Low"]},
                {"name": "Effort", "type": "choice", "options": ["XS", "S", "M", "L", "XL"]},
                {"name": "Status", "type": "choice", "options": ["Backlog", "In Progress", "Review", "Done"]},
                {"name": "Assigned To", "type": "person"}
            ]
        },
        
        "risk_register": {
            "type": "loop_table",
            "title": "Risk Register", 
            "columns": [
                {"name": "Risk ID", "type": "text"},
                {"name": "Category", "type": "choice", "options": ["Technical", "Business", "Project", "Operational"]},
                {"name": "Description", "type": "text"},
                {"name": "Impact", "type": "choice", "options": ["High", "Medium", "Low"]},
                {"name": "Probability", "type": "choice", "options": ["High", "Medium", "Low"]},
                {"name": "Risk Score", "type": "formula", "formula": "Impact * Probability"},
                {"name": "Mitigation", "type": "text"},
                {"name": "Owner", "type": "person"},
                {"name": "Status", "type": "choice", "options": ["Open", "Mitigated", "Closed"]}
            ]
        },
        
        "architecture_decisions": {
            "type": "loop_page",
            "title": "Architecture Decision Records",
            "content": {
                "sections": [
                    {
                        "title": "ADR Template",
                        "type": "text_block", 
                        "content": "Use this template for each major architectural decision"
                    },
                    {
                        "title": "Decision Log",
                        "type": "table",
                        "columns": ["ADR #", "Title", "Status", "Date", "Decision Owner"]
                    }
                ]
            }
        }
    }
    
    return templates

def generate_power_automate_flow():
    """Generate Power Automate flow configuration"""
    
    flow_config = {
        "flow_name": "AI Project Discovery - Loop Integration",
        "trigger": {
            "type": "manual_trigger",
            "inputs": [
                {"name": "project_name", "type": "string"},
                {"name": "discovery_output", "type": "string"},
                {"name": "output_type", "type": "choice", "options": ["requirements", "user_stories", "risks", "architecture"]}
            ]
        },
        "actions": [
            {
                "name": "Parse Discovery Output",
                "type": "ai_builder_extract_entities",
                "settings": {
                    "model": "custom_entity_extraction",
                    "entities": ["requirements", "user_stories", "risks", "decisions"]
                }
            },
            {
                "name": "Create Loop Workspace",
                "type": "http_request",
                "settings": {
                    "method": "POST",
                    "uri": "https://graph.microsoft.com/v1.0/me/onenote/sections",
                    "headers": {
                        "Authorization": "Bearer @{triggerBody()['token']}",
                        "Content-Type": "application/json"
                    }
                }
            },
            {
                "name": "Populate Loop Tables",
                "type": "apply_to_each",
                "settings": {
                    "foreach": "@outputs('Parse_Discovery_Output')?['body']",
                    "actions": [
                        {
                            "name": "Add Table Row",
                            "type": "http_request",
                            "settings": {
                                "method": "POST",
                                "uri": "https://graph.microsoft.com/v1.0/sites/{site-id}/lists/{list-id}/items"
                            }
                        }
                    ]
                }
            },
            {
                "name": "Notify Stakeholders",
                "type": "teams_post_message",
                "settings": {
                    "team": "Project Team",
                    "channel": "General",
                    "message": "🤖 AI Discovery completed for @{triggerBody()['project_name']}. Loop workspace updated with new insights."
                }
            }
        ]
    }
    
    return flow_config

def create_setup_instructions(project_info):
    """Create setup instructions for Loop integration"""
    
    instructions = f"""# Loop Workspace Setup Instructions

## Project: {project_info['name']}

### Prerequisites
- Microsoft 365 account with Loop access
- Power Automate Premium license (for AI Builder)
- Teams access for notifications

### Step 1: Create Loop Workspace
1. Open Microsoft Loop (loop.microsoft.com)
2. Create new workspace: "{project_info['name']} - AI Development"
3. Copy workspace URL to project.json

### Step 2: Import Templates
Import these components into your Loop workspace:

#### Pages to Create:
- **Project Charter** - Overall project overview and goals
- **Architecture Decisions** - Technical decision documentation
- **Meeting Notes** - Discovery session notes with Claude

#### Tables to Create:
- **Requirements Register** - All functional and non-functional requirements
- **User Stories Backlog** - Prioritized user stories with acceptance criteria  
- **Risk Register** - Project risks with mitigation strategies

### Step 3: Configure Power Automate
1. Import flow from: `scripts/automation/loop_integration_flow.json`
2. Update connections:
   - Microsoft Graph (for Loop API access)
   - AI Builder (for text parsing)
   - Teams (for notifications)
3. Test flow with sample data

### Step 4: Set Up AI Builder Model
1. Go to PowerPlatform.microsoft.com
2. Create custom entity extraction model
3. Train model to recognize:
   - Requirements (functional, non-functional)
   - User stories (As a... I want... So that...)
   - Risks (description, impact, probability)
   - Decisions (context, decision, consequences)

### Step 5: Configure Notifications
1. Set up Teams channel for project updates
2. Configure @mentions for stakeholders
3. Enable email notifications for critical updates

### Usage Workflow
1. **Discovery with Claude**: Use generated prompts in VS Code
2. **Copy Output**: Copy Claude's structured responses
3. **Run Power Automate**: Trigger flow with project name and output
4. **Review in Loop**: Check auto-populated workspace
5. **Collaborate**: Stakeholders review and refine in Loop
6. **Sync Back**: Export finalized requirements to project docs

### Integration Commands
```bash
# Generate prompts for Claude
python scripts/generate_prompts.py

# Create Loop workspace (manual setup required)  
python scripts/create_loop_workspace.py

# Export Loop data to project docs
python scripts/sync_loop_to_docs.py
```

### Troubleshooting
- **Permission Issues**: Ensure proper Graph API permissions
- **AI Builder Limits**: Monitor AI Builder credits usage
- **Sync Conflicts**: Manual resolution required for conflicts

### Next Steps
1. Complete manual Loop workspace setup
2. Test Power Automate flow
3. Run first discovery session with Claude
4. Validate automation workflow
"""
    
    return instructions

def main():
    """Create Loop workspace integration"""
    try:
        print("🔗 Setting up Loop Workspace Integration...")
        
        # Load project information
        project_info = load_project_info()
        if not project_info:
            return
        
        # Create templates directory
        automation_path = Path("scripts/automation")
        automation_path.mkdir(exist_ok=True)
        
        # Generate Loop templates
        templates = create_loop_templates()
        with open(automation_path / "loop_templates.json", "w") as f:
            json.dump(templates, f, indent=2)
        print("✅ Created: loop_templates.json")
        
        # Generate Power Automate flow
        flow_config = generate_power_automate_flow()
        with open(automation_path / "loop_integration_flow.json", "w") as f:
            json.dump(flow_config, f, indent=2)
        print("✅ Created: loop_integration_flow.json")
        
        # Create setup instructions
        instructions = create_setup_instructions(project_info)
        with open("docs/LOOP_SETUP.md", "w") as f:
            f.write(instructions)
        print("✅ Created: LOOP_SETUP.md")
        
        # Update project metadata
        project_info["loop_workspace"]["setup_ready"] = True
        project_info["loop_workspace"]["templates_created"] = datetime.now().isoformat()
        
        with open("project.json", "w") as f:
            json.dump(project_info, f, indent=2)
        
        print(f"\n🎉 Loop integration setup completed!")
        print("📁 Templates: scripts/automation/")
        print("📖 Instructions: docs/LOOP_SETUP.md")
        print("\n🚀 Next Steps:")
        print("1. Follow manual setup in LOOP_SETUP.md") 
        print("2. Import Power Automate flow")
        print("3. Test integration with sample data")
        print("4. Start discovery phase with Claude")
        
    except Exception as e:
        print(f"❌ Error creating Loop integration: {e}")

if __name__ == "__main__":
    main()