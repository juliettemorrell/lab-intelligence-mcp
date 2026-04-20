import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';

const server = new McpServer({
  name: 'pharmsafe-mcp',
  version: '1.0.0',
  description: 'Medication Safety & Pharmacogenomics Intelligence — checks drug interactions, PGx conflicts, polypharmacy risks, renal/hepatic dosing, and deprescribing opportunities'
});

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PharmSafe MCP server running on stdio');
}

main().catch(console.error);
