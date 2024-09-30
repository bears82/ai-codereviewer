export interface PRDetails {
  owner: string;
  repo: string;
  pull_number: number;
  title: string;
  description: string;
}

export interface AICommentResponse {
  file: string;
  lineNumber: string;
  reviewComment: string;
}

export interface GithubComment {
  body: string;
  path: string;
  line: number;
}
