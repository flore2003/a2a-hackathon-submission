import { Arcade } from "@arcadeai/arcadejs";

export type ArcadeClientResult = {
    success: boolean;
    client?: Arcade;
    error?: string;
};

export function createArcadeClient(): ArcadeClientResult {
    const ARCADE_API_KEY = process.env.ARCADE_API_KEY;

    if (!ARCADE_API_KEY) {
        return {
            success: false,
            error: "ARCADE_API_KEY environment variable is not set",
        };
    }

    const client = new Arcade({
        apiKey: ARCADE_API_KEY,
    });

    return {
        success: true,
        client,
    };
}

export function getUserId(user_id?: string): string {
    return user_id || process.env.ARCADE_USER_ID || "{arcade_user_id}";
}
