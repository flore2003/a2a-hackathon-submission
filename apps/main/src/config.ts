import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig();

// Utility function for parsing boolean environment variables
function booleanEnv(defaultValue: string) {
    return z
        .string()
        .default(defaultValue)
        .transform((val) => {
            const lower = val.toLowerCase();
            return lower === "true" || lower === "1" || lower === "yes";
        });
}

const configSchema = z.object({
    // Runtime configuration
    NODE_ENV: z.string().default("development"),

    // Application settings
    ENABLE_DEBUG: booleanEnv("false"),

    // API configurations (for potential future use with ag.dev)
    AG_DEV_API_KEY: z.string(),
    AG_DEV_BASE_URL: z.string().default("https://api.ag.dev"),

    // Agent Configs
    COMPANY_PROFILE_AGENT_ID: z.string(),
    COMPANY_CONTACTS_AGENT_ID: z.string(),
    COMPANY_CONTACT_PROFILE_AGENT_ID: z.string(),
});

export const config = configSchema.parse(process.env);
