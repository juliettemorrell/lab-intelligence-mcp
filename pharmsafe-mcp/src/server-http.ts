import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerTools } from './tools.js';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3001', 10);

app.post('/mcp', async (req, res) => {
  const server = new McpServer({
    name: 'pharmsafe-mcp',
    version: '1.0.0',
    description: 'Medication Safety & Pharmacogenomics Intelligence'
  });

  registerTools(server);

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
      'pgx_drug_lookup'
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`PharmSafe MCP HTTP server running on port ${PORT}`);
  console.log(`  MCP endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`  Health check: GET  http://localhost:${PORT}/health`);
});
