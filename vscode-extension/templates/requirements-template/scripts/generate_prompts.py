#!/usr/bin/env python3
"""
Claude Prompt Generator
Creates standardized prompts for each discovery phase
"""

import os
import json
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

def create_discovery_prompts(project_info):
    """Generate discovery phase prompts"""
    
    prompts = {
        "01_project_scope": f"""# Project Scope & Objectives Discovery

## Context
Project: {project_info['name']}
Description: {project_info['description']}
Type: {project_info['type']}
Tech Stack: {project_info['tech_stack']}

## Prompt for Claude

I want to build {project_info['description']}. Help me define:

1. **Core Problem Analysis**
   - What specific problem does this solve?
   - Who are the primary users affected by this problem?
   - How is this problem currently being solved (if at all)?
   - What are the pain points with current solutions?

2. **Success Definition**
   - What does success look like (measurable outcomes)?
   - What are the key performance indicators (KPIs)?
   - What would make users choose this over alternatives?

3. **Scope Boundaries**
   - What are the must-have features for MVP?
   - What should be explicitly excluded from scope?
   - What are the key assumptions that need validation?

4. **Risk Assessment**
   - What could prevent this project from succeeding?
   - What technical risks should we be aware of?
   - What market/business risks exist?

Please provide structured output suitable for documentation and stakeholder review.
""",

        "02_user_stories": f"""# User Story Generation

## Context
Project: {project_info['name']}
Description: {project_info['description']}

## Prompt for Claude

For a {project_info['type']} application focused on {project_info['description']}, generate comprehensive user stories that cover:

1. **Primary User Workflows**
   - Core functionality that users will use daily
   - Different user types and their specific needs
   - End-to-end user journeys

2. **Administrative Functions**
   - User management and permissions
   - Configuration and settings
   - Monitoring and reporting

3. **Edge Cases and Error Scenarios**
   - What happens when things go wrong
   - Data validation and error recovery
   - Security and compliance scenarios

4. **Non-Functional Requirements**
   - Performance expectations
   - Scalability requirements
   - Security and compliance needs

Format each user story as:
**As a** [user type], **I want** [goal] **so that** [benefit]

Include acceptance criteria for each story:
- Given [context]
- When [action]
- Then [expected outcome]

Organize by priority: Must Have, Should Have, Could Have, Won't Have (MoSCoW)
""",

        "03_technical_requirements": f"""# Technical Requirements Discovery

## Context
Project: {project_info['name']}
Type: {project_info['type']}
Preferred Tech Stack: {project_info['tech_stack']}

## Prompt for Claude

Help me define comprehensive technical requirements for {project_info['description']}:

1. **Performance Requirements**
   - Expected user load (concurrent users, requests/second)
   - Response time expectations
   - Data volume and storage requirements
   - Bandwidth and network considerations

2. **Scalability & Reliability**
   - Growth projections (users, data, features)
   - Uptime requirements (SLA expectations)
   - Disaster recovery and backup needs
   - Load balancing and scaling strategies

3. **Security & Compliance**
   - Authentication and authorization requirements
   - Data privacy regulations (GDPR, CCPA, etc.)
   - Industry-specific compliance needs
   - Security threat model and mitigations

4. **Integration Requirements**
   - Third-party services and APIs
   - Legacy system integrations
   - Data import/export requirements
   - Webhook and notification systems

5. **Technology Stack Decisions**
   - Frontend framework recommendations
   - Backend/API technology choices
   - Database selection criteria
   - Hosting and deployment platform
   - Development and CI/CD tools

Consider my preferred stack ({project_info['tech_stack']}) but suggest alternatives if better suited.

Provide technical architecture recommendations with pros/cons for each major decision.
""",

        "04_architecture_decisions": f"""# Architecture Decision Records (ADR) Generation

## Context
Project: {project_info['name']}
Type: {project_info['type']}

## Prompt for Claude

Help me create Architecture Decision Records (ADRs) for {project_info['description']}. 

For each major architectural decision, provide:

**ADR Format:**
- **Title**: Brief decision description
- **Status**: Proposed/Accepted/Superseded
- **Context**: What forces are at play?
- **Decision**: What we decided to do
- **Consequences**: What becomes easier/harder

**Key Decisions to Address:**

1. **Overall Architecture Pattern**
   - Monolithic vs Microservices vs Modular Monolith
   - Client-Server vs Serverless vs Hybrid

2. **Data Architecture**
   - Database selection (SQL vs NoSQL vs Hybrid)
   - Data modeling approach
   - Caching strategy
   - Data synchronization patterns

3. **API Design**
   - REST vs GraphQL vs gRPC
   - Authentication/authorization approach
   - Rate limiting and security

4. **Frontend Architecture**
   - SPA vs SSR vs Static Generation
   - State management approach
   - Component architecture

5. **Deployment Architecture**
   - Cloud provider and services
   - Containerization strategy
   - CI/CD pipeline design
   - Monitoring and observability

6. **Development Workflow**
   - Version control strategy
   - Testing approach
   - Code quality standards
   - Documentation standards

Consider trade-offs between development speed, maintainability, performance, and cost.
""",

        "05_risk_analysis": f"""# Risk Analysis and Mitigation

## Context
Project: {project_info['name']}
Description: {project_info['description']}

## Prompt for Claude

Conduct comprehensive risk analysis for {project_info['description']}:

1. **Technical Risks**
   - Technology choices and their maturity
   - Integration complexity and dependencies  
   - Performance and scalability challenges
   - Security vulnerabilities and threats

2. **Business Risks**
   - Market competition and timing
   - User adoption and retention
   - Revenue model viability
   - Regulatory and compliance changes

3. **Project Risks**
   - Timeline and scope creep
   - Resource availability and expertise
   - Communication and stakeholder alignment
   - Quality and testing coverage

4. **Operational Risks**
   - Deployment and infrastructure
   - Monitoring and incident response
   - Data backup and disaster recovery
   - Vendor lock-in and dependencies

**For each risk, provide:**
- **Description**: What could go wrong?
- **Impact**: How severe would the consequences be? (High/Medium/Low)
- **Probability**: How likely is this to occur? (High/Medium/Low)
- **Mitigation**: What can be done to prevent or minimize this risk?
- **Contingency**: What's the backup plan if this risk materializes?
- **Owner**: Who should monitor and manage this risk?

Prioritize risks by Impact × Probability matrix.
"""
    }
    
    return prompts

def save_prompts(prompts):
    """Save prompts to template files"""
    templates_path = Path("templates/claude-prompts")
    
    for filename, content in prompts.items():
        filepath = templates_path / f"{filename}.md"
        with open(filepath, "w") as f:
            f.write(content)
        print(f"✅ Created: {filepath}")

def create_prompt_index():
    """Create index file for easy navigation"""
    index_content = """# Claude Discovery Prompts

Use these prompts in sequence with Claude for comprehensive project discovery.

## Discovery Phase Prompts

1. **[Project Scope & Objectives](01_project_scope.md)**
   - Define problem, users, success criteria
   - Identify scope boundaries and assumptions

2. **[User Story Generation](02_user_stories.md)**
   - Generate comprehensive user stories
   - Cover all user types and workflows

3. **[Technical Requirements](03_technical_requirements.md)**
   - Performance, scalability, security needs
   - Technology stack recommendations

4. **[Architecture Decisions](04_architecture_decisions.md)**  
   - Major architectural choices and trade-offs
   - Document decision rationale

5. **[Risk Analysis](05_risk_analysis.md)**
   - Identify and assess project risks
   - Develop mitigation strategies

## Usage Instructions

1. **Copy prompt** from relevant .md file
2. **Customize** with your project specifics
3. **Paste into Claude** conversation
4. **Save output** to corresponding docs/ folder
5. **Update Loop workspace** with results

## Tips for Better Results

- Provide context about your industry/domain
- Share any existing research or user feedback
- Be specific about constraints (time, budget, team)
- Ask follow-up questions to drill deeper
- Challenge Claude's assumptions and suggestions
"""
    
    # Note: Claude prompts documentation is now in main README.md
        f.write(index_content)
    
    print("✅ Claude prompts documented in main README.md")

def main():
    """Generate all discovery prompts"""
    try:
        print("🤖 Generating Claude Discovery Prompts...")
        
        # Load project information
        project_info = load_project_info()
        if not project_info:
            return
        
        # Generate prompts
        prompts = create_discovery_prompts(project_info)
        
        # Save to files
        save_prompts(prompts)
        create_prompt_index()
        
        print(f"\n✨ Generated {len(prompts)} discovery prompts!")
        print("📁 Location: templates/claude-prompts/")
        print("\n🚀 Next Steps:")
        print("1. Open README.md for Claude prompts documentation")
        print("2. Start with 01_project_scope.md")
        print("3. Use prompts sequentially with Claude")
        print("4. Save outputs to docs/ folders")
        
    except Exception as e:
        print(f"❌ Error generating prompts: {e}")

if __name__ == "__main__":
    main()