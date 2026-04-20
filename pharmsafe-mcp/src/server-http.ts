import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerTools } from './tools.js';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3001', 10);

// SHARP context extraction middleware
// Prompt Opinion platform passes EHR credentials via HTTP headers
function extractSharpContext(req: express.Request): Record<string, string> | null {
  const fhirServer = req.headers['x-fhir-server-url'] as string;
  const accessToken = req.headers['x-fhir-access-token'] as string;
  const patientId = req.headers['x-patient-id'] as string;

  if (fhirServer && accessToken && patientId) {
    return { fhirServerUrl: fhirServer, accessToken, patientId };
  }
  return null;
}

app.post('/mcp', async (req, res) => {
  const server = new McpServer({
    name: 'pharmsafe-mcp',
    version: '1.0.0',
    description: 'Medication Safety & Pharmacogenomics Intelligence'
  });

  registerTools(server);

  // Log SHARP context availability (not the token itself)
  const sharp = extractSharpContext(req);
  if (sharp) {
    console.log(`SHARP context: FHIR=${sharp.fhirServerUrl}, patient=${sharp.patientId}`);
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => {
    transport.close?.();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'pharmsafe-mcp',
    version: '1.0.0',
    tools: [
      'check_interactions',
      'check_pharmacogenomics',
      'check_renal_dosing',
      'check_hepatic_dosing',
      'check_duplicates',
      'check_allergies',
      'deprescribing_opportunities',
      'assess_polypharmacy',
      'medication_reconciliation',
      'generate_safety_report',
      'pgx_drug_lookup',
      'check_beers_criteria',
      'check_high_alert',
      'calculate_anticholinergic_burden',
      'pull_patient_medications',
      'check_food_interactions',
      'check_timing_conflicts',
      'generate_timing_schedule'
    ],
    timestamp: new Date().toISOString()
  });
});

// Agent card endpoint for discovery
app.get('/.well-known/agent-card.json', (_req, res) => {
  res.json({
    name: 'PharmSafe',
    description: 'Medication Safety & Pharmacogenomics Intelligence MCP',
    url: process.env.PUBLIC_URL || `http://localhost:${PORT}`,
    version: '1.0.0',
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text']
  });
});

app.listen(PORT, () => {
  console.log(`PharmSafe MCP HTTP server running on port ${PORT}`);
  console.log(`  MCP endpoint:  POST http://localhost:${PORT}/mcp`);
  console.log(`  Health check:  GET  http://localhost:${PORT}/health`);
  console.log(`  Agent card:    GET  http://localhost:${PORT}/.well-known/agent-card.json`);
});
