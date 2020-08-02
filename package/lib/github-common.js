"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchRefPrefix = exports.getBranchNameByRefDescription = exports.getPRTargetBranchName = exports.getPRBranchName = void 0;
const path_1 = __importDefault(require("path"));
const github_1 = require("../const/github");
/**
 * Get a name of a PR's branch
 *
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string} - A name of a branch from which the PR was created
 */
function getPRBranchName(pullRequest) {
    return pullRequest.target.ref;
}
exports.getPRBranchName = getPRBranchName;
/**
 * Get a name of a target branch for the PR
 *
 * @param {TGitHubPullRequest} pullRequest
 * @returns {string} - A name of a target branch the PR
 */
function getPRTargetBranchName(pullRequest) {
    return pullRequest.base.ref;
}
exports.getPRTargetBranchName = getPRTargetBranchName;
/**
 * Return branch name by a branch description
 *
 * @param {TArrayElement<TGitHubApiRestRefResponseData>} refDescription
 * @returns {string}
 */
function getBranchNameByRefDescription(refDescription) {
    return refDescription.ref.trim().slice(github_1.GIT_REF_HEADS_PREFIX.length).trim();
}
exports.getBranchNameByRefDescription = getBranchNameByRefDescription;
/**
 * Return full reference to a branch's prefix
 *
 * @export
 * @param {string} branchPrefix
 * @returns {string}
 */
function getBranchRefPrefix(branchPrefix) {
    return path_1.default.join(github_1.GIT_HEADS_PREFIX, branchPrefix.trim(), '/');
}
exports.getBranchRefPrefix = getBranchRefPrefix;
