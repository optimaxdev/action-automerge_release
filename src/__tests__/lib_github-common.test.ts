import { GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME } from './__mocks__/github-entities.mock';
import { getPRRepo, getPRRepoOwner, getPRBranchName } from '../lib/github-common';
import {
  getBranchRefPrefix,
  getPRTargetBranchName,
  getBranchNameByRefDescription
} from '../lib/github-common'
import {
  GITHUB_PULL_REQUEST_MOCK,
  GITHUB_BRANCH_REF_DESCRIPTION_MOCK
} from './__mocks__/github-entities.mock'

jest.mock('../const/github', () => ({
  GIT_HEADS_PREFIX: 'heads',
  GIT_REF_HEADS_PREFIX: 'refs/heads/'
}))

describe('lib github-common', () => {
  describe('getBranchRefPrefix', () => {
    it('Should return "heads/release/" for the branch prefix "release"', () => {
      const testBranchPrefix = 'release'
      const expected = 'heads/release/'
      expect(getBranchRefPrefix(testBranchPrefix)).toBe(expected)
    })
    it('Should return "heads/release/" for the branch prefix "/release/"', () => {
      const testBranchPrefix = '/release/'
      const expected = 'heads/release/'
      expect(getBranchRefPrefix(testBranchPrefix)).toBe(expected)
    })
    it('Should return "heads/release/" for the branch prefix "   /release   "', () => {
      const testBranchPrefix = '   /release   '
      const expected = 'heads/release/'
      expect(getBranchRefPrefix(testBranchPrefix)).toBe(expected)
    })
  })

  describe('getPRRepo', () => {
    it('Should return repository name', () => {
      expect(getPRRepo(GITHUB_PULL_REQUEST_MOCK as any)).toEqual('repo.name');
    })
  });

  describe('getPRRepoOwner', () => {
    it('Should return repository owner login', () => {
      expect(getPRRepoOwner(GITHUB_PULL_REQUEST_MOCK as any)).toEqual('repo.owner.login');
    })
  });

  describe('getPRBranchName', () => {
    it('Should return name of the PR\'s branch name', () => {
      expect(getPRBranchName(GITHUB_PULL_REQUEST_MOCK as any)).toEqual('branch_head_ref');
    })
  });

  describe('getPRTargetBranchName', () => {
    it('Should return target branch as "target_branch_name" for GITHUB_PULL_REQUEST_MOCK', () => {
      expect(getPRTargetBranchName(GITHUB_PULL_REQUEST_MOCK as any)).toBe(
        GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME
      )
    })
  })

  describe('getBranchNameByRefDescription', () => {
    it('Should return "branch_prefix/branch_name" for GITHUB_BRANCH_REF_DESCRIPTION_MOCK', () => {
      expect(
        getBranchNameByRefDescription(GITHUB_BRANCH_REF_DESCRIPTION_MOCK)
      ).toBe(GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME)
    })
  })
})
