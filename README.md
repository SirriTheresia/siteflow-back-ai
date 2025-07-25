# 🚀 GHL AI Automator - Backend API

Complete backend for GoHighLevel automation with AI content generation, user authentication, and 2FA support.

## 🔧 Quick Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start the server
npm start
```

**Server runs on:** `http://localhost:4000`
**GraphQL Playground:** `http://localhost:4000/graphql`

## 📱 React Frontend Integration

### Apollo Client Setup

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

## 🔐 Authentication Flow

### 1. Register User
```javascript
import { gql, useMutation } from '@apollo/client';

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
      workspace {
        id
        name
      }
    }
  }
`;

function RegisterForm() {
  const [register] = useMutation(REGISTER);
  
  const handleSubmit = async (formData) => {
    const { data } = await register({
      variables: {
        input: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          workspaceName: formData.companyName
        }
      }
    });
    
    localStorage.setItem('token', data.register.token);
    // Redirect to dashboard
  };
}
```

### 2. Login User
```javascript
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

function LoginForm() {
  const [login] = useMutation(LOGIN);
  
  const handleSubmit = async (email, password) => {
    const { data } = await login({
      variables: { email, password }
    });
    
    localStorage.setItem('token', data.login.token);
    // Redirect to dashboard
  };
}
```

## 🤖 AI Content Generation

### Generate Content with Claude
```javascript
const GENERATE_CONTENT = gql`
  mutation GenerateContent($input: AIContentInput!) {
    generateAIContent(input: $input) {
      success
      message
      data
    }
  }
`;

function ContentGenerator() {
  const [generateContent, { loading }] = useMutation(GENERATE_CONTENT);
  
  const handleGenerate = async () => {
    const { data } = await generateContent({
      variables: {
        input: {
          serviceText: "We provide plumbing services in Miami, FL...",
          companyData: {
            companyName: "Miami Plumbing Pro",
            industry: "Plumbing",
            location: "Miami, FL",
            targetAudience: "Homeowners"
          }
        }
      }
    });
    
    if (data.generateAIContent.success) {
      const generatedFields = data.generateAIContent.data;
      console.log(generatedFields); // JSON object with all service fields
    }
  };
  
  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Content'}
    </button>
  );
}
```

## ⚙️ GHL Automation Flow

### 1. Run Complete Automation
```javascript
const RUN_AUTOMATION = gql`
  mutation RunAutomation($input: GHLAutomationInput!) {
    runGHLAutomation(input: $input) {
      success
      message
      automation {
        id
        name
        status
        progress
        subaccountId
      }
    }
  }
`;

function AutomationRunner() {
  const [runAutomation, { loading }] = useMutation(RUN_AUTOMATION);
  
  const handleRun = async (formData) => {
    const { data } = await runAutomation({
      variables: {
        input: {
          email: "your-ghl-email@example.com",
          password: "your-password", // Optional - uses default if not provided
          subaccountId: "your_subaccount_id", // From GHL URL: .../location/THIS_ID/...
          serviceText: "Your business description...",
          companyData: {
            companyName: "Your Company",
            industry: "Your Industry"
          }
        }
      }
    });
    
    if (data.runGHLAutomation.success) {
      const automationId = data.runGHLAutomation.automation.id;
      // Store automation ID for 2FA handling
      setCurrentAutomationId(automationId);
    }
  };
}
```

### 2. Run with Pre-Generated Content
```javascript
const handleRunWithCustom = async (customValues) => {
  const { data } = await runAutomation({
    variables: {
      input: {
        email: "your-ghl-email@example.com",
        subaccountId: "your_subaccount_id",
        customValues: {
          "Service 1": "Plumbing Repair",
          "Service 1 Text 1": "Expert plumbing repairs...",
          "Service Area 1": "Miami",
          // ... more fields
        }
      }
    }
  });
};
```

## 🔒 2FA Handling in React

### Handle 2FA Code Submission
```javascript
const SUBMIT_2FA = gql`
  mutation Submit2FA($automationId: ID!, $code: String!) {
    submitTwoFactorCode(automationId: $automationId, code: $code) {
      success
      message
    }
  }
`;

function TwoFactorForm({ automationId }) {
  const [submit2FA] = useMutation(SUBMIT_2FA);
  const [code, setCode] = useState('');
  
  const handleSubmit = async () => {
    const { data } = await submit2FA({
      variables: {
        automationId,
        code
      }
    });
    
    if (data.submitTwoFactorCode.success) {
      alert('2FA code submitted! Automation will continue automatically.');
    }
  };
  
  return (
    <div>
      <input 
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
      />
      <button onClick={handleSubmit}>Submit Code</button>
    </div>
  );
}
```

### Alternative: REST Webhook (if preferred)
```javascript
const submit2FACode = async (automationId, code) => {
  const response = await fetch('http://localhost:4000/webhook/2fa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      automationId,
      code
    }),
  });
  
  const result = await response.json();
  return result;
};
```

## 📊 Automation Tracking

### Get All Automations
```javascript
const GET_AUTOMATIONS = gql`
  query GetAutomations {
    automations {
      id
      name
      status
      progress
      email
      subaccountId
      startedAt
      completedAt
      createdAt
      createdBy {
        firstName
        lastName
      }
    }
  }
`;

function AutomationList() {
  const { data, loading } = useQuery(GET_AUTOMATIONS);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {data.automations.map(automation => (
        <div key={automation.id}>
          <h3>{automation.name}</h3>
          <p>Status: {automation.status}</p>
          <p>Progress: {automation.progress}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Get Automation Details & Logs
```javascript
const GET_AUTOMATION = gql`
  query GetAutomation($id: ID!) {
    automation(id: $id) {
      id
      name
      status
      progress
      customValues
      aiContent
      errorMessage
    }
    automationLogs(automationId: $id) {
      id
      status
      message
      createdAt
    }
  }
`;

function AutomationDetails({ automationId }) {
  const { data, loading } = useQuery(GET_AUTOMATION, {
    variables: { id: automationId },
    pollInterval: 5000 // Poll every 5 seconds for real-time updates
  });
}
```

## 🎯 Real-Time Progress Updates

### Polling Example
```javascript
function AutomationProgress({ automationId }) {
  const { data, loading } = useQuery(GET_AUTOMATION, {
    variables: { id: automationId },
    pollInterval: 2000, // Poll every 2 seconds
    skip: !automationId
  });
  
  const automation = data?.automation;
  
  if (!automation) return null;
  
  return (
    <div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${automation.progress}%` }}
        />
      </div>
      <p>Status: {automation.status}</p>
      <p>Progress: {automation.progress}%</p>
      
      {automation.status === 'WAITING_2FA' && (
        <TwoFactorForm automationId={automationId} />
      )}
    </div>
  );
}
```

## 🚀 Complete React Integration Example

```javascript
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';

function GHLAutomationApp() {
  const [automationId, setAutomationId] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  
  const [generateContent] = useMutation(GENERATE_CONTENT);
  const [runAutomation] = useMutation(RUN_AUTOMATION);
  const [submit2FA] = useMutation(SUBMIT_2FA);
  
  // Step 1: Generate AI content
  const handleGenerateContent = async (serviceText, companyData) => {
    const { data } = await generateContent({
      variables: { input: { serviceText, companyData } }
    });
    
    if (data.generateAIContent.success) {
      setGeneratedContent(data.generateAIContent.data);
    }
  };
  
  // Step 2: Run automation
  const handleRunAutomation = async (ghlCredentials) => {
    const { data } = await runAutomation({
      variables: {
        input: {
          ...ghlCredentials,
          customValues: generatedContent // Use AI-generated content
        }
      }
    });
    
    if (data.runGHLAutomation.success) {
      setAutomationId(data.runGHLAutomation.automation.id);
    }
  };
  
  // Step 3: Handle 2FA if needed
  const handle2FA = async (code) => {
    await submit2FA({
      variables: { automationId, code }
    });
  };
  
  return (
    <div>
      <ContentGenerator onGenerate={handleGenerateContent} />
      <AutomationRunner 
        onRun={handleRunAutomation}
        generatedContent={generatedContent}
      />
      <AutomationProgress automationId={automationId} />
    </div>
  );
}
```

## 🔗 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/graphql` | POST | Main GraphQL endpoint |
| `/graphql` | GET | GraphQL Playground |
| `/webhook/2fa` | POST | REST endpoint for 2FA codes |
| `/health` | GET | Health check |

## 📋 Environment Variables

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ghl-automator
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
CLAUDE_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key
```

## 🎯 Key Features for Frontend

✅ **JWT Authentication** - Store token in localStorage  
✅ **Real-time Progress** - Poll automation status  
✅ **AI Content Generation** - Get structured JSON output  
✅ **2FA Support** - Handle via GraphQL or REST  
✅ **Error Handling** - Comprehensive error responses  
✅ **Workspace Management** - Multi-user support  
✅ **Execution Logs** - Debug and monitoring  

## 🔥 Ready to Connect!

This backend is **100% ready** for your React frontend. All endpoints tested, error handling in place, and GraphQL queries optimized for real-time UX.

**Next Steps:**
1. Set up Apollo Client in React
2. Implement authentication flow
3. Build automation UI with progress tracking
4. Add 2FA handling component

**Need help?** All queries and mutations are documented above with working examples! 🚀
# SiteFlow-Website-Content-Ai
# SiteFlow-Website-Backend-AI
# SiteFlow-Website-Backend-AI
# siteflow-back-ai
