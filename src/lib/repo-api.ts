import {inspect} from 'util';
import { IContextEnv } from "../types/context";
import { TGitHubPullRequest, TGitHubOctokit } from '../types/github';
import { TGitHubApiRestRefResponseData } from '../types/github-api';
import { debug } from './log';
import { getBranchRefPrefix, getBranchNameByRefDescription, getPRRepo, getPRRepoOwner } from './github-common';

/**
 * List branches via the GitHub API
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {number} [perPage=100] - how many items to fetch on one page
 * @param {number} [page=1] - requested page number
 * @param {string} [owner]
 * @throws {Error}
 * @returns {TGitHubApiRestRefResponseData} - descriptions of the branches
 */
export async function fetchBranchesList(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  branchPrefix: string,
  page: number = 1,
  perPage: number = 100,
): Promise<TGitHubApiRestRefResponseData> {
  const requestParams = {
    owner: getPRRepoOwner(pullRequest),
    repo: getPRRepo(pullRequest),
    ref: getBranchRefPrefix(branchPrefix),
    page,
    per_page: perPage
  };
  debug('listBranches::start::params', requestParams);
  const res = await octokit.git.listMatchingRefs(requestParams);
  debug('listBranches::::end', res);
  return res.data as TGitHubApiRestRefResponseData;
}

/**
 * Fetch all Release branches to this PR's 
 * target branch.
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {IContextEnv} contextEnv
 * @returns {(Promise<Array<string> | undefined>)}
 * @throws
 */
export async function fetchReleaseBranchesNamesByAPI(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  contextEnv: IContextEnv,
): Promise<string[]> {
  const perPage = 100;
  const branches: string[] = [];
  let pageIdx = 0;

  while (pageIdx += 1) {
    const branchesDescriptions = await fetchBranchesList(
      octokit,
      pullRequest,
      contextEnv.releaseBranchPrfix,
      pageIdx,
      perPage,
    )

    debug('fetched branches description branchesDescriptions', branchesDescriptions);
    branches.push(...branchesDescriptions.map(getBranchNameByRefDescription))
    if (branchesDescriptions.length < perPage) {
      return branches;
    }
  }
  return branches;
}

/**
 * Merge  sourceBranchName to the targetBranchName
 * https://developer.github.com/v3/repos/merging/#merge-a-branch
 * 
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {string} targetBranchName
 * @param {string} sourceBranchName
 * @returns {undefined | false} - return undefined if no error, false - if merge conflict
 * @throws - if any other error
 */
export async function mergeBranchTo(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  targetBranchName: string,
  sourceBranchName: string,
) { 
  const requestParams = {
    owner: getPRRepoOwner(pullRequest),
    repo: getPRRepo(pullRequest),
    base: targetBranchName,
    head: sourceBranchName,
  };
  debug('mergeBranchTo::start', 'targetBranchName', targetBranchName, 'sourceBranchName', sourceBranchName, 'params', requestParams);
  let response;
  try {
    response = await octokit.repos.merge(requestParams);
  } catch(err) {
    debug('mergeBranchTo::request-throw', err);
    response = err;
  }
  debug('mergeBranchTo::response', 'targetBranchName', targetBranchName, 'sourceBranchName', sourceBranchName, 'response', response);
  const {status, data} = response;
  if (status === 409) {
    debug('mergeBranchTo::merge-conflict', 'targetBranchName', targetBranchName, 'sourceBranchName', sourceBranchName);
    return false;
  }
  if (status === 204) {
    debug('mergeBranchTo::nothing-to-merge', 'targetBranchName', targetBranchName, 'sourceBranchName', sourceBranchName);
    return
  }
  if (status === 201) {
    debug('mergeBranchTo::successfully-merged', 'targetBranchName', targetBranchName, 'sourceBranchName', sourceBranchName);
    return
  }
  throw new Error(`
    Failed to merge branches.
    Status: ${status}.
    Data: 
    ${inspect(data)}.
  `);
}


/**
 * Check a pull request from sourceBranchName to the targetBranchName is exists
 * and has the open state
 * https://octokit.github.io/rest.js/v18#pulls
 * https://developer.github.com/v3/pulls/#list-pull-requests
 * 
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {string} targetBranchName - e.g. 'master'
 * @param {string} sourceBranchName - e.g. 'feature/TASK-11'
 * @returns {boolean} - true if a PR related to branches was found
 * @throws - if any other error
 */
export async function checkActivePRExists(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  targetBranchName: string,
  sourceBranchName: string,
): Promise<boolean> {
  const requestConf = {
    owner: getPRRepoOwner(pullRequest),
    repo: getPRRepo(pullRequest),
    base: targetBranchName,
    head: sourceBranchName,
    state: "open" as "open",
    per_page: 1,
    page: 1
  };
  debug('checkActivePRExists::start::conf:', requestConf);
  const response = await octokit.pulls.list(requestConf);
  debug('checkActivePRExists::response:', response);

  if (response.status === 200) {
    return response.data.length > 0;
  }
  debug('checkActivePRExists::failed::unknown-status-code', response.status);
  throw new Error(`checkActivePRExists::Unknown status code ${response.status}`);
}

/**
 * Create a new pull request from sourceBranchName to the targetBranchName
 * https://octokit.github.io/rest.js/v18#pulls
 * https://developer.github.com/v3/pulls/#create-a-pull-request
 * 
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {string} targetBranchName - e.g. 'master'
 * @param {string} sourceBranchName - e.g. 'feature/TASK-11'
 * @returns {number} - returns a number of pull request created
 * @throws - if any other error
 */
export async function createNewPR(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  targetBranchName: string,
  sourceBranchName: string,
): Promise<number> {
  const requestConf = {
    owner: getPRRepoOwner(pullRequest),
    repo: getPRRepo(pullRequest),
    base: targetBranchName,
    head: sourceBranchName,
    title: `Merge release branch ${sourceBranchName} to the release branch ${targetBranchName}`,
    draft: false,
    maintainer_can_modify: true,
  };
  debug('createNewPR::start::conf:', requestConf);
  const response = await octokit.pulls.create(requestConf);
  debug('createNewPR::response:', response);

  if (response.status === 201) {
    // succesfully created
    return Number(response.data.number);
  }
  debug('createNewPR::failed::unknown-status-code', response.status);
  throw new Error(`createNewPR::Unknown status code ${response.status}`);
}


/**
 * Add a label or multiple labels for the pr
 * by it's number.
 * If the label is not exists it will be created automatically.
 * https://octokit.github.io/rest.js/v18#pulls-create
 * https://developer.github.com/v3/issues/labels/#add-labels-to-an-issue 
 * 
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {TGitHubPullRequest} pullRequest
 * @param {number} prNumber
 * @param {(string | string[])} label - one or more labels to add
 * @returns {Promise<void>} - return nothing if successfully added
 * @throws - if unknown code is returned
 */
export async function addLabelForPr(
  octokit: TGitHubOctokit,
  pullRequest: TGitHubPullRequest,
  prNumber: number,
  label: string | string[],
): Promise<void> {
  const requestConf = {
    owner: getPRRepoOwner(pullRequest),
    repo: getPRRepo(pullRequest),
    issue_number: prNumber,
    labels: Array.isArray(label) ? label : [label],
  };
  debug('addLabelForPr::start::conf:', requestConf);
  const response = await octokit.issues.addLabels(requestConf);
  debug('addLabelForPr::response:', response);

  if (response.status === 200) {
    // succesfully created
    return;
  }
  debug('addLabelForPr::failed::unknown-status-code', response.status);
  throw new Error(`addLabelForPr::Unknown status code ${response.status}`);
}

// octokit.issues.addLabels({
//   owner,
//   repo,
//   issue_number,
//   labels,
// });