import * as core from "@actions/core";
import { File } from "parse-diff";
import { GithubComment, AICommentResponse } from "../type";

export function createComments(
  changedFiles: File[],
  aiResponses: Array<AICommentResponse>
): Array<GithubComment> {
  core.info("Creating GitHub comments from AI responses...");

  return aiResponses
    .flatMap((aiResponse) => {
      const file = changedFiles.find((file) => file.to === aiResponse.file);

      return {
        body: aiResponse.reviewComment,
        path: file?.to ?? "",
        line: Number(aiResponse.lineNumber),
      };
    })
    .filter((comments) => comments.path !== "");
}
