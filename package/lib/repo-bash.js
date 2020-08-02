"use strict";
/** DEPRECATED */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchReleaseBranchesNamesRelatedByBash = void 0;
const parseBranchList = (branchesList) => branchesList.trim().replace(/  /g, ' ').replace(/origin/g, '').split('').filter(branch => !!branch);
exports.fetchReleaseBranchesNamesRelatedByBash = () => {
    const branchesNamesFromEnv = process.env.BRANCHES_NAMES;
    if (!branchesNamesFromEnv) {
        return [];
    }
    return parseBranchList(branchesNamesFromEnv);
};
