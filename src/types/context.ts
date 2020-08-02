/**
 * Context values for action execution
 *
 * @export
 * @interface IContext
 */
export interface IContextEnv {
  /**
   * GitHub token
   *
   * @type {string}
   * @memberof IContext
   */
  token: string
  /**
   * Label which will be added to a PR created automatically
   * on a merge conflict. It will be created automatically if
   * not exists
   *
   * @type {string}
   * @memberof IContextEnv
   */
  automergePrLabel: string
  /**
   * Which strategy must be used for fetching a list
   * of branches related to this pull request,
   * some of them must be updated with PR's branch.
   *
   * @type {string} - 'api' or 'bash'
   * @memberof IContext
   */
  branchFetchingStrategy: string
  /**
   * Name of a prefix for release branches
   *
   * @type {string}
   * @memberof IContext
   */
  releaseBranchPrfix: string
  /**
   * Prefix of release branch task, before numbers. 
   * E.g. for the name "release/RLS-11" string "RLS-" is the prefix
   *
   * @type {string}
   * @memberof IContextEnv
   */
  releaseBranchTaskPrefix: string
  /**
   * Name of the git remote
   *
   * @type {string}
   * @memberof IContext
   */
  remoteName: string
  /**
   * Name of the main development branch.
   * It will be updated with the PR's branch
   *
   * @type {string}
   * @memberof IContexts
   */
  mainBranchName: string
}
