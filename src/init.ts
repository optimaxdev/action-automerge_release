import * as core from '@actions/core'
import * as gitHub from '@actions/github'

import {IContextEnv} from './types/context'
import {TGitHubOctokit, IGitHubPushDescription} from './types/github'
import {debug} from './lib/log'
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

/**
 * Make a push description from a
 * github context description given
 *
 * @param {typeof gitHub.context} context
 * @exports
 * @returns {IGitHubPushDescription}
 * @throws - if some property is not exits in the context it will throw
 */
export function getPushDescription(
  context: typeof gitHub.context
): IGitHubPushDescription {
  //https://developer.github.com/webhooks/event-payloads/#pull_request
  if (context.payload.pull_request) {
    // pull request interface mathes to the IGitHubPushDescription
    return context.payload.pull_request as unknown as IGitHubPushDescription
  }

  //https://developer.github.com/webhooks/event-payloads/#push
  const repoName = context.payload.repository?.name

  if (!repoName) {
    throw new Error('Failed to get repository name')
  }

  // If pushed not according to a pull request,
  // then base.ref === head.ref and equals to
  // the branch were commit
  const pushedToBranchRef = context.payload.ref
  debug('getPushDescription::context.payload', context.payload)
  return {
    base: {
      ref: pushedToBranchRef,
      repo: {
        name: repoName,
        owner: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          login: context.payload.repository!.owner.login,
        },
      },
    },
    head: {
      ref: pushedToBranchRef,
      sha: context.sha,
    },
  }
}

interface IInitReturnValue {
  pushDescription: IGitHubPushDescription
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

  const pushDescription = getPushDescription(context)
  debug('init::pushDescription', pushDescription)
  // Get event description related to this action
  if (!pushDescription) {
    throw new Error('Failed to get event description')
  }

  const contextEnv = initContextEnv()

  debug('init with context env', contextEnv)

  // TODO - cause the env variable $INPUT_RELEASEBRANCHPREFIX is not defined in the workflow
  // for the "releaseBranchPrfix" input, this workaround is used. May be $INPUT_RELEASEBRANCHPREFIX
  // is not defined only for the default values.
  const currentBranchSerialNumber = getBranchNameReleaseSerialNumber(
    getPRTargetBranchName(pushDescription),
    contextEnv.releaseBranchPrfix,
    contextEnv.releaseBranchTaskPrefix
  )

  if (!currentBranchSerialNumber) {
    debug('Skip actions cause the branch is not necessary to be handled')
    return
  }
  debug(`Branch serial number is ${currentBranchSerialNumber}`)
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
    pushDescription,
    octokit,
    contextEnv,
  }
}
