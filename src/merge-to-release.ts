import path from 'path'
import {TGitHubOctokit, IGitHubPushDescription} from './types/github'
import {IContextEnv} from './types/context'
import {debug} from './lib/log'
import {getPRTargetBranchName, getPRBranchName} from './lib/github-common'
import {mergeBranchTo} from './lib/repo-api'
import {createPullRequest} from './utils/repo'
import {GIT_REF_HEADS_PREFIX} from './const/github'

/**
 * Remove refs/heads prefix from a branch name,
 * if it is presented in a branches name string.
 *
 * @export
 * @param {string} branchName
 * @returns {string}
 */
export function getBranchNameWithoutRefsPrefix(branchName: string): string {
  const regEx = new RegExp(`^[ ]*/*${GIT_REF_HEADS_PREFIX}`, 'i')
  const matching = branchName.match(regEx)
  return matching && matching[0]
    ? branchName.slice(matching[0].length)
    : branchName
}

/**
 * Convert semantic version string (e.g. "1.2.3") to a numeric representation.
 * This is used to compare versioned release branches like "release/1.2.3".
 * The result is calculated as: major * 100 + minor * 10 + patch.
 *
 * Examples:
 *   "1.0.0" -> 100
 *   "1.2.3" -> 123
 *   "2.1.0" -> 210
 *
 * @export
 * @param {string} version - version string in the format "X.Y.Z"
 * @returns {number} - numeric representation of the version
 */
export function versionStringToNumber(version: string): number {
  const parts = version.split('.').map(part => parseInt(part, 10) || 0)
  const [major, minor, patch] = [parts[0] || 0, parts[1] || 0, parts[2] || 0]

  return major * 100 + minor * 10 + patch
}

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
  const branchNameTrimmed = getBranchNameWithoutRefsPrefix(branchName).trim()
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
 * Determine the serial number of a release branch.
 * Supports both "release/RLS-001" and "release/1.0.1" formats.
 *
 * @export
 * @param {string} branchName
 * @param {string} releasePrefix
 * @param {string} releaseTaskPrefix
 * @returns {(number | undefined)}
 */
export function getBranchSerialNumber(
  branchName: string,
  releasePrefix: string,
  releaseTaskPrefix: string
): number | undefined {
  const nameWithoutPrefix = getBranchNameWithoutPrefix(branchName, releasePrefix)

  // Check for semantic version style like 1.0.1
  if (/^\d+\.\d+\.\d+$/.test(nameWithoutPrefix)) {
    return versionStringToNumber(nameWithoutPrefix)
  }

  // Fall back to old RLS-style logic
  return getBranchNameReleaseSerialNumber(branchName, releasePrefix, releaseTaskPrefix)
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
  const currentBranchSerialNumber = getBranchSerialNumber(
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
      const branchSerialNumber = getBranchSerialNumber(
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
  pushDescription: IGitHubPushDescription,
  contextEnv: IContextEnv,
  targetBranchName: string
): Promise<undefined | false> {
  const sourceBranchName = getPRBranchName(pushDescription)
  const result = await mergeBranchTo(
    octokit,
    pushDescription,
    targetBranchName,
    sourceBranchName
  )
  if (result === false) {
    // if a merge conflict
    debug(
      `The result of merging branch ${sourceBranchName} to the branch ${targetBranchName} is merge conflict`
    )
    await createPullRequest(
      octokit,
      pushDescription,
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {IContextEnv} contextEnv
 * @param {string[]} targetBranchesList
 * @param {boolean} [mergeOnlyNextRelease=false] - merge only to the next release. If there is no next release related was found do nothing
 * @returns {Promist<string[]>} - returns a brnaches related found
 * @throws {Error}
 * @exports
 */
export async function getBranchesRelatedToPD(
  pushDescription: IGitHubPushDescription,
  contextEnv: IContextEnv,
  releaseBranchesList: string[]
): Promise<string[]> {
  const pushDescriptionTargetBranch = getPRTargetBranchName(pushDescription)
  if (!pushDescriptionTargetBranch) {
    throw new Error('Failed to determine PR target branch')
  }
  debug(
    'mergeToRelated::start',
    'Target branch name',
    pushDescriptionTargetBranch,
    'releaseBranchesList:',
    releaseBranchesList,
    'contextEnv',
    contextEnv
  )
  const branchesNamesRelated = getBranchesWithUpperSerialNumber(
    pushDescriptionTargetBranch,
    releaseBranchesList,
    contextEnv.releaseBranchPrfix,
    contextEnv.releaseBranchTaskPrefix
  )

  return branchesNamesRelated
}

/**
 * returns target branch names
 * where to merge a source
 * branch
 *
 * @export
 * @param {string[]} releaseBranchesList
 * @returns {string[]}
 */
export function getTargetBranchesNames(
  releaseBranchesList: string[]
): string[] {
  return releaseBranchesList.length ? [releaseBranchesList[0]] : []
}

/**
 * Merge PR's branch to related releases branches.
 * Stop merging on first merge conflict
 *
 * @param {TGitHubOctokit} octokit
 * @param {IGitHubPushDescription} pushDescription
 * @param {IContextEnv} contextEnv
 * @param {string[]} branchesNamesRelated - will try to merge PR's branch to every branch in this list
 * @returns {Promist<void>} - returns a count of branches merged to and merge conflic status
 * @throws {Error}
 * @exports
 */
export async function mergeToBranches(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  contextEnv: IContextEnv,
  branchesNamesRelated: string[]
): Promise<void> {
  debug('mergeToRelated::branches related', branchesNamesRelated)
  const branchesNamesUniq = Array.from(new Set(branchesNamesRelated))
  const branchesRelatedCount = branchesNamesUniq.length
  let targetBranchIdx = 0

  if (!branchesRelatedCount) {
    debug('mergeToRelated::no branches related was found')
    return
  }
  const sourceBranchName = getPRBranchName(pushDescription)
  while (targetBranchIdx < branchesRelatedCount) {
    const branchName = branchesNamesUniq[targetBranchIdx]
    const result = await mergeSourceToBranch(
      octokit,
      pushDescription,
      contextEnv,
      branchName
    )
    if (result === false) {
      break
    } else {
      debug(
        `The result of merging branch ${sourceBranchName} to the branch ${branchName}:`,
        result
      )
    }
    targetBranchIdx += 1
  }
}
