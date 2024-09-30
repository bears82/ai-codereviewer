import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function hasExistingReview(
  owner: string,
  repo: string,
  pull_number: number
): Promise<boolean> {
  const reviews = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number,
  });
  return reviews.data.length > 0;
}
