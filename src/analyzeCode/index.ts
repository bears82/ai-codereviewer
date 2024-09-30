import * as core from "@actions/core";
import { createPrompt } from "./createPrompt";
import { getAIResponse } from "./getAIResponse";
import { createComments } from "./createComments";
import { File } from "parse-diff";
import { PRDetails, GithubComment } from "../type";

export async function analyzeCode(
  changedFiles: File[],
  prDetails: PRDetails
): Promise<Array<GithubComment>> {
  core.info("Analyzing code...");

  const prompt = createPrompt(changedFiles, prDetails);
  const aiResponse = await getAIResponse(prompt);
  core.info(JSON.stringify(aiResponse, null, 2));
  console.log(JSON.stringify(aiResponse, null, 2));

  const comments: Array<GithubComment> = [];

  if (aiResponse) {
    const newComments = createComments(changedFiles, aiResponse);

    if (newComments) {
      comments.push(...newComments);
    }
  }

  core.info(`Analysis complete. Generated ${comments.length} comments.`);
  return comments;
}
