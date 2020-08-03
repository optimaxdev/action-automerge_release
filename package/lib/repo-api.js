"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchReleaseBranchesNamesByAPI = exports.fetchBranchesList = void 0;
const log_1 = require("./log");
const github_common_1 = require("./github-common");
/**
 * List branches via the GitHub API
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
function fetchBranchesList(octokit, pushDescription, branchPrefix, page = 1, perPage = 100) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestParams = {
            owner: pushDescription.base.repo.owner.login,
            repo: pushDescription.base.repo.name,
            ref: github_common_1.getBranchRefPrefix(branchPrefix),
            page,
            per_page: perPage
        };
        log_1.debug('listBranches::owner:start::params', requestParams);
        const res = yield octokit.git.listMatchingRefs(requestParams);
        log_1.debug('listBranches::owner::end', res);
        return res.data;
    });
}
exports.fetchBranchesList = fetchBranchesList;
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
function fetchReleaseBranchesNamesByAPI(octokit, pushDescription, contextEnv) {
    return __awaiter(this, void 0, void 0, function* () {
        const perPage = 100;
        const branches = [];
        let pageIdx = 0;
        while (pageIdx += 1) {
            const branchesDescriptions = yield fetchBranchesList(octokit, pushDescription, contextEnv.releaseBranchPrfix, pageIdx, perPage);
            log_1.debug('fetched branches description branchesDescriptions', branchesDescriptions);
            branches.push(...branchesDescriptions.map(github_common_1.getBranchNameByRefDescription));
            if (branchesDescriptions.length < perPage) {
                return branches;
            }
        }
        return branches;
    });
}
exports.fetchReleaseBranchesNamesByAPI = fetchReleaseBranchesNamesByAPI;
// /**
//  * Get pull request details by GitHub REST Api
//  *
//  * @export
//  * @param {ReturnType<typeof gitHub.getOctokit>} octokit
//  * @param {Exclude<typeof gitHub.context.payload.pull_request, undefined>} pushDescription
//  * @returns {PullsGetResponseData}
//  */
// export async function getpushDescription(
//     octokit: ReturnType<typeof gitHub.getOctokit>,
//     pushDescription: Exclude<typeof gitHub.context.payload.pull_request, undefined>,
// ) {
//     /** https://raw.githubusercontent.com/pascalgn/automerge-action/master/lib/merge.js */
//     core.debug("Getting latest PR data...");
//     const { data: pr } = await octokit.pulls.get({
//       owner: pushDescription.base.repo.owner.login,
//       repo: pushDescription.base.repo.name,
//       pull_number: pushDescription.number
//     });
//     return pr;
//   }
// /**
//  * Merge pull request to the target repository.
//  *
//  * @export
//  * @param {TGitHubOctokit} octokit
//  * @param {IGitHubPushDescription} pushDescription
//  * @param {("merge" | "squash" | "rebase")} [mergeMethod]
//  * @param {string} [commitMessage]
//  * @throws {Error}
//  * @returns {void}
//  */
// export async function mergepushDescription(
//   octokit: TGitHubOctokit,
//   pushDescription: IGitHubPushDescription,
//   mergeMethod?: "merge" | "squash" | "rebase",
//   commitMessage?: string
// ) {
//   const {
//     head: { sha }
//   } = pushDescription;
//   core.debug(`mergepushDescription::head::${sha}::start`);
//   await octokit.pulls.merge({
//       owner: pushDescription.base.repo.owner.login,
//       repo: pushDescription.base.repo.name,
//       pull_number: pushDescription.number,
//       commit_title: commitMessage,
//       commit_message: "",
//       sha,
//       merge_method: mergeMethod
//   });
//   core.debug(`mergepushDescription::head::${sha}::success`);
// }
