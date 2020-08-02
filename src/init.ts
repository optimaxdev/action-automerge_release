import * as core from '@actions/core'
import * as gitHub from '@actions/github'

import {IContextEnv} from './types/context'
import {TGitHubOctokit, TGitHubPullRequest} from './types/github'
import {debug, error} from './lib/log'
import {getPRTargetBranchName} from './lib/github-common'
import {getBranchNameReleaseSerialNumber} from './merge-to-release'

/**
 * Initialize the context values
 *
 * @returns {IContextEnv}
 */
export const initContextEnv = (): IContextEnv => {
  return {
    token: core.getInput('token', {required: true}),
    automergePrLabel: core.getInput('automergePrLabel', {required: false}),
    releaseBranchTaskPrefix: core.getInput('releaseBranchTaskPrefix', {
      required: false,
    }),
    mainBranchName: core.getInput('mainBranchName', {required: false}),
    branchFetchingStrategy: core.getInput('branchFetchingStrategy', {
      required: false,
    }),
    releaseBranchPrfix: core.getInput('releaseBranchPrfix', {required: false}),
    remoteName: core.getInput('remoteName', {required: false}),
  }
}

interface IInitReturnValue {
  pullRequest: TGitHubPullRequest
  octokit: TGitHubOctokit
  contextEnv: IContextEnv
}

/**
 * Prepare the action running to work
 * and return the common values
 * which are necessary to work with.
 *
 * @export
 * @returns {IInitReturnValue | undefined} - returns "undefined" if there is nothind to do
 * @throws
 */
export function init(): IInitReturnValue | undefined {
  const context = gitHub.context

  if (!context) {
    throw new Error('Failed to get GitHub context')
  }

  const {
    payload: {pull_request},
  } = context

  // Get pull request related to this action
  if (!pull_request) {
    throw new Error(
      'The current pull request is not available in the github context'
    )
  }

  const contextEnv = initContextEnv()

  debug('init with context env', contextEnv)

  // TODO - cause the env variable $INPUT_RELEASEBRANCHPREFIX is not defined in the workflow
  // for the "releaseBranchPrfix" input, this workaround is used. May be $INPUT_RELEASEBRANCHPREFIX
  // is not defined only for the default values.
  const currentBranchSerialNumber = getBranchNameReleaseSerialNumber(
    getPRTargetBranchName(pull_request),
    contextEnv.releaseBranchPrfix,
    contextEnv.releaseBranchTaskPrefix
  )

  if (!currentBranchSerialNumber) {
    debug('Skip actions cause the branch is not necessary to be handled')
    return
  }

  const {changed_files} = pull_request

  if (!changed_files) {
    error(new Error('There are no files changed in the pull request'))
  }

  const {token: gitHubToken} = contextEnv
  let octokit: ReturnType<typeof gitHub.getOctokit>

  // initialize the Octokit instance
  try {
    octokit = gitHub.getOctokit(gitHubToken)
  } catch (err) {
    console.log(err)
    throw new Error('Failed to connect to the Octokit')
  }
  return {
    pullRequest: pull_request,
    octokit,
    contextEnv,
  }
}
