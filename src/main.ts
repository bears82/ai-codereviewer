import { readFileSync } from "fs";
import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import parseDiff from "parse-diff";
import minimatch from "minimatch";
import { getPRDetails } from "./getPRDetails";
import { getDiff } from "./getDiff";
import { analyzeCode } from "./analyzeCode/index";
import { createReviewComment } from "./createReviewComment";
import { hasExistingReview } from "./hasExistingReview";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");

const APPROVE_REVIEWS: boolean = core.getInput("APPROVE_REVIEWS") === "true";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function main() {
  try {
    core.info("Starting AI code review process...");

    const prDetails = await getPRDetails();
    let diff: string | null;
    const eventData = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8")
    );

    core.info(`Processing ${eventData.action} event...`);
    const existingReview = await hasExistingReview(
      prDetails.owner,
      prDetails.repo,
      prDetails.pull_number
    );

    if (
      eventData.action === "opened" ||
      (eventData.action === "synchronize" && !existingReview)
    ) {
      diff = await getDiff(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number
      );
    } else if (eventData.action === "synchronize" && existingReview) {
      const newBaseSha = eventData.before;
      const newHeadSha = eventData.after;

      core.info(`Comparing commits: ${newBaseSha} -> ${newHeadSha}`);
      const response = await octokit.repos.compareCommits({
        headers: {
          accept: "application/vnd.github.v3.diff",
        },
        owner: prDetails.owner,
        repo: prDetails.repo,
        base: newBaseSha,
        head: newHeadSha,
      });

      diff = String(response.data);
    } else {
      core.info(`Unsupported event: ${process.env.GITHUB_EVENT_NAME}`);
      return;
    }

    if (!diff) {
      core.info("No diff found");
      return;
    }

    const changedFiles = parseDiff(diff);
    core.info(`Found ${changedFiles.length} changed files.`);

    const excludePatterns = core
      .getInput("exclude")
      .split(",")
      .map((s) => s.trim());

    const filteredDiff = changedFiles.filter((file) => {
      return !excludePatterns.some((pattern) =>
        minimatch(file.to ?? "", pattern)
      );
    });
    core.info(`After filtering, ${filteredDiff.length} files remain.`);

    const comments = await analyzeCode(filteredDiff, prDetails);
    if (APPROVE_REVIEWS || comments.length > 0) {
      await createReviewComment(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number,
        comments
      );
    } else {
      core.info("No comments to post.");
    }
    core.info("AI code review process completed successfully.");
  } catch (error: any) {
    core.error("Error:", error);
    core.setFailed(`Action failed: ${error.message}`);
    process.exit(1); // This line ensures the GitHub action fails
  }
}

core.info("Starting AI code review action...");
main().catch((error) => {
  core.error("Unhandled error in main function:", error);
  core.setFailed(
    `Unhandled error in main function: ${(error as Error).message}`
  );
  process.exit(1);
});
