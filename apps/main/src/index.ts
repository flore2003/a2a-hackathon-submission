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
    outreachEmails: { company: string; contact: string; email: string; content: string }[],
    outputPath: string,
): void {
    try {
        const originalCwd = process.env.INIT_CWD || process.cwd();
        const absolutePath = resolve(originalCwd, outputPath);

        const results = {
            companyProfiles,
            companyContacts,
            contactProfiles,
            outreachEmails,
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

    const createOutreachEmailAgent = new Agent<
        {
            company: string;
            contact: string;
            email: string;
            companyProfile: string;
            contactProfile: string;
        },
        {
            result: string;
        }
    >(agDevClient, config.CREATE_OUTREACH_EMAIL_AGENT_ID);

    console.log(`Processing ${companies.length} companies...`);

    // Run company profile and contacts agents in parallel (they are independent)
    console.log("Running company profile and contacts agents in parallel...");
    const [companyProfileResults, companyContactsResults] = await Promise.all([
        companyProfileAgent.runBatch(companies.map((company) => ({ company }))),
        companyContactsAgent.runBatch(companies.map((company) => ({ company }))),
    ]);

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

    // Prepare outreach email inputs by combining all the previous results
    const outreachEmailInputs: {
        company: string;
        contact: string;
        email: string;
        companyProfile: string;
        contactProfile: string;
    }[] = [];

    // Create a map for quick lookups
    const companyProfileMap = new Map(
        companyProfileResults.map((result) => [result.input.company, result.resultData?.result || ""]),
    );
    const contactProfileMap = new Map(
        contactProfileResults.map((result) => [
            `${result.input.company}-${result.input.contact}`,
            result.resultData?.result || "",
        ]),
    );

    // Build outreach email inputs
    companyContactsResults.forEach((contactsResult) => {
        const company = contactsResult.input.company;
        const companyProfile = companyProfileMap.get(company) || "";

        if (contactsResult.resultData?.contacts) {
            contactsResult.resultData.contacts.forEach((contact) => {
                const contactProfile = contactProfileMap.get(`${company}-${contact.name}`) || "";
                outreachEmailInputs.push({
                    company,
                    contact: contact.name,
                    email: contact.email,
                    companyProfile,
                    contactProfile,
                });
            });
        }
    });

    // Run outreach email agent for each contact
    console.log(`Running outreach email agent for ${outreachEmailInputs.length} contacts...`);
    const outreachEmailResults =
        outreachEmailInputs.length > 0 ? await createOutreachEmailAgent.runBatch(outreachEmailInputs) : [];

    // Generate output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const outputPath = `company-results-${timestamp}.json`;

    // Prepare results for output
    const companyProfiles = companyProfileResults.map((result) => ({
        company: result.input.company,
        content: result.resultData?.result || "",
    }));

    const companyContacts = companyContactsResults.map((result) => ({
        company: result.input.company,
        contacts: result.resultData?.contacts || [],
    }));

    const contactProfiles = contactProfileResults.map((result) => ({
        company: result.input.company,
        contact: result.input.contact,
        content: result.resultData?.result || "",
    }));

    const outreachEmails = outreachEmailResults.map((result) => ({
        company: result.input.company,
        contact: result.input.contact,
        email: result.input.email,
        content: result.resultData?.result || "",
    }));

    // Save all results to JSON
    saveResults(companyProfiles, companyContacts, contactProfiles, outreachEmails, outputPath);

    console.log("Done!");
    console.log(`Processed ${companies.length} companies, found ${contactProfileInputs.length} contacts total.`);
    console.log(`Generated ${outreachEmailResults.length} personalized outreach emails.`);
}

// Run the CLI tool
main();
