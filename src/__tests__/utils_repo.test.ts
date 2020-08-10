import { createpushDescriptionIfNotAlreadyExists, getBranchNameForTargetBranchAutomergeFailed } from '../utils/repo';
import { GITHUB_PUSH_DESCRIPTION_MOCK, BRANCHES_REFS_LIST_MOCK } from './__mocks__/github-entities.mock';
import { TGitHubOctokit, IGitHubPushDescription } from '../types/github';

jest.mock('../lib/repo-api');

describe('utils repo', () => {
  let octokit: TGitHubOctokit;
  let pushDescription: IGitHubPushDescription;

    beforeEach(() => {
      octokit = {
        git: {
          listMatchingRefs: jest.fn(() => ({...BRANCHES_REFS_LIST_MOCK}))
        },
        repos: {
          merge: jest.fn(() => ({ status: 201 }))
        },
        pulls: {
          list: jest.fn(() => ({ status: 200, data: [] })),
          create: jest.fn(() => ({ status: 201, data: { number: 11 } }))
        },
        issues: {
          addLabels: jest.fn(() => ({ status: 200 }))
        }
      } as unknown as TGitHubOctokit
      pushDescription = {...GITHUB_PUSH_DESCRIPTION_MOCK} as unknown as IGitHubPushDescription
    })

    describe('getBranchNameForTargetBranchAutomergeFailed', () => {
      it('should return string with the resulted target branch name', () => {
        const sourceBranchName = 'sourceBranchName'
        const targetBranchName = 'targetBranchName';
        expect(getBranchNameForTargetBranchAutomergeFailed(targetBranchName, sourceBranchName)).toBe(`automerge_${sourceBranchName}_to_${targetBranchName}`);
      })

      it('should trims a branch name', () => {
        const sourceBranchName = '    sourceBranchName   '
        const targetBranchName = '   targetBranchName    ';
        expect(getBranchNameForTargetBranchAutomergeFailed(targetBranchName, sourceBranchName)).toBe(`automerge_${sourceBranchName.trim()}_to_${targetBranchName.trim()}`);
      })
    })

  describe('createpushDescriptionIfNotAlreadyExists', () => {
    it('Should throw if createBranch throws', async () => {
      const {createBranch} = require('../lib/repo-api')
      createBranch.mockClear();
      createBranch.mockImplementation(async () => {
        throw new Error('Failed')
      })
      expect(createBranch).toBeCalledTimes(0)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(createBranch).toBeCalledTimes(1)
    })
    it('Should call createBranch failed', async () => {
      const {createBranch, createNewPR} = require('../lib/repo-api')
      const expectedBranchName = 'expectedBranchName';

      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      try {
        await createpushDescriptionIfNotAlreadyExists(
          octokit,
          pushDescription,
          'target_branch',
          'source_branch',
          'automergePrLabel'
        );
      } catch {}
      expect(createNewPR).toBeCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        expectedBranchName,
      )
    })
    it('Should create a new PR if a PR related not exists ', async () => {
      const {createBranch, createNewPR, addLabelForPr} = require('../lib/repo-api')
      const expectedBranchName = 'expectedBranchName';

      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).rejects.toThrow();
      expect(createNewPR).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        expectedBranchName,
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should rejects right after thrown on PR creation', async () => {
      const {createBranch, createNewPR, addLabelForPr} = require('../lib/repo-api');
      const expectedBranchName = 'createBranch_created_branchName';
      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      createNewPR.mockImplementation(()=> {
        throw new Error('Failed')
      })
      expect(() => createNewPR(
        octokit,
        pushDescription,
        'target_branch',
        expectedBranchName,
      )).toThrow();
      expect(createNewPR).toBeCalledTimes(1)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(createNewPR).toBeCalledTimes(2)
      expect(createNewPR).toHaveBeenLastCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        expectedBranchName,
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should rejects if not a numeric PR number returned after creation', async () => {
      const {createBranch, createNewPR, addLabelForPr} = require('../lib/repo-api');
      const expectedBranchName = 'createBranch_created_branchName';
      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      createNewPR.mockReturnValue("1")
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(createNewPR).toBeCalledTimes(1)
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should not create a label for PR created if a label is not provided', async () => {
      const {createBranch, createNewPR, addLabelForPr} = require('../lib/repo-api');
      const expectedBranchName = 'createBranch_created_branchName';
      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      createNewPR.mockReturnValue(1)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).resolves.toBe(undefined);
      expect(createNewPR).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        expectedBranchName,
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should create a label for PR created if a is passed in arguments', async () => {
      const {createBranch, createNewPR, addLabelForPr} = require('../lib/repo-api');
      const expectedBranchName = 'createBranch_created_branchName';
      createBranch.mockImplementation(() => {
        return expectedBranchName;
      })
      const prNumberExpected = 1;
      const prLabelExpected = 'automergePrLabel';
      createNewPR.mockReturnValue(prNumberExpected)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        prLabelExpected
      )).resolves.toBe(undefined);
      expect(createNewPR).toBeCalledTimes(1)
      expect(addLabelForPr).toBeCalledTimes(1)
      expect(addLabelForPr).toHaveBeenLastCalledWith(
        octokit,
        pushDescription,
        prNumberExpected,
        prLabelExpected
      )
    })
    it('Should not rejects if addLabel throws', async () => {
      const {createNewPR, addLabelForPr} = require('../lib/repo-api');
      createNewPR.mockReturnValue(1);
      addLabelForPr.mockImplementation((...args: any[]) => {
        throw new Error('Failed')
      })
      expect(() => addLabelForPr(
        octokit,
        pushDescription,
        1,
        'automergePrLabel'
      )).toThrow()
      expect(addLabelForPr).toBeCalledTimes(1)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).resolves.toBe(undefined);
      expect(createNewPR).toBeCalledTimes(1)
      expect(addLabelForPr).toBeCalledTimes(2)
    })
  })
})
