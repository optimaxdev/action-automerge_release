import path from 'path';
import { TGitHubPullRequest } from '../types/github';
import { TArrayElement } from '../types/helpers';
import { TGitHubApiRestRefResponseData } from '../types/github-api';
import { GIT_REF_HEADS_PREFIX, GIT_HEADS_PREFIX } from '../const/github';

/**
 * Get a name of a PR's branch
 *
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string} - A name of a branch from which the PR was created
 */
export function getPRBranchName(
    pullRequest: TGitHubPullRequest
): string {
    return pullRequest.head.ref;
}

/**
 * Get a name of PR's repository
 *
 * @export
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string}
 */
export function getPRRepo(
    pullRequest: TGitHubPullRequest
): string {
    return pullRequest.base.repo.name;
}

/**
 * Get a login of PR's repository owner
 *
 * @export
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string}
 */
export function getPRRepoOwner(
    pullRequest: TGitHubPullRequest
): string {
    return pullRequest.base.repo.owner.login
}

/**
 * Get a name of a target branch for the PR
 *
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string} - A name of a target branch the PR
 */
export function getPRTargetBranchName(
    pullRequest: TGitHubPullRequest
): string {
    return pullRequest.base.ref;
}

/**
 * Return branch name by a branch description
 *
 * @param {TArrayElement<TGitHubApiRestRefResponseData>} refDescription
 * @returns {string}
 */
export function getBranchNameByRefDescription(refDescription: TArrayElement<TGitHubApiRestRefResponseData>): string {
    return refDescription.ref.trim().slice(GIT_REF_HEADS_PREFIX.length).trim();
}
  /**
   * Return full reference to a branch's prefix
   *
   * @export
   * @param {string} branchPrefix
   * @returns {string}
   */
  export function getBranchRefPrefix(branchPrefix: string): string {
    return path.join(GIT_HEADS_PREFIX, branchPrefix.trim(), '/');
  } 
