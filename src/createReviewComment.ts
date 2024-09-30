import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { GithubComment } from "./type";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
const APPROVE_REVIEWS: boolean = core.getInput("APPROVE_REVIEWS") === "true";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function createReviewComment(
  owner: string,
  repo: string,
  pull_number: number,
  comments: Array<GithubComment>
): Promise<void> {
  core.info(`Creating review comment for PR #${pull_number}...`);

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    comments,
    event: APPROVE_REVIEWS ? "APPROVE" : "COMMENT",
  });

  core.info(
    `Review ${APPROVE_REVIEWS ? "approved" : "commented"} successfully.`
  );
}
