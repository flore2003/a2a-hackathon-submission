import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createGmailDraft } from "./gmail-draft.js";
import dotenv from "dotenv";

dotenv.config();

const server = new FastMCP({
    name: "Arcade MCP",
    version: "1.0.0",
});

server.addTool({
    name: "gamil_create_draft",
    description: "Create a draft email in the user's Gmail account",
    parameters: z.object({
        subject: z.string(),
        body: z.string(),
        recipient: z.string(),
        user_id: z.string().optional().describe("Arcade user ID - if not provided, will use default from environment"),
    }),
    execute: async (args) => {
        const result = await createGmailDraft({
            subject: args.subject,
            body: args.body,
            recipient: args.recipient,
            user_id: args.user_id,
        });

        if (!result.success) {
            return `Error creating Gmail draft: ${result.message}${result.error ? ` - ${result.error}` : ""}`;
        }

        return `Gmail draft created successfully:\n\n${JSON.stringify(result.data?.output?.value, null, 2)}`;
    },
});

server.start({
    transportType: "httpStream",
});
