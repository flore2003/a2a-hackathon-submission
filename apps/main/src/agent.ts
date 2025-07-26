import {
    AgDevClient,
    CreateAgentRequest,
    UpdateAgentRequest,
    Agent as AgentData,
    AgentRun,
    CreateAgentRunRequest,
} from "./ag-dev.js";

export type AgentRunResult<TOutput = Record<string, unknown>> = {
    id: string;
    status: AgentRun["status"];
    input: Record<string, unknown>;
    resultData?: TOutput;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
};

export type AgentConfig = CreateAgentRequest;

export class Agent<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
    private client: AgDevClient;
    private agentId: string;

    constructor(client: AgDevClient, agentId: string) {
        this.client = client;
        this.agentId = agentId;
    }

    /**
     * Create a new agent instance
     */
    static async create<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
        client: AgDevClient,
        config: AgentConfig,
    ): Promise<Agent<TInput, TOutput>> {
        const agentData = await client.createAgent(config);
        return new Agent<TInput, TOutput>(client, agentData.id);
    }

    /**
     * Load an existing agent by ID
     */
    static async load<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
        client: AgDevClient,
        agentId: string,
    ): Promise<Agent<TInput, TOutput>> {
        return new Agent<TInput, TOutput>(client, agentId);
    }

    /**
     * Get the agent ID
     */
    get id(): string {
        return this.agentId;
    }

    /**
     * Get the agent data (fetched fresh each time)
     */
    async getData(): Promise<AgentData> {
        return await this.client.getAgent(this.agentId);
    }

    /**
     * Update the agent configuration
     */
    async update(updates: UpdateAgentRequest): Promise<void> {
        await this.client.updateAgent(this.agentId, updates);
    }

    /**
     * Delete the agent
     */
    async delete(): Promise<void> {
        await this.client.deleteAgent(this.agentId);
    }

    /**
     * Run the agent with given input and wait for completion
     */
    async run(
        input: TInput,
        options?: {
            pollInterval?: number;
            timeout?: number;
        },
    ): Promise<AgentRunResult<TOutput>> {
        // Create the run
        const run = await this.client.createAgentRun(this.agentId, input as CreateAgentRunRequest);

        // Wait for completion
        const completedRun = await this.client.waitForAgentRun(this.agentId, run.id, options);

        return {
            id: completedRun.id,
            status: completedRun.status,
            input: completedRun.input,
            resultData: completedRun.resultData as TOutput,
            createdAt: completedRun.createdAt,
            updatedAt: completedRun.updatedAt,
            completedAt: completedRun.completedAt,
        };
    }

    /**
     * Start a run without waiting for completion
     */
    async startRun(input: TInput): Promise<string> {
        const run = await this.client.createAgentRun(this.agentId, input as CreateAgentRunRequest);
        return run.id;
    }

    /**
     * Get the result of a specific run
     */
    async getRunResult(runId: string): Promise<AgentRunResult<TOutput>> {
        const run = await this.client.getAgentRun(this.agentId, runId);
        return {
            id: run.id,
            status: run.status,
            input: run.input,
            resultData: run.resultData as TOutput,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            completedAt: run.completedAt,
        };
    }

    /**
     * Wait for a specific run to complete
     */
    async waitForRun(
        runId: string,
        options?: {
            pollInterval?: number;
            timeout?: number;
        },
    ): Promise<AgentRunResult<TOutput>> {
        const completedRun = await this.client.waitForAgentRun(this.agentId, runId, options);

        return {
            id: completedRun.id,
            status: completedRun.status,
            input: completedRun.input,
            resultData: completedRun.resultData as TOutput,
            createdAt: completedRun.createdAt,
            updatedAt: completedRun.updatedAt,
            completedAt: completedRun.completedAt,
        };
    }

    /**
     * Get all runs for this agent
     */
    async getAllRuns(): Promise<AgentRunResult<TOutput>[]> {
        const response = await this.client.listAgentRuns(this.agentId);
        return response.items.map((run) => ({
            id: run.id,
            status: run.status,
            input: run.input,
            resultData: run.resultData as TOutput,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            completedAt: run.completedAt,
        }));
    }

    /**
     * Run multiple inputs concurrently
     */
    async runBatch(
        inputs: TInput[],
        options?: {
            pollInterval?: number;
            timeout?: number;
        },
    ): Promise<AgentRunResult<TOutput>[]> {
        // Start all runs
        const runIds = await Promise.all(inputs.map((input) => this.startRun(input)));

        // Wait for all runs to complete
        const results = await Promise.all(runIds.map((runId) => this.waitForRun(runId, options)));

        return results;
    }

    /**
     * Get events for a specific run
     */
    async getRunEvents(runId: string) {
        return await this.client.getAgentRunEvents(this.agentId, runId);
    }
}
