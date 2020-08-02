import {GitListMatchingRefsResponseData, OctokitResponse} from '@octokit/types'

export type TGitHubApiRestRefResponse = OctokitResponse<
  GitListMatchingRefsResponseData
>

export type TGitHubApiRestRefResponseData = OctokitResponse<
  GitListMatchingRefsResponseData
>['data']
