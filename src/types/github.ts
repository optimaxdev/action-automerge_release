import * as gitHub from '@actions/github'

/**
 * Description of a merged branch(if triggered on push)
 * or a pull request (if triggered on pull request close).
 * If pushed not according to a pull request,
 * then base.ref === head.ref and equals to
 * the branch where commits were pushed.
 * 
 * @export
 * @interface IGitHubPushDescription
 */
export interface IGitHubPushDescription {
  base: {
    /**
     * Ref of the target branch where the source branch was merged to
     * e.g. 'release/rel-RLS11'
     *
     * @type {string}
     */
    ref: string
    repo: {
      /**
       * a name of the repository pushed to
       * e.g. 'repo_owner/repo_name'
       *
       * @type {string}
       */
      name: string
      /**
       * login of the repository owner
       * e.g. { login: 'repo_owner' }
       *
       * @type {{
       *         login: string
       *       }}
       */
      owner: {
        login: string
      }
    }
  }
  head: {
    /**
     * Ref of the source branch which was merged to the target branch
     * e.g. 'feature/feature_name' if triggered by a pull request merged
     * or 'release/rel-RLS11' if triggered by a push in the branch
     * named 'release/rel-RLS11'.
     *
     * @type {string}
     */
    ref: string
    /**
     * sha of the source branch latest commit
     *
     * @type {string}
     */
    sha: string
  }
}

/**
 * Octokit tool instance
 * */
export type TGitHubOctokit = ReturnType<typeof gitHub.getOctokit>
