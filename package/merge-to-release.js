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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeToRelated = exports.getBranchNameReleaseSerialNumber = exports.getBranchNameWithoutPrefix = void 0;
const path_1 = __importDefault(require("path"));
const log_1 = require("./lib/log");
const github_common_1 = require("./lib/github-common");
function getBranchNameWithoutPrefix(branchName, releasePrefix) {
    const branchNameTrimmed = branchName.trim();
    const releasePathTrimmed = branchName.includes('/')
        ? path_1.default.join(releasePrefix.trim(), '/')
        : releasePrefix.trim();
    return branchNameTrimmed.slice(releasePathTrimmed.length).trim();
}
exports.getBranchNameWithoutPrefix = getBranchNameWithoutPrefix;
/**
 * Get a serial number of the release related
 * to the branch name.
 *
 * @export
 * @param {string} branchName
 * @param {string} releasePrefix
 * @param {string} releaseTaskPrefix
 * @returns {(number | undefined)} - return undefined if the branch name have no the releaseTaskPrefix.
 */
function getBranchNameReleaseSerialNumber(branchName, releasePrefix, releaseTaskPrefix) {
    const releaseTaskPrefixTrimmed = releaseTaskPrefix.trim();
    const branchNameWithoutPrefix = getBranchNameWithoutPrefix(branchName, releasePrefix);
    if (!branchNameWithoutPrefix.includes(releaseTaskPrefixTrimmed)) {
        return;
    }
    const branchNameWithoutTaskPrefix = branchNameWithoutPrefix
        .slice(releaseTaskPrefixTrimmed.length)
        .trim();
    const [releaseNumberString] = branchNameWithoutTaskPrefix.match(/^\d+/s) || [];
    const releaseNumber = Number(releaseNumberString);
    return isNaN(releaseNumber) ? undefined : releaseNumber;
}
exports.getBranchNameReleaseSerialNumber = getBranchNameReleaseSerialNumber;
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
function mergeToRelated(octokit, pullRequest, contextEnv, releaseBranchesList) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!releaseBranchesList.length) {
            return;
        }
        const pullRequestTargetBranch = github_common_1.getPRTargetBranchName(pullRequest);
        if (!pullRequestTargetBranch) {
            throw new Error('Failed to determine PR target branch');
        }
        log_1.debug('mergeToRelated::start', 'Target branch name', pullRequestTargetBranch, 'releaseBranchesList:', releaseBranchesList);
    });
}
exports.mergeToRelated = mergeToRelated;
