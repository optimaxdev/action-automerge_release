import {inspect} from 'util';
import path from 'path';
import { IContextEnv } from "../types/context";
import { IGitHubPushDescription, TGitHubOctokit } from '../types/github';
import { TGitHubApiRestRefResponseData } from '../types/github-api';
import { debug } from './log';
import { getBranchRefPrefix, getBranchNameByRefDescription, getPRRepo, getPRRepoOwner, getBranchRef, getBranchNameByRefString, getBranchHeadsRefPrefix } from './github-common';

/**
 * List branches via the GitHub API
 * https://developer.github.com/v3/git/refs/#list-matching-references
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {IGitHubPushDescription} pushDescription
 * @param {number} [perPage=100] - how many items to fetch on one page
 * @param {number} [page=1] - requested page number
 * @param {string} [owner]
 * @throws {Error}
 * @returns {TGitHubApiRestRefResponseData} - descriptions of the branches
 */
export async function fetchBranchesList(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  branchPrefix: string,
  page: number = 1,
  perPage: number = 100,
): Promise<TGitHubApiRestRefResponseData> {
  const requestParams = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {IContextEnv} contextEnv
 * @returns {(Promise<Array<string> | undefined>)}
 * @throws
 */
export async function fetchReleaseBranchesNamesByAPI(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  contextEnv: IContextEnv,
): Promise<string[]> {
  const perPage = 100;
  const branches: string[] = [];
  let pageIdx = 0;

  while (pageIdx += 1) {
    const branchesDescriptions = await fetchBranchesList(
      octokit,
      pushDescription,
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {string} targetBranchName
 * @param {string} sourceBranchName
 * @returns {undefined | false} - return undefined if no error, false - if merge conflict
 * @throws - if any other error
 */
export async function mergeBranchTo(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  targetBranchName: string,
  sourceBranchName: string,
) { 
  const requestParams = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {string} targetBranchName - e.g. 'master'
 * @param {string} sourceBranchName - e.g. 'feature/TASK-11'
 * @returns {boolean} - true if a PR related to branches was found
 * @throws - if any other error
 */
export async function checkActivePRExists(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  targetBranchName: string,
  sourceBranchName: string,
): Promise<boolean> {
  const requestConf = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {string} targetBranchName - e.g. 'master'
 * @param {string} sourceBranchName - e.g. 'feature/TASK-11'
 * @returns {number} - returns a number of pull request created
 * @throws - if any other error
 */
export async function createNewPR(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  targetBranchName: string,
  sourceBranchName: string,
): Promise<number> {
  const requestConf = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
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
 * @param {IGitHubPushDescription} pushDescription
 * @param {number} prNumber
 * @param {(string | string[])} label - one or more labels to add
 * @returns {Promise<void>} - return nothing if successfully added
 * @throws - if unknown code is returned
 */
export async function addLabelForPr(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  prNumber: number,
  label: string | string[],
): Promise<void> {
  const requestConf = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
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

/**
 * Create a new branch from branch wich
 * has the latest commit sha
 * https://developer.github.com/v3/git/refs/#create-a-reference
 * 
 * 
 * @export
 * @param {string} branchName - new branche's name
 * @param {string} fromBranchCommitSha - sha of the latest commit
 * @returns {Promise<string>} - returns a new branche's name
 * @throws - throw on a request failed or if reponses code is not equal to the 201 (CREATED)
 */
export async function createBranch(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  branchName: string,
  fromBranchCommitSha: string,
): Promise<string> {
  const requestConf = {
    owner: getPRRepoOwner(pushDescription),
    repo: getPRRepo(pushDescription),
    ref: getBranchRef(branchName),
    sha: fromBranchCommitSha,
  };
  debug('createBranch::start::conf:', requestConf);
  const response = await octokit.git.createRef(requestConf);
  debug('createBranch::end::response:', response);
  if (response.status !== 201) {
    throw new Error('Unknown status code returned from the server');
  }
  return getBranchNameByRefString(response.data.ref);
}

/**
 * List branches via the GitHub GraphQL API
 * https://developer.github.com/v3/git/refs/#list-matching-references
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {string} repoName - e.g "test_github_actions"
 * @param {string} repoName - e.g "optimaxdev"
 * @param {string} releaseBranchRefPrfix - e.g "refs/heads/release"
 * @param {string} releaseBranchTaskPrefix - e.g. "REL-"
 * @param {number} first - how many items to fetch
 * @throws {Error}
 * @returns {TGitHubApiRestRefResponseData} - descriptions of the branches
 */
export async function fetchBranchesListGraphQL(
  octokit: TGitHubOctokit,
  repoName: string,
  repoOwner: string,
  releaseBranchRefPrfix: string,
  releaseBranchTaskPrefix: string,
  first: number = 1,
): Promise<{
  repository: {
    refs: {
      edges: Array<{ node: {name: string} }>
    }
  }
}> {
  const queryText = `
    {
      repository(name: "${repoName}", owner: "${repoOwner}") {
        refs(refPrefix: "${releaseBranchRefPrfix}", orderBy: {field: TAG_COMMIT_DATE, direction: DESC}, first: ${first}, direction: DESC, query: "${releaseBranchTaskPrefix}") {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  `;
  debug('listBranches::start::query', queryText);
  return await octokit.graphql(queryText);
}

/**
 *
 *
 * @export
 * @param {TGitHubOctokit} octokit
 * @param {IGitHubPushDescription} pushDescription
 * @param {IContextEnv} contextEnv
 * @returns {Promise<string[]>}
 */
export async function fetchRelatedBranchesListGraphQL(
  octokit: TGitHubOctokit,
  pushDescription: IGitHubPushDescription,
  contextEnv: IContextEnv,
): Promise<string[]> {
  debug('fetchRelatedBranchesListGraphQL::start');
  const {releaseBranchPrfix} = contextEnv;
  const result = await fetchBranchesListGraphQL(
    octokit,
    getPRRepo(pushDescription),
    getPRRepoOwner(pushDescription),
    getBranchHeadsRefPrefix(releaseBranchPrfix),
    contextEnv.releaseBranchTaskPrefix,
    100
  )
  debug('fetchRelatedBranchesListGraphQL::result', result);
  const relatedBranchesList = result.repository.refs.edges.map(({ node }: { node: { name: string } }) => path.join(releaseBranchPrfix, node.name));
  debug('fetchRelatedBranchesListGraphQL::relatedBranchesList', relatedBranchesList);
  return relatedBranchesList;
} 