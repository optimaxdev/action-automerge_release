import { GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME } from './__mocks__/github-entities.mock';
import { getPRRepo, getPRRepoOwner, getPRBranchName, getBranchRef, getBranchNameByRefString } from '../lib/github-common';
import {
  getBranchRefPrefix,
  getPRTargetBranchName,
  getBranchNameByRefDescription
} from '../lib/github-common'
import {
  GITHUB_PUSH_DESCRIPTION_MOCK,
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
      expect(getPRRepo(GITHUB_PUSH_DESCRIPTION_MOCK as any)).toEqual('repository_name');
    })
  });

  describe('getPRRepoOwner', () => {
    it('Should return repository owner login', () => {
      expect(getPRRepoOwner(GITHUB_PUSH_DESCRIPTION_MOCK as any)).toEqual('owner_login');
    })
  });

  describe('getPRBranchName', () => {
    it('Should return name of the PR\'s branch name', () => {
      expect(getPRBranchName(GITHUB_PUSH_DESCRIPTION_MOCK as any)).toEqual(GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME);
    })
  });

  describe('getPRTargetBranchName', () => {
    it('Should return target branch as "target_branch_name" for GITHUB_PUSH_DESCRIPTION_MOCK', () => {
      expect(getPRTargetBranchName(GITHUB_PUSH_DESCRIPTION_MOCK as any)).toBe(
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

  describe('getBranchNameByRefString', () => {
    it(`Should return "branch_prefix/branch_name" for "refs/heads/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}"`, () => {
      expect(
        getBranchNameByRefString(`refs/heads/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}`)
      ).toBe(GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME)
    })
  })

  describe('getBranchRef', () => {
    it('Should return branch name joined with the refs prefix', () => {
      const branchName = 'test/branch';
      const expectedRefName = `refs/heads/${branchName}`;
      expect(getBranchRef(branchName)).toBe(expectedRefName);
    })
    it('Should return branch name joined with the refs prefix ended with the "/", without the slash at the end', () => {
      const branchName = 'test/branch';
      const expectedRefName = `refs/heads/${branchName}`;
      expect(getBranchRef(`${branchName}/`)).toBe(expectedRefName);
    })
    it('Should return branch name joined with the refs prefix without doubling of slashes', () => {
      const branchName = '//test//branch//';
      const expectedRefName = `refs/heads/test/branch`;
      expect(getBranchRef(`${branchName}/`)).toBe(expectedRefName);
    })
  })
})
