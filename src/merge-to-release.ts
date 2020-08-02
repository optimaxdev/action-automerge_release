import path from 'path'
import {TGitHubOctokit, TGitHubPullRequest} from './types/github'
import {IContextEnv} from './types/context'
import {debug} from './lib/log'
import {getPRTargetBranchName, getPRBranchName} from './lib/github-common'
import {mergeBranchTo} from './lib/repo-api'
import {createPullRequestIfNotAlreadyExists} from './utils/repo'

/**
 * Return branch name without prefix
 * passed in releasePrefix argument.
 *
 * @export
 * @param {string} branchName - full name of a branch, e.g. "release/v.1.9"
 * @param {string} releasePrefix - e.g. "release"
 * @returns {string}
 */
export function getBranchNameWithoutPrefix(
  branchName: string,
  releasePrefix: string
): string {
  const branchNameTrimmed = branchName.trim()
  const releasePathTrimmed = branchName.includes('/')
    ? path.join(releasePrefix.trim(), '/')
    : releasePrefix.trim()
  return branchNameTrimmed.slice(releasePathTrimmed.length).trim()
}

/**
 * Get a serial number of the release related
 * to the branch name.
 *
 * @export
 * @param {string} branchName - e.g 'release/RLS-11'
 * @param {string} releasePrefix - e.g. 'release'
 * @param {string} releaseTaskPrefix - e.g. 'RLS-'
 * @returns {(number | undefined)} - e.g. 11. Return undefined if the branch name have no the releaseTaskPrefix.
 */
export function getBranchNameReleaseSerialNumber(
  branchName: string,
  releasePrefix: string,
  releaseTaskPrefix: string
): number | undefined {
  const releaseTaskPrefixTrimmed = releaseTaskPrefix.trim()
  const branchNameWithoutPrefix = getBranchNameWithoutPrefix(
    branchName,
    releasePrefix
  )

  if (!branchNameWithoutPrefix.includes(releaseTaskPrefixTrimmed)) {
    return
  }

  const branchNameWithoutTaskPrefix = branchNameWithoutPrefix
    .slice(releaseTaskPrefixTrimmed.length)
    .trim()
  const [releaseNumberString] = branchNameWithoutTaskPrefix.match(/^\d+/s) || []
  const releaseNumber = Number(releaseNumberString)

  return isNaN(releaseNumber) ? undefined : releaseNumber
}

/**
 * Filter a branches from the list
 * with branches with upper serial
 * number than the branch.
 *
 * @export
 * @param {string} currentBranchName - e.g 'release/RLS-11'
 * @param {string[]} branchesNamesList- e.g ['release/RLS-11', 'release/RLS-12', 'release/RLS-14', 'feature/TASK-1321']
 * @param {string} releasePrefix - e.g. 'release'
 * @param {string} releaseTaskPrefix - e.g. 'RLS-'
 * @returns {string[]} - e.g. ['release/RLS-12', 'release/RLS-14']
 * @throws - if failed to define the current branch serial number
 */
export function getBranchesWithUpperSerialNumber(
  currentBranchName: string,
  branchesNamesList: string[],
  releasePrefix: string,
  releaseTaskPrefix: string
): string[] {
  const currentBranchSerialNumber = getBranchNameReleaseSerialNumber(
    currentBranchName,
    releasePrefix,
    releaseTaskPrefix
  )

  if (!currentBranchSerialNumber && currentBranchSerialNumber !== 0) {
    throw new Error(
      `Failed to define a serial number for the PR branch "${currentBranchName}"`
    )
  }
  const branchesToSerialsMap = branchesNamesList.reduce((map, branchName) => {
    const branchNameTrimmed = branchName.trim()
    if (!map[branchNameTrimmed]) {
      const branchSerialNumber = getBranchNameReleaseSerialNumber(
        branchName,
        releasePrefix,
        releaseTaskPrefix
      )
      map[branchNameTrimmed] = branchSerialNumber
    }
    return map
  }, {} as Record<string, number | undefined>)
  return branchesNamesList
    .filter(branchName => {
      const branchSerialNumber = branchesToSerialsMap[branchName.trim()]

      if (!branchSerialNumber) {
        return false
      }
      return branchSerialNumber > currentBranchSerialNumber
    })
    .sort((branchNameFirst, branchNameSecond) => {
      const branchNameFirstSerialNum =
        branchesToSerialsMap[branchNameFirst.trim()]
      const branchNameSecondSerialNum =
        branchesToSerialsMap[branchNameSecond.trim()]
      return (
        Number(branchNameFirstSerialNum) - Number(branchNameSecondSerialNum)
      )
    })
}

export async function mergeSourceToBranch(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  contextEnv: IContextEnv,
  targetBranchName: string
): Promise<undefined | false> {
  const sourceBranchName = getPRBranchName(pullRequest)
  const result = await mergeBranchTo(
    octokit,
    pullRequest,
    targetBranchName,
    sourceBranchName
  )
  if (result === false) {
    // if a merge conflict
    debug(
      `The result of merging branch ${sourceBranchName} to the branch ${targetBranchName} is merge conflict`
    )
    await createPullRequestIfNotAlreadyExists(
      octokit,
      pullRequest,
      targetBranchName,
      sourceBranchName,
      contextEnv.automergePrLabel
    )
    return false
  } else {
    debug(
      `The result of merging branch ${sourceBranchName} to the branch ${targetBranchName}:`,
      result
    )
  }
}

/**
 * Merge PR's branch to related releases branches.
 *
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {IContextEnv} contextEnv
 * @param {string[]} targetBranchesList
 * @returns {Promist<void>} - returns nothing after work
 * @throws {Error}
 * @exports
 */
export async function mergeToRelated(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  contextEnv: IContextEnv,
  releaseBranchesList: string[]
): Promise<void> {
  const pullRequestTargetBranch = getPRTargetBranchName(pullRequest)
  if (!pullRequestTargetBranch) {
    throw new Error('Failed to determine PR target branch')
  }
  debug(
    'mergeToRelated::start',
    'Target branch name',
    pullRequestTargetBranch,
    'releaseBranchesList:',
    releaseBranchesList,
    'contextEnv',
    contextEnv
  )
  const branchesNamesRelated = getBranchesWithUpperSerialNumber(
    pullRequestTargetBranch,
    releaseBranchesList,
    contextEnv.releaseBranchPrfix,
    contextEnv.releaseBranchTaskPrefix
  )

  debug('mergeToRelated::branches related', branchesNamesRelated)
  const branchesRelatedCount = branchesNamesRelated.length
  if (!branchesRelatedCount) {
    debug('mergeToRelated::no branches related was found')
    return
  }
  const sourceBranchName = getPRBranchName(pullRequest)
  let targetBranchIdx = 0
  while (targetBranchIdx < branchesRelatedCount) {
    const brnachName = branchesNamesRelated[targetBranchIdx]
    const result = await mergeSourceToBranch(
      octokit,
      pullRequest,
      contextEnv,
      brnachName
    )
    if (result === false) {
      // if a merge conflict
      break
    } else {
      debug(
        `The result of merging branch ${sourceBranchName} to the branch ${brnachName}:`,
        result
      )
    }
    targetBranchIdx += 1
  }
}
