import * as core from '@actions/core'
import {init} from './init'
import {fetchReleaseBranchesNamesByAPI} from './lib/repo-api'
import {debug, error} from './lib/log'
import {mergeSourceToBranch, mergeToRelated} from './merge-to-release'

export async function run(): Promise<void> {
  try {
    core.debug(new Date().toTimeString())

    const initResult = init()

    if (!initResult) {
      return
    }

    const {pullRequest, octokit, contextEnv} = initResult
    const branchesList = await fetchReleaseBranchesNamesByAPI(
      octokit,
      pullRequest,
      contextEnv
    )
    debug('Fetched branches', branchesList)
    if (!branchesList.length) {
      throw new Error('No branches were found')
    }
    // should merge to the main branch
    debug('Merge to the main branch', contextEnv.mainBranchName)
    await mergeSourceToBranch(
      octokit,
      pullRequest,
      contextEnv,
      contextEnv.mainBranchName
    )
    debug('Merge to related branches', branchesList)
    // should merge to related releases
    await mergeToRelated(octokit, pullRequest, contextEnv, branchesList)
  } catch (err) {
    error(err)
    core.setFailed(err.message)
  }
}
