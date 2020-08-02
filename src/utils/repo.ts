import {TGitHubOctokit, TGitHubPullRequest} from '../types/github'
import {addLabelForPr, checkActivePRExists, createNewPR} from '../lib/repo-api'
import { debug, error } from '../lib/log';

/**
 * Create a pull request from sourceBranchName
 * to targetBranchName if not already exists
 * for this two branches.
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {string} brnachName
 * @param {string} sourceBranchName
 * @param {string} pullRequestLabel - a label for pull request if created automatically
 * @returns {(Promise<void>)} - returns void if a pull request is exists or was successfully created
 */
export async function createPullRequestIfNotAlreadyExists(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  targetBranchName: string,
  sourceBranchName: string,
  pullRequestLabel?: string
): Promise<void> {
  debug(
    `createPullRequestIfNotAlreadyExists::start::from ${sourceBranchName} to ${targetBranchName} branch`
  )
  const isExists = await checkActivePRExists(
    octokit,
    pullRequest,
    targetBranchName,
    sourceBranchName
  )
  if (isExists) {
    debug(
      `createPullRequestIfNotAlreadyExists::do nothing cause pull request from ${sourceBranchName} to ${targetBranchName} branch is exists`
    )
    // do nothing if a PR is already exists for this branches pair
    return
  }

  debug(
    `createPullRequestIfNotAlreadyExists::Create new pull request from ${sourceBranchName} to ${targetBranchName} branch`
  )
  const pullRequestNumber = await createNewPR(
    octokit,
    pullRequest,
    targetBranchName,
    sourceBranchName
  )

  if (typeof pullRequestNumber !== 'number') {
    throw new Error('Pull request was created with unknown number')
  }
  debug(
    `createPullRequestIfNotAlreadyExists::Pull request from ${sourceBranchName} to ${targetBranchName} branch was created with number ${pullRequestNumber}`
  )
  if (pullRequestLabel && pullRequestLabel.trim()) {
    debug(
      `createPullRequestIfNotAlreadyExists::Pull request from ${sourceBranchName} to ${targetBranchName} add the label ${pullRequestLabel} to the Pull Request created`
    )
    try {
      await addLabelForPr(
        octokit,
        pullRequest,
        pullRequestNumber,
        pullRequestLabel.trim()
      )
    } catch (err) {
      debug(
        `createPullRequestIfNotAlreadyExists::failed to add label for Pull request from ${sourceBranchName} to ${targetBranchName}`
      )
      error(err)
    }
  }
}
