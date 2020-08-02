"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initContextEnv = void 0;
const core_1 = __importDefault(require("@actions/core"));
const github_1 = __importDefault(require("@actions/github"));
const log_1 = require("./lib/log");
/**
 * Initialize the context values
 *
 * @returns {IContextEnv}
 */
exports.initContextEnv = () => {
    return {
        token: core_1.default.getInput('token', { required: true }),
        releaseBranchTaskPrefix: core_1.default.getInput('releaseBranchTaskPrefix', {
            required: false
        }),
        mainBranchName: core_1.default.getInput('mainBranchName', { required: false }),
        branchFetchingStrategy: core_1.default.getInput('branchFetchingStrategy', {
            required: false
        }),
        releaseBranchPrfix: core_1.default.getInput('releaseBranchPrfix', { required: false }),
        remoteName: core_1.default.getInput('remoteName', { required: false })
    };
};
/**
 * Prepare the action running to work
 * and return the common values
 * which are necessary to work with.
 *
 * @export
 * @returns {IInitReturnValue | undefined} - returns "undefined" if there is nothind to do
 * @throws
 */
function init() {
    const context = github_1.default.context;
    if (!context) {
        throw new Error('Failed to get GitHub context');
    }
    const { payload: { pull_request } } = context;
    // Get pull request related to this action
    if (!pull_request) {
        throw new Error('The current pull request is not available in the github context');
    }
    const { changed_files } = pull_request;
    if (!changed_files) {
        console.log('There are no files changed in the pull request');
        return;
    }
    const contextEnv = exports.initContextEnv();
    log_1.debug('init with context env', contextEnv);
    const { token: gitHubToken } = contextEnv;
    let octokit;
    // initialize the Octokit instance
    try {
        octokit = github_1.default.getOctokit(gitHubToken);
    }
    catch (err) {
        console.log(err);
        throw new Error('Failed to connect to the Octokit');
    }
    return {
        pullRequest: pull_request,
        octokit,
        contextEnv
    };
}
exports.default = init;
