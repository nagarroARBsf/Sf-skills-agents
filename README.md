# 🚀 Salesforce Skills & Custom Agents Repository

**A centralized, reusable library of Salesforce expertise for Claude Code, built by Nagarro.**

This repository contains 100+ specialized **Salesforce skills** and **4 custom agents** that supercharge your Salesforce development workflow. Use these across any project to automate development, testing, debugging, and deployment tasks.

---

## 📋 Table of Contents

- [What's Included](#whats-included)
- [Quick Start](#quick-start)
- [Installation & Setup](#installation--setup)
- [How to Use](#how-to-use)
- [Integration Guides](#integration-guides)
- [Project Structure](#project-structure)
- [Available Skills](#available-skills)
- [Custom Agents](#custom-agents)
- [Verification & Testing](#verification--testing)
- [Best Practices](#best-practices)
- [Support & Contributing](#support--contributing)

---

## 🎯 What's Included

### **100+ Salesforce Skills**
Pre-built, specialized skills for:
- ✅ Apex Development & Testing
- ✅ Lightning Web Components (LWC)
- ✅ OmniStudio (OmniScript, FlexCard, Integration Procedures, Data Mappers)
- ✅ Salesforce Data Cloud (preparation, segmentation, activation)
- ✅ Flow Builder & Automation
- ✅ Security & Compliance (CRUD/FLS, injection prevention)
- ✅ Deployment & DevOps
- ✅ Integration & APIs
- ✅ Debugging & Log Analysis
- ✅ And much more!

### **4 Custom Agents**
Advanced AI agents for specialized tasks:
1. **Apex Reviewer** - Governor limits, bulkification, security compliance
2. **Security Auditor** - CRUD/FLS, SOQL injection, PII exposure
3. **Test Generator** - Comprehensive Apex test creation with bulk data
4. **Deploy Orchestrator** - Multi-step deployments with dependency resolution

---

## 🚀 Quick Start

### **Option 1: Use This Repository as a Template**

```bash
# Clone this repository
git clone https://github.com/nagarro/sf-skills-agents.git
cd sf-skills-agents

# Install Claude Code CLI (if not already installed)
npm install -g @anthropic/claude-code

# Login to Claude Code
claude login

# Open in your editor
code .
```

### **Option 2: Copy to Existing Project**

```bash
# From your existing Salesforce project
cp -r /path/to/sf-skills-agents/.claude ./

# Commit and push
git add .claude
git commit -m "Add Salesforce skills and agents"
git push origin main
```

---

## 📦 Installation & Setup

### **Step 1: Verify `.claude` Directory Structure**

Ensure your project has the following structure:

```
your-project/
├── .claude/
│   ├── .mcp.json                    # MCP Server configuration
│   ├── agents/                      # Custom agents
│   │   ├── apex-reviewer.md
│   │   ├── security-auditor.md
│   │   ├── test-generator.md
│   │   └── deploy-orchestrator.md
│   └── skills/                      # 100+ Salesforce skills
│       ├── sf-apex/
│       ├── sf-lwc/
│       ├── debugging-apex-logs/
│       ├── generating-apex/
│       └── ... (many more)
├── src/
├── package.json
└── README.md
```

### **Step 2: Configure MCP Servers (Optional but Recommended)**

The `.claude/.mcp.json` file includes Salesforce DX MCP server configuration:

```bash
# Enable Salesforce DX after configuring your org
# Edit .claude/.mcp.json and set your org alias:

{
  "mcpServers": {
    "salesforce-dx": {
      "command": "npx",
      "args": ["-y", "@anthropic/salesforce-dx-mcp-server"],
      "env": {
        "SF_ORG_ALIAS": "your-org-alias"
      },
      "disabled": false
    }
  }
}
```

Then authenticate:

```bash
sf org login web --alias your-org-alias
```

### **Step 3: Load Skills in Claude Code**

Skills are automatically discovered from the `.claude/skills/` directory. No additional configuration needed!

---

## 💡 How to Use

### **Using Skills in Claude Code**

Skills are invoked using the `/` prefix in Claude Code:

#### **Example 1: Debug Apex Logs**
```
/debugging-apex-logs
```
Claude will analyze your debug logs and provide governor limit diagnosis and performance recommendations.

#### **Example 2: Generate Apex Code**
```
/generating-apex "Create a trigger handler that bulkifies account updates"
```

#### **Example 3: Generate LWC Components**
```
/generating-lwc-components "Create a search component for accounts"
```

### **Using Custom Agents**

Custom agents provide specialized analysis beyond individual skills:

#### **Run Apex Code Review**
```
Agent: Apex Reviewer
Task: "Review this Apex code for governor limits and security issues"
```

#### **Security Audit**
```
Agent: Security Auditor
Task: "Scan this Apex code for CRUD/FLS violations and SOQL injection"
```

#### **Generate Tests**
```
Agent: Test Generator
Task: "Create comprehensive test class for AccountHandler trigger"
```

---

## 🔌 Integration Guides

### **Integration with GitHub**

#### **Step 1: Add to Your Repository**

```bash
# In your Salesforce project root
mkdir -p .claude
cp -r /path/to/sf-skills-agents/.claude/* .claude/

# Commit
git add .claude/
git commit -m "Add Salesforce skills and agents by Nagarro"
git push origin main
```

#### **Step 2: GitHub Actions Integration (Optional)**

Create `.github/workflows/sf-skills-verification.yml`:

```yaml
name: Salesforce Skills Verification

on: [push, pull_request]

jobs:
  verify-skills:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify .claude directory exists
        run: |
          if [ -d ".claude" ]; then
            echo "✅ .claude directory found"
            find .claude -type f -name "*.md" | wc -l
          else
            echo "❌ .claude directory missing"
            exit 1
          fi
      
      - name: Check agent definitions
        run: |
          ls .claude/agents/*.md | wc -l
          echo "Agents configured successfully"
```

#### **Step 3: Link to Claude Code from GitHub**

In your GitHub repository README:

```markdown
## 🤖 AI-Powered Development

This project includes [100+ Salesforce skills](https://github.com/nagarro/sf-skills-agents) 
and 4 custom agents for Claude Code.

**To use in Claude Code:**
1. Clone this repository
2. Run `claude login`
3. Use `/sf-apex` or other skills to automate development
```

---

### **Integration with Claude Code (IDE Extensions)**

#### **For VS Code**

1. Install the [Claude Code VS Code Extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)
2. Open your project with the `.claude` directory
3. Click the **Claude Code** icon in the sidebar
4. Start using skills: `/sf-apex`, `/generating-lwc-components`, etc.

#### **For JetBrains IDEs**

1. Install the Claude Code plugin from JetBrains Marketplace
2. Configure your Anthropic API key
3. Open your project
4. Use skills from the Claude Code panel

---

### **Integration with Codex/Coding Agents**

For third-party coding agents or custom integrations:

#### **Step 1: Export Skills Metadata**

```bash
# Create a skills manifest
cat > .claude/SKILLS_MANIFEST.json << 'EOF'
{
  "repository": "https://github.com/nagarro/sf-skills-agents",
  "version": "1.0.0",
  "skills": $(find .claude/skills -name "SKILL.md" | xargs -I {} basename {} SKILL.md),
  "agents": $(find .claude/agents -name "*.md" -exec basename {} .md \;)
}
EOF
```

#### **Step 2: Use in Custom Scripts**

```python
import json
import os

def load_skills():
    """Load all available Salesforce skills"""
    skills_dir = ".claude/skills"
    skills = {}
    
    for skill_folder in os.listdir(skills_dir):
        skill_path = os.path.join(skills_dir, skill_folder, "SKILL.md")
        if os.path.exists(skill_path):
            with open(skill_path, 'r') as f:
                skills[skill_folder] = f.read()
    
    return skills

def load_agents():
    """Load all custom agents"""
    agents_dir = ".claude/agents"
    agents = {}
    
    for agent_file in os.listdir(agents_dir):
        if agent_file.endswith('.md'):
            with open(os.path.join(agents_dir, agent_file), 'r') as f:
                agents[agent_file[:-3]] = f.read()
    
    return agents

# Usage
all_skills = load_skills()
all_agents = load_agents()
print(f"Loaded {len(all_skills)} skills and {len(all_agents)} agents")
```

---

## 📂 Project Structure

```
sf-skills-agents/
│
├── README.md                          # This file
├── .gitignore                         # Git configuration
├── .git/                              # Git repository
│
└── .claude/                           # Claude Code Configuration (Copy to your project)
    │
    ├── .mcp.json                      # MCP Server configuration
    │
    ├── agents/                        # 4 Custom Agents
    │   ├── apex-reviewer.md           # 🔍 Apex code analysis
    │   ├── security-auditor.md        # 🔒 Security scanning
    │   ├── test-generator.md          # 🧪 Test creation
    │   └── deploy-orchestrator.md     # 🚀 Deployment orchestration
    │
    └── skills/                        # 100+ Salesforce Skills
        │
        ├── sf-apex/                   # Apex Development
        │   ├── SKILL.md
        │   ├── README.md
        │   └── CREDITS.md
        │
        ├── sf-lwc/                    # Lightning Web Components
        ├── sf-flow/                   # Flow Builder
        ├── sf-soql/                   # SOQL Queries
        ├── sf-schema/                 # Schema Management
        │
        ├── debugging-apex-logs/       # 📊 Debug Log Analysis
        ├── running-apex-tests/        # 🧪 Test Execution
        ├── generating-apex/           # ✨ Apex Code Generation
        ├── generating-lwc-components/ # ⚡ LWC Generation
        │
        ├── building-omnistudio-omniscript/        # OmniScript
        ├── building-omnistudio-flexcard/          # FlexCard
        ├── building-omnistudio-integration-procedure/
        ├── building-omnistudio-datamapper/
        │
        ├── connecting-datacloud/      # Data Cloud Setup
        ├── segmenting-datacloud/      # Data Cloud Segments
        ├── retrieving-datacloud/      # Data Cloud Queries
        ├── activating-datacloud/      # Data Cloud Activation
        │
        ├── deploying-metadata/        # Deployment
        ├── deploying-omnistudio-datapacks/
        │
        ├── sf-security/               # Security
        ├── sf-permissions/            # Permissions
        │
        └── ... (70+ more skills)
```

---

## 🎓 Available Skills

### **Core Development**
| Skill | Purpose |
|-------|---------|
| `sf-apex` | Apex code assistance |
| `sf-lwc` | Lightning Web Components |
| `sf-flow` | Flow Builder automation |
| `sf-soql` | SOQL query building |
| `sf-schema` | Schema/metadata management |

### **Code Generation**
| Skill | Purpose |
|-------|---------|
| `generating-apex` | Generate Apex classes/triggers |
| `generating-lwc-components` | Generate LWC components |
| `generating-validation-rule` | Generate validation rules |
| `generating-flow` | Generate flows |
| `generating-custom-field` | Generate custom fields |

### **Testing & Quality**
| Skill | Purpose |
|-------|---------|
| `running-apex-tests` | Run Apex tests |
| `generating-apex-test` | Generate test classes |
| `analyzing-test-failures` | Analyze test failures |
| `debugging-apex-logs` | Debug log analysis |
| `configuring-quality-gate` | Quality gate setup |

### **OmniStudio**
| Skill | Purpose |
|-------|---------|
| `building-omnistudio-omniscript` | OmniScript authoring |
| `building-omnistudio-flexcard` | FlexCard creation |
| `building-omnistudio-integration-procedure` | Integration Procedures |
| `building-omnistudio-datamapper` | Data Mappers |
| `analyzing-omnistudio-dependencies` | Dependency analysis |

### **Data Cloud**
| Skill | Purpose |
|-------|---------|
| `connecting-datacloud` | Data Cloud setup |
| `segmenting-datacloud` | Segment creation |
| `retrieving-datacloud` | Data retrieval |
| `activating-datacloud` | Data activation |
| `harmonizing-datacloud` | Data harmonization |

### **Deployment & DevOps**
| Skill | Purpose |
|-------|---------|
| `deploying-metadata` | Metadata deployment |
| `deploying-omnistudio-datapacks` | DataPack deployment |
| `deploying-ui-bundle` | UI Bundle deployment |

### **Security & Compliance**
| Skill | Purpose |
|-------|---------|
| `sf-security` | Security analysis |
| `sf-permissions` | Permission management |

**→ [View all 100+ skills →](https://github.com/nagarro/sf-skills-agents/tree/main/.claude/skills)**

---

## 🤖 Custom Agents

### **1. Apex Reviewer**
Advanced static analysis for Apex code.

```bash
# How to use
Agent: apex-reviewer
File: src/classes/AccountHandler.cls

# Checks for:
✅ Governor limit violations (SOQL/DML in loops)
✅ Bulkification issues
✅ Security compliance (with sharing, CRUD/FLS)
✅ Best practices (trigger handlers, error handling)
```

**Output:**
```
File: src/classes/AccountHandler.cls
Issues: 
  - Line 45: SOQL in loop (CRITICAL) → Query outside loop and use Map
  - Line 78: Missing with sharing (WARNING) → Add "with sharing" keyword
Score: 6/10
```

---

### **2. Security Auditor**
Scan for security vulnerabilities.

```bash
# How to use
Agent: security-auditor
Codebase: src/

# Scans for:
✅ CRUD/FLS enforcement
✅ SOQL injection risks
✅ Missing sharing declarations
✅ PII exposure in logs
✅ Hardcoded credentials
```

---

### **3. Test Generator**
Generate comprehensive Apex test classes.

```bash
# How to use
Agent: test-generator
Code: src/classes/OrderProcessor.cls

# Generates:
✅ Bulk data scenarios (200+ records)
✅ Positive test cases
✅ Negative/edge case tests
✅ Permission testing
✅ Callout mocking
```

---

### **4. Deploy Orchestrator**
Orchestrate complex deployments.

```bash
# How to use
Agent: deploy-orchestrator
Target: production

# Handles:
✅ Dependency resolution
✅ Rollback on failure
✅ Targeted test execution
✅ Progress tracking
```

---

## ✅ Verification & Testing

### **Method 1: Interactive Verification in Claude Code**

```bash
# Open Claude Code
claude . 

# Ask Claude to verify a skill is working
"Run the apex-reviewer agent on my AccountHandler.cls file"

# Expected output:
✅ Agent analyzes code
✅ Provides governor limit analysis
✅ Lists specific issues with line numbers
✅ Gives severity ratings
```

### **Method 2: Automated Verification Script**

Create `verify-skills.sh`:

```bash
#!/bin/bash

echo "🔍 Verifying Salesforce Skills & Agents..."
echo ""

# Check .claude directory
if [ ! -d ".claude" ]; then
    echo "❌ .claude directory not found"
    exit 1
fi

echo "✅ .claude directory found"
echo ""

# Verify agents
echo "📋 Checking Agents:"
AGENT_COUNT=$(find .claude/agents -name "*.md" | wc -l)
echo "   Found $AGENT_COUNT agents"
[ $AGENT_COUNT -eq 4 ] && echo "   ✅ All 4 agents present" || echo "   ⚠️  Expected 4 agents"
echo ""

# Verify skills
echo "🎯 Checking Skills:"
SKILL_COUNT=$(find .claude/skills -type d -mindepth 1 -maxdepth 1 | wc -l)
echo "   Found $SKILL_COUNT skill directories"
[ $SKILL_COUNT -gt 90 ] && echo "   ✅ All 100+ skills present" || echo "   ⚠️  Expected 100+ skills"
echo ""

# Verify MCP config
echo "🔌 Checking MCP Configuration:"
if [ -f ".claude/.mcp.json" ]; then
    echo "   ✅ .mcp.json found"
else
    echo "   ⚠️  .mcp.json not found"
fi
echo ""

# List available skills
echo "📚 Available Skill Categories:"
find .claude/skills -type d -mindepth 1 -maxdepth 1 | \
    cut -d/ -f4 | \
    sed 's/-/ /g' | \
    sort | \
    head -20 | \
    sed 's/^/   /'
echo "   ... and $(find .claude/skills -type d -mindepth 1 -maxdepth 1 | wc -l) total"
echo ""

echo "✅ Verification complete!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Run: claude login"
echo "   2. Try a skill: /sf-apex"
echo "   3. Use an agent: Agent: apex-reviewer"
```

Run it:

```bash
chmod +x verify-skills.sh
./verify-skills.sh
```

### **Method 3: Test with Sample Code**

Create a test Apex file and use the agents:

```bash
# Create a test file
cat > test-code.cls << 'EOF'
public class TestBulkification {
    public static void processAccounts(List<Account> accounts) {
        for (Account acc : accounts) {
            // ❌ This is bad - SOQL in loop!
            List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
            acc.Contact_Count__c = contacts.size();
        }
        update accounts;
    }
}
EOF

# Ask Claude to review it
claude "Run the apex-reviewer agent on test-code.cls and identify issues"

# Expected: It should identify the SOQL in loop violation
```

---

## 🎯 Best Practices

### **1. Always Copy `.claude/` to Your Project**

```bash
# Good ✅
cp -r sf-skills-agents/.claude my-salesforce-project/

# Bad ❌
ln -s sf-skills-agents/.claude my-salesforce-project/
```

### **2. Use Skills for Specific Tasks**

```bash
# Good ✅
/debugging-apex-logs          # Analyze a specific debug log

# Bad ❌
"Can you help me with Salesforce?"  # Too vague
```

### **3. Commit `.claude/` to Git**

```bash
# In your Salesforce project
git add .claude/
git commit -m "Add Salesforce skills and agents"
git push origin main
```

### **4. Keep Skills Updated**

```bash
# Periodically update the repository
git clone https://github.com/nagarro/sf-skills-agents.git --depth 1
cp -r sf-skills-agents/.claude updated-skills/

# Compare and merge changes
diff -r updated-skills/.claude your-project/.claude/
```

### **5. Chain Multiple Skills**

```bash
# Example workflow:
1. /generating-apex          # Generate trigger handler
2. /generating-apex-test     # Generate test class
3. /running-apex-tests       # Run the tests
4. /deploying-metadata       # Deploy to org
```

---

## 📞 Support & Contributing

### **Get Help**

- 📖 **Documentation**: Each skill has a `README.md` in its directory
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/nagarro/sf-skills-agents/issues)
- 💬 **Discussion**: Start a [GitHub Discussion](https://github.com/nagarro/sf-skills-agents/discussions)
- 📧 **Email**: dev-salesforce@nagarro.com

### **Contributing**

We welcome contributions! To add a new skill:

1. Create a folder: `.claude/skills/your-skill-name/`
2. Add `SKILL.md` with frontmatter and description
3. Add `README.md` with examples
4. Submit a PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### **Credits**

Built by **Nagarro** with ❤️ for the Salesforce community.

- **Authors**: Salesforce Engineering Team @ Nagarro
- **License**: Apache 2.0
- **Last Updated**: June 2026

---

## 🔗 Quick Links

- 🏠 [Repository](https://github.com/nagarro/sf-skills-agents)
- 📚 [Salesforce Skills Catalog](https://github.com/nagarro/sf-skills-agents/tree/main/.claude/skills)
- 🤖 [Custom Agents](https://github.com/nagarro/sf-skills-agents/tree/main/.claude/agents)
- 📖 [Claude Code Documentation](https://claude.com/code)
- 🛠️ [Salesforce Developer Tools](https://developer.salesforce.com/tools/vscode)

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

**Happy coding! 🚀**

*Built with ❤️ by Nagarro for Salesforce developers everywhere.*

