import {TArrayElement} from '../../types/helpers'
import {TGitHubApiRestRefResponseData} from '../../types/github-api'

export const GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX = 'branch_prefix';

export const GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME = 'branch_name';

export const GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION = '0123';

export const GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;

export const GITHUB_PULL_REQUEST_MOCK = {
  base: {
    ref: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME,
    repo: {
      name: 'repo.name',
      owner: {
        login: 'repo.owner.login',
      }
    }
  },
  head: {
    ref: 'branch_head_ref'
  },
  changed_files: 1
}

export const GITHUB_BRANCH_REF_DESCRIPTION_MOCK = {
  ref: `refs/heads/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}`,
  node_id: 'node_id',
  url: 'branch_url',
  object: {
    type: 'head_type',
    sha: 'head_commit_sha',
    url: 'url'
  }
} as TArrayElement<TGitHubApiRestRefResponseData>

export const GITHUB_CONTEXT_MOCK = {
  payload: {
    pull_request: GITHUB_PULL_REQUEST_MOCK,
  }
}

export const BRANCHES_REFS_LIST_MOCK = ({
  data: [
    GITHUB_BRANCH_REF_DESCRIPTION_MOCK,
    {
      ...GITHUB_BRANCH_REF_DESCRIPTION_MOCK,
      ref: `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK.ref}1`
    },
    {
      ...GITHUB_BRANCH_REF_DESCRIPTION_MOCK,
      ref: `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK.ref}2`
    }
  ]
});