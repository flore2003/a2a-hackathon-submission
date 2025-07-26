import * as esbuild from "esbuild";
import { buildConfig } from "@repo/esbuild-config";

await esbuild.build(buildConfig());
