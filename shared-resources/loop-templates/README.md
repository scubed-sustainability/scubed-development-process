# Microsoft Loop Templates

This directory contains reusable Microsoft Loop components and templates for the S-cubed Development Process.

## 📋 Available Templates

### Requirements Loop Template
- **File**: `requirements-loop-template.json`
- **Purpose**: Collaborative requirements gathering and review
- **Components**: Requirements table, stakeholder comments, approval workflow
- **Usage**: Import into Loop workspace for requirements projects

### Architecture Decision Loop Template
- **File**: `architecture-decision-template.json`
- **Purpose**: Collaborative architecture decision making
- **Components**: Decision matrix, pros/cons analysis, voting mechanism
- **Usage**: Import for architecture planning sessions

### Project Status Loop Template
- **File**: `project-status-template.json`
- **Purpose**: Regular project status updates and stakeholder communication
- **Components**: Progress tracker, milestone checklist, risk register
- **Usage**: Weekly/monthly project status meetings

## 🚀 Usage Instructions

### 1. Import Template into Loop
1. Open Microsoft Loop
2. Create new workspace or open existing one
3. Click "Import" or "Add Component"
4. Select the appropriate JSON template file
5. Customize with your project details

### 2. Configure for Your Project
- Update project name and details
- Add team members and stakeholders
- Customize fields and workflows
- Set up notifications and reminders

### 3. Integrate with AI Workflow
- Use with Claude discovery prompts
- Connect to VS Code extension outputs
- Sync with project documentation
- Enable automated updates

## 🔄 Template Structure

Each Loop template includes:

```json
{
  "templateInfo": {
    "name": "Template Name",
    "version": "1.0.0",
    "description": "Template description",
    "author": "S-cubed Solutions"
  },
  "components": [
    {
      "type": "table|list|text|voting",
      "name": "Component Name",
      "configuration": { ... },
      "data": { ... }
    }
  ],
  "workflows": [
    {
      "name": "Workflow Name",
      "triggers": [ ... ],
      "actions": [ ... ]
    }
  ]
}
```

## 📊 Power Automate Integration

Templates can be integrated with Power Automate for:
- Automated notifications
- Data synchronization
- Approval workflows
- Report generation

See `/shared-resources/automation-scripts/` for Power Automate flow templates.

## 🛠️ Customization

### Adding New Templates
1. Create JSON template file
2. Follow the standard structure above
3. Test with sample data
4. Add documentation
5. Submit to shared resources

### Modifying Existing Templates
1. Copy template to avoid breaking existing usage
2. Make modifications
3. Update version number
4. Test thoroughly
5. Update documentation

## 📚 Best Practices

### Template Design
- Keep components focused and single-purpose
- Use clear, descriptive names
- Include helpful placeholder text
- Design for mobile and desktop usage

### Data Structure
- Use consistent field names across templates
- Include validation rules where appropriate
- Plan for data export and reporting
- Consider integration with external systems

### Collaboration
- Set appropriate permissions for different roles
- Use comments and discussions effectively
- Enable version tracking for important decisions
- Establish clear approval processes

## 🔗 Related Resources

- [Claude Prompts](../claude-prompts/) - AI prompts that generate Loop content
- [Automation Scripts](../automation-scripts/) - Scripts for Loop integration
- [VS Code Extension](../../vscode-extension/) - Extension that creates Loop workspaces
- [Templates Documentation](../../templates/) - Project templates that use Loop

## 📞 Support

For help with Loop templates:
1. Check Microsoft Loop documentation
2. Review S-cubed process guides
3. Contact your IT administrator for permissions
4. Submit issues to the S-cubed Development Process repository

---

*These templates are designed to work seamlessly with the S-cubed Development Process and VS Code extension.*