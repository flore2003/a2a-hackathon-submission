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

function saveResults(
    companyProfiles: { company: string; content: string }[],
    companyContacts: { company: string; contacts: { name: string; role: string; email: string }[] }[],
    contactProfiles: { company: string; contact: string; content: string }[],
    outputPath: string,
): void {
    try {
        const originalCwd = process.env.INIT_CWD || process.cwd();
        const absolutePath = resolve(originalCwd, outputPath);

        const results = {
            companyProfiles,
            companyContacts,
            contactProfiles,
        };

        // Write to file with pretty formatting
        writeFileSync(absolutePath, JSON.stringify(results, null, 2), "utf-8");
        console.log(`\nResults saved to: ${outputPath}`);
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

    const companyContactsAgent = new Agent<
        {
            company: string;
        },
        {
            contacts: {
                name: string;
                role: string;
                email: string;
            }[];
        }
    >(agDevClient, config.COMPANY_CONTACTS_AGENT_ID);

    const companyContactProfileAgent = new Agent<
        {
            company: string;
            contact: string;
        },
        {
            result: string;
        }
    >(agDevClient, config.COMPANY_CONTACT_PROFILE_AGENT_ID);

    // Generate timestamp for consistent file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

    console.log(`Processing ${companies.length} companies...`);

    // Run company profile and contacts agents in parallel (they are independent)
    console.log("Running company profile and contacts agents in parallel...");
    const [companyProfileResults, companyContactsResults] = await Promise.all([
        companyProfileAgent.runBatch(companies.map((company) => ({ company }))),
        companyContactsAgent.runBatch(companies.map((company) => ({ company }))),
    ]);

    // Prepare and save company profiles
    const companyProfiles = companyProfileResults.map((result) => ({
        company: result.input.company,
        content: result.resultData?.result || "",
    }));

    // Prepare and save company contacts
    const companyContacts = companyContactsResults.map((result) => ({
        company: result.input.company,
        contacts: result.resultData?.contacts || [],
    }));

    // Save step 1 results
    console.log("Saving step 1 results (company profiles and contacts)...");
    const step1OutputPath = `step1-company-data-${timestamp}.json`;
    saveResults(companyProfiles, companyContacts, [], step1OutputPath);

    // Prepare contact profile inputs from the contacts results
    const contactProfileInputs: { company: string; contact: string }[] = [];
    companyContactsResults.forEach((result) => {
        if (result.resultData?.contacts) {
            result.resultData.contacts.forEach((contact) => {
                contactProfileInputs.push({
                    company: result.input.company,
                    contact: contact.name,
                });
            });
        }
    });

    // Run contact profile agent with the contacts from the previous step
    console.log(`Running contact profile agent for ${contactProfileInputs.length} contacts...`);
    const contactProfileResults =
        contactProfileInputs.length > 0 ? await companyContactProfileAgent.runBatch(contactProfileInputs) : [];

    // Prepare contact profiles
    const contactProfiles = contactProfileResults.map((result) => ({
        company: result.input.company,
        contact: result.input.contact,
        content: result.resultData?.result || "",
    }));

    // Save step 2 results (contact profiles only)
    console.log("Saving step 2 results (contact profiles)...");
    const step2OutputPath = `step2-contact-profiles-${timestamp}.json`;
    try {
        const originalCwd = process.env.INIT_CWD || process.cwd();
        const absolutePath = resolve(originalCwd, step2OutputPath);
        writeFileSync(absolutePath, JSON.stringify(contactProfiles, null, 2), "utf-8");
        console.log(`Contact profiles saved to: ${step2OutputPath}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error writing contact profiles file: ${error.message}`);
        } else {
            console.error("Unknown error occurred while writing contact profiles file");
        }
    }

    // Save final combined results
    console.log("Saving final combined results...");
    const finalOutputPath = `final-company-results-${timestamp}.json`;
    saveResults(companyProfiles, companyContacts, contactProfiles, finalOutputPath);

    console.log("Done!");
    console.log(`Processed ${companies.length} companies, found ${contactProfileInputs.length} contacts total.`);
    console.log("\nFiles created:");
    console.log(`- ${step1OutputPath} (company profiles + contacts)`);
    console.log(`- ${step2OutputPath} (contact profiles)`);
    console.log(`- ${finalOutputPath} (all results combined)`);
}

// Run the CLI tool
main();
