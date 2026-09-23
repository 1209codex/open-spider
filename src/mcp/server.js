/**
 * @file src/mcp/server.js
 * MCP stdio server implementation for exposing Open-spider itself to external agents.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleRunCommand } from "../cli/run.js";

export async function startMcpStdioServer() {
  const server = new Server(
    {
      name: "open-spider",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "open_spider_run",
          description: "Decomposes a goal into subtasks, assigns workers, executes them, and returns synthesis report.",
          inputSchema: {
            type: "object",
            properties: {
              task: {
                type: "string",
                description: "The goal or coding task description to orchestrate",
              },
              strategy: {
                type: "string",
                enum: ["free-first", "balanced", "quality"],
                description: "Routing strategy (default: free-first)",
              },
            },
            required: ["task"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "open_spider_run") {
      const task = request.params.arguments?.task;
      const strategy = request.params.arguments?.strategy || "free-first";
      try {
        const result = await handleRunCommand(task, { strategy });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Open-spider error: ${err.message}`,
            },
          ],
        };
      }
    }
    throw new Error(`Tool ${request.params.name} not found`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
