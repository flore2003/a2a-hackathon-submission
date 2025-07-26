import { ExecuteToolResponse } from "@arcadeai/arcadejs/resources.mjs";
import { createArcadeClient, getUserId } from "./arcade-client";

export type GmailDraftParams = {
    subject: string;
    body: string;
    recipient: string;
    user_id?: string;
};

export type GmailDraftResult = {
    success: boolean;
    message: string;
    data?: ExecuteToolResponse;
    error?: string;
};

export async function createGmailDraft(params: GmailDraftParams): Promise<GmailDraftResult> {
    const clientResult = createArcadeClient();

    if (!clientResult.success) {
        return {
            success: false,
            message: clientResult.error || "Failed to create Arcade client",
            error: "Client creation failed",
        };
    }

    const client = clientResult.client!;
    const USER_ID = getUserId(params.user_id);
    const TOOL_NAME = "Gmail.WriteDraftEmail";

    try {
        // Start the authorization process
        const authResponse = await client.tools.authorize({
            tool_name: TOOL_NAME,
            user_id: USER_ID,
        });

        if (authResponse.status !== "completed") {
            console.log(`Authorization required. Please click this link to authorize: ${authResponse.url}`);
        }

        // Wait for the authorization to complete
        await client.auth.waitForCompletion(authResponse);

        const toolInput = {
            subject: params.subject,
            body: params.body,
            recipient: params.recipient,
        };

        const response = await client.tools.execute({
            tool_name: TOOL_NAME,
            input: toolInput,
            user_id: USER_ID,
        });

        return {
            success: true,
            message: "Gmail draft created successfully",
            data: response,
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to create Gmail draft",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// Example usage (commented out for module use)
/*
const example = async () => {
    const result = await createGmailDraft({
        subject: "Project Update",
        body: "Please find the attached project update.",
        recipient: "john.doe@example.com",
    });

    console.log(result);
};
*/
