import path from 'path';
import { IGitHubPushDescription } from '../types/github';
import { TArrayElement } from '../types/helpers';
import { TGitHubApiRestRefResponseData } from '../types/github-api';
import { GIT_REF_HEADS_PREFIX, GIT_HEADS_PREFIX } from '../const/github';

/**
 * Get a name of a PR's branch
 *
 * @param {IGitHubPushDescription} pushDescription
 * @returns {string} - A name of a branch from which the PR was created
 */
export function getPRBranchName(
    pushDescription: IGitHubPushDescription
): string {
    return pushDescription.head.ref;
}

/**
 * Get a name of PR's repository
 *
 * @export
 * @param {IGitHubPushDescription} pushDescription
 * @returns {string}
 */
export function getPRRepo(
    pushDescription: IGitHubPushDescription
): string {
    return pushDescription.base.repo.name;
}

/**
 * Get a login of PR's repository owner
 *
 * @export
 * @param {IGitHubPushDescription} pushDescription
 * @returns {string}
 */
export function getPRRepoOwner(
    pushDescription: IGitHubPushDescription
): string {
    return pushDescription.base.repo.owner.login
}

/**
 * Get a name of a target branch for the PR
 *
 * @param {IGitHubPushDescription} pushDescription
 * @returns {string} - A name of a target branch the PR
 */
export function getPRTargetBranchName(
    pushDescription: IGitHubPushDescription
): string {
    return pushDescription.base.ref;
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
