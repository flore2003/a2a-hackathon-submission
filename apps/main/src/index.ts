#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { config } from "./config.js";
import { Agent } from "./agent.js";
import { AgDevClient } from "./ag-dev.js";

interface CliArgs {
    filePath: string;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);

    if (args.length === 0 || !args[0]) {
        console.error("Usage: npm -w @repo/main start <csv-file-path>");
        console.error("Example: npm -w @repo/main start ./leads.csv");
        process.exit(1);
    }

    return {
        filePath: args[0],
    };
}

function loadCompaniesFromCsv(filePath: string): string[] {
    try {
        // Use INIT_CWD (where npm was originally invoked) or current working directory
        const originalCwd = process.env.INIT_CWD || process.cwd();
        // Resolve the file path relative to where the command was originally run
        const absolutePath = resolve(originalCwd, filePath);

        // Read the file content
        const fileContent = readFileSync(absolutePath, "utf-8");

        // Split by lines and filter out empty lines
        const companies = fileContent
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        return companies;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error reading file: ${error.message}`);
        } else {
            console.error("Unknown error occurred while reading file");
        }
        process.exit(1);
    }
}

function saveProfilesToJson(profiles: { company: string; content: string }[], outputPath: string): void {
    try {
        const originalCwd = process.env.INIT_CWD || process.cwd();
        const absolutePath = resolve(originalCwd, outputPath);

        // Write to file with pretty formatting
        writeFileSync(absolutePath, JSON.stringify(profiles, null, 2), "utf-8");
        console.log(`\nCompany profiles saved to: ${outputPath}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error writing file: ${error.message}`);
        } else {
            console.error("Unknown error occurred while writing file");
        }
        process.exit(1);
    }
}

async function main() {
    const { filePath } = parseArgs();

    console.log(`Loading companies from: ${filePath}`);
    console.log("---");

    const companies = loadCompaniesFromCsv(filePath);

    if (companies.length === 0) {
        console.log("No companies found in the file.");
        return;
    }

    const agDevClient = new AgDevClient(config.AG_DEV_API_KEY);

    const companyProfileAgent = new Agent<
        {
            company: string;
        },
        {
            result: string;
        }
    >(agDevClient, config.COMPANY_PROFILE_AGENT_ID);

    console.log(`Processing ${companies.length} companies...`);
    const companyProfileResults = await companyProfileAgent.runBatch(companies.map((company) => ({ company })));

    // Generate output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const outputPath = `company-profiles-${timestamp}.json`;

    const companyProfiles = companyProfileResults.map((result) => ({
        company: result.input.company,
        content: result.resultData?.result || "",
    }));

    // Save to JSON
    saveProfilesToJson(companyProfiles, outputPath);

    console.log("Done!");
}

// Run the CLI tool
main();
