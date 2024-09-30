import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function getDiff(
  owner: string,
  repo: string,
  pull_number: number
): Promise<string | null> {
  core.info(`Fetching diff for PR #${pull_number}...`);

  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: "diff" },
  });

  // @ts-expect-error - response.data is a string
  return response.data;
}
