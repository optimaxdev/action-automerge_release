import {Endpoints} from '@octokit/types'

export type TGitHubApiRestRefResponseData =
  Endpoints['GET /repos/{owner}/{repo}/git/matching-refs/{ref}']['response']['data']
