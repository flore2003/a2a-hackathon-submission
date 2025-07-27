# A2A Hackathon Submission: Intelligent Lead Generation & Outreach Automation

> **Agent-to-Agent automation system that transforms company names into personalized outreach campaigns**

## 🎯 Project Overview

This project demonstrates the power of **Agent-to-Agent (A2A) automation** by orchestrating multiple AI agents to create a complete lead generation and outreach pipeline. Starting with just a list of company names, the system automatically researches companies, finds contacts, profiles decision-makers, and generates personalized outreach emails—all through intelligent agent collaboration.

## 🏗️ Architecture

The system consists of two main applications working in harmony:

### 🤖 Main Application (`apps/main/`)
A TypeScript CLI tool that orchestrates multiple AI agents in a sophisticated pipeline:

1. **Company Profile Agent** - Researches and profiles target companies
2. **Company Contacts Agent** - Identifies key decision-makers and their contact information  
3. **Contact Profile Agent** - Creates detailed profiles of individual contacts
4. **Outreach Email Agent** - Generates personalized outreach emails using all gathered intelligence

### 📧 Arcade MCP Server (`apps/arcade-mcp/`)
A Model Context Protocol (MCP) server that bridges AI agents with real-world actions:

- Integrates with **Arcade.dev** for Gmail automation
- Creates draft emails directly in Gmail accounts
- Enables seamless transition from AI-generated content to actionable outreach

## 🚀 Key Features

- **Multi-Agent Pipeline**: Four specialized agents work in sequence and parallel to maximize efficiency
- **Intelligent Research**: Deep company and contact profiling using advanced AI capabilities
- **Personalized Outreach**: Context-aware email generation tailored to each recipient
- **Gmail Integration**: Direct draft creation through Arcade AI's Gmail tool
- **Batch Processing**: Concurrent agent execution for scalable lead processing
- **Comprehensive Output**: Structured JSON results with detailed company profiles, contacts, and generated emails

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development across all components
- **Node.js** - Runtime environment for all applications
- **Turbo** - Monorepo management and build orchestration
- **Arcade AI** - Real-world action execution and Gmail integration
- **FastMCP** - Model Context Protocol server implementation
- **Zod** - Runtime type validation and schema enforcement

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd a2a-hackathon-submission

# Install dependencies
npm install

# Build all applications
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create `.env` files in both application directories:

**`apps/main/.env`:**
```env
AG_DEV_API_KEY=your_ag_dev_api_key
COMPANY_PROFILE_AGENT_ID=agent_id_for_company_profiling
COMPANY_CONTACTS_AGENT_ID=agent_id_for_contact_finding
COMPANY_CONTACT_PROFILE_AGENT_ID=agent_id_for_contact_profiling
CREATE_OUTREACH_EMAIL_AGENT_ID=agent_id_for_email_generation
```

**`apps/arcade-mcp/.env`:**
```env
ARCADE_API_KEY=your_arcade_api_key
ARCADE_USER_ID=your_arcade_user_id
```

## 🏃‍♂️ Usage

### 1. Prepare Your Lead List
Create a CSV file with company names (one per line):
```csv
HockeyStack
Notion
Figma
Linear
```

### 2. Run the Main Pipeline
```bash
npm -w @repo/main start ./your-companies.csv
```

The system will:
- Research each company comprehensively
- Find key decision-makers and their contact information
- Create detailed profiles of each contact
- Generate personalized outreach emails
- Output results to a timestamped JSON file

### 3. Start the MCP Server (Optional)
```bash
npm -w @repo/arcade-mcp run
```

This enables integration with tools like Claude Desktop for direct Gmail draft creation.

## 📊 Sample Output

The system generates comprehensive results including:

```json
{
  "companyProfiles": [
    {
      "company": "HockeyStack",
      "content": "Detailed company intelligence report with funding, leadership, recent news..."
    }
  ],
  "companyContacts": [
    {
      "company": "HockeyStack", 
      "contacts": [
        {
          "name": "Buğra Gündüz",
          "role": "Co-Founder & CEO",
          "email": "bugra@hockeystack.com"
        }
      ]
    }
  ],
  "contactProfiles": [...],
  "outreachEmails": [...]
}
```

## 🎪 A2A Innovation Highlights

### Agent Orchestration
- **Parallel Processing**: Company profiling and contact finding run simultaneously
- **Sequential Dependencies**: Contact profiling waits for contact discovery
- **Batch Operations**: All agents support concurrent execution for scalability

### Cross-System Integration
- **AI-to-AI Communication**: Agents share context and build upon each other's work
- **AI-to-Action Bridge**: MCP server translates AI outputs into real-world Gmail actions
- **Structured Data Flow**: Type-safe data passing between all system components

### Intelligent Automation
- **Context Preservation**: Each agent builds upon previous agent outputs
- **Dynamic Adaptation**: Email generation adapts to company size, industry, and contact role
- **Quality Control**: Comprehensive error handling and data validation throughout

## 🏆 Hackathon Value Proposition

This project showcases the transformative potential of A2A automation by:

1. **Eliminating Manual Research**: What typically takes hours of manual work per company is completed in minutes
2. **Ensuring Consistency**: Every company receives the same depth of research and personalization
3. **Scaling Outreach**: Process hundreds of companies with the same effort as processing one
4. **Maintaining Quality**: AI agents ensure every email is personalized and contextually relevant
5. **Enabling Action**: Direct integration with Gmail makes the pipeline immediately actionable

## 🚀 Development

```bash
# Run in development mode
npm run dev

# Lint all code
npm run lint

# Format code
npm run format

# Type checking
npm run check-types
```

## 🤝 Contributing

This is a hackathon submission showcasing A2A automation capabilities. The codebase demonstrates production-ready patterns for agent orchestration, error handling, and real-world integration.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built for the A2A Hackathon** - Demonstrating the future of intelligent automation through agent collaboration 🤖✨
