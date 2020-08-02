/** DEPRECATED */

const parseBranchList = (branchesList: string): string[] =>
  branchesList.trim().replace(/  /g, ' ').replace(/origin/g, '').split('').filter(branch => !!branch)

export const fetchReleaseBranchesNamesRelatedByBash = (): string[] => {
    const branchesNamesFromEnv = process.env.BRANCHES_NAMES;

    if (!branchesNamesFromEnv) {
        return [];
    }
    return parseBranchList(branchesNamesFromEnv);
}