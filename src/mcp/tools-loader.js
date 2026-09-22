// src/mcp/tools-loader.js
/**
 * Stub loader for MCP tools. In a full implementation this would call the Antigravity
 * `call_mcp_tool` native tool. For now we return a simple placeholder object.
 */
export async function invokeMcpTool(serverId, toolName, args) {
  // Placeholder implementation – returns the arguments for debugging.
  return { serverId, toolName, args, stub: true };
}

/** Retrieve loaded tool definitions for a server. */
export function getServerTools(serverId) {
  // No real tool loading in this stub; return empty array.
  return [];
}
