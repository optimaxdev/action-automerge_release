import * as gitHub from '@actions/github'

/**
 * Description of a pull request
 */
export type TGitHubPullRequest = Exclude<
  typeof gitHub.context.payload.pull_request,
  undefined
>

/**
 * Octokit tool instance
 * */
export type TGitHubOctokit = ReturnType<typeof gitHub.getOctokit>
