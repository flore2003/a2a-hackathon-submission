#!/usr/bin/env node

import { readFileSync } from "fs";
import { resolve } from "path";

import dotenv from "dotenv";

dotenv.config();

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

function main() {
    const { filePath } = parseArgs();

    console.log(`Loading companies from: ${filePath}`);
    console.log("---");

    const companies = loadCompaniesFromCsv(filePath);

    if (companies.length === 0) {
        console.log("No companies found in the file.");
        return;
    }

    console.log(`Found ${companies.length} companies:`);
    console.log("");

    companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company}`);
    });
}

// Run the CLI tool
main();
