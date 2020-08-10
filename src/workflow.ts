import * as core from '@actions/core'
import {init} from './init'
import {fetchBranchesListGraphQL} from './lib/repo-api'
import {debug, error} from './lib/log'
import {getBranchRef} from './lib/github-common'
import {
  getBranchesRelatedToPD,
  mergeSourceToBranch,
  mergeToBranches,
  getTargetBranchesNames,
} from './merge-to-release'

export async function run(): Promise<void> {
  try {
    core.debug(new Date().toTimeString())

    const initResult = init()

    if (!initResult) {
      return
    }

    const {pushDescription, octokit, contextEnv} = initResult
    const branchesList = await fetchBranchesListGraphQL(
      octokit,
      `${getBranchRef(contextEnv.releaseBranchPrfix)}/`,
      contextEnv.releaseBranchTaskPrefix,
      100
    )
    debug('Fetched branches', branchesList)
    if (!branchesList.length) {
      throw new Error('No branches were found')
    }

    const relatedBrancheslist = await getBranchesRelatedToPD(
      pushDescription,
      contextEnv,
      branchesList
    )
    debug('Related branches', relatedBrancheslist)
    const targetBranches = getTargetBranchesNames(relatedBrancheslist)
    if (!targetBranches.length) {
      // should merge to the main branch if there is no related branches exists
      debug('Merge to the main branch', contextEnv.mainBranchName)
      await mergeSourceToBranch(
        octokit,
        pushDescription,
        contextEnv,
        contextEnv.mainBranchName
      )
      return
    }
    debug('Merge to related branches', targetBranches)
    // should merge to related releases
    await mergeToBranches(octokit, pushDescription, contextEnv, targetBranches)
  } catch (err) {
    error(err)
    core.setFailed(err.message)
  }
}
