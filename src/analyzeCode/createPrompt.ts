import * as core from "@actions/core";
import { Chunk, File } from "parse-diff";
import { PRDetails } from "../type";

const REVIEW_MAX_COMMENTS: string = core.getInput("REVIEW_MAX_COMMENTS");
const REVIEW_PROJECT_CONTEXT: string = core.getInput("REVIEW_PROJECT_CONTEXT");

export function createPrompt(
  changedFiles: File[],
  prDetails: PRDetails
): string {
  core.info("Creating prompt for AI...");
  const problemOutline = `Your task is to review pull requests (PR). Instructions:
    - Provide the response in following JSON format:  {"comments": [{"file": <file name>,  "lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
    - DO NOT give positive comments or compliments.
    - DO NOT give advice on renaming variable names or writing more descriptive variables.
    - Provide comments and suggestions ONLY if there is something to improve, otherwise return an empty array.
    - Provide at most ${REVIEW_MAX_COMMENTS} comments. It's up to you how to decide which comments to include.
    - Write the comment in GitHub Markdown format.
    - Use the given description only for the overall context and only comment the code.
    ${
      REVIEW_PROJECT_CONTEXT
        ? `- Additional context regarding this PR's project: ${REVIEW_PROJECT_CONTEXT}`
        : ""
    }
    - IMPORTANT: NEVER suggest adding comments to the code.
    - IMPORTANT: Evaluate the entire diff in the PR before adding any comments.
    
    Pull request title: ${prDetails.title}
    Pull request description:
    
    ---
    ${prDetails.description}
    ---
    
    TAKE A DEEP BREATH AND WORK ON THIS THIS PROBLEM STEP-BY-STEP.
    `;

  const diffChunksPrompt = new Array();

  for (const file of changedFiles) {
    if (file.to === "/dev/null") continue; // Ignore deleted files
    for (const chunk of file.chunks) {
      diffChunksPrompt.push(createPromptForDiffChunk(file, chunk));
    }
  }

  core.info("Prompt created successfully.");
  return `${problemOutline}\n ${diffChunksPrompt.join("\n")}`;
}

export function createPromptForDiffChunk(file: File, chunk: Chunk): string {
  return `\n
        Review the following code diff in the file "${
          file.to
        }". Git diff to review:
      
        \`\`\`diff
        ${chunk.content}
        ${chunk.changes
          // @ts-expect-error - ln and ln2 exists where needed
          .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
          .join("\n")}
        \`\`\`
        `;
}
