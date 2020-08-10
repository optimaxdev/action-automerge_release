import {TGitHubOctokit, IGitHubPushDescription} from '../types/github'
import {addLabelForPr, createBranch, createNewPR} from '../lib/repo-api'
import {debug, error} from '../lib/log'
import {
  getPRSourceBranchSHA,
  removeRefPrefixFromBranchName,
} from '../lib/github-common'

/**
 * Returns name of a branch when automerge failed
 *
 * @export
 * @param {string} sourceBranchName
 * @param {string} targetBranchName
 * @returns {string}
 */
export function getBranchNameForTargetBranchAutomergeFailed(
  targetBranchName: string,
  sourceBranchName: string
): string {
  return `automerge_${removeRefPrefixFromBranchName(
    sourceBranchName
  )}_to_${removeRefPrefixFromBranchName(targetBranchName).trim()}`
}

/**
 * Create a pull request from sourceBranchName
 * to targetBranchName if not already exists
 * for this two branches.
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {IGitHubPushDescription} pushDescription
 * @param {string} brnachName
 * @param {string} sourceBranchName
 * @param {string} pushDescriptionLabel - a label for pull request if created automatically
 * @returns {(Promise<void>)} - returns void if a pull request is exists or was successfully created
 */
export async function createPullRequest(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  targetBranchName: string,
  sourceBranchName: string,
  pushDescriptionLabel?: string
): Promise<void> {
  debug(
    `createPullRequest::start::from ${sourceBranchName} to ${targetBranchName} branch`
  )
  const automergeCustomBranchName = getBranchNameForTargetBranchAutomergeFailed(
    targetBranchName,
    sourceBranchName
  )

  debug(`createPullRequest::Create new branch ${automergeCustomBranchName}`)
  const automergeBranchName = await createBranch(
    octokit,
    pushDescription,
    automergeCustomBranchName,
    getPRSourceBranchSHA(pushDescription)
  )
  debug(
    `createPullRequest::New branch created ${automergeCustomBranchName};
    createPullRequest::Create new pull request from ${automergeBranchName} to ${targetBranchName} branch;`
  )
  const pushDescriptionNumber = await createNewPR(
    octokit,
    pushDescription,
    targetBranchName,
    automergeBranchName
  )

  if (typeof pushDescriptionNumber !== 'number') {
    throw new Error('Pull request was created with unknown number')
  }
  debug(
    `createPullRequest::Pull request from ${automergeBranchName} to ${targetBranchName} branch was created with number ${pushDescriptionNumber}`
  )
  if (pushDescriptionLabel && pushDescriptionLabel.trim()) {
    debug(
      `createPullRequest::Pull request from ${automergeBranchName} to ${targetBranchName} add the label ${pushDescriptionLabel} to the Pull Request created`
    )
    try {
      await addLabelForPr(
        octokit,
        pushDescription,
        pushDescriptionNumber,
        pushDescriptionLabel.trim()
      )
    } catch (err) {
      debug(
        `createPullRequest::failed to add label for Pull request from ${automergeBranchName} to ${targetBranchName}`
      )
      error(err)
    }
  }
}
