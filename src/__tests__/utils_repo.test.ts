import { createpushDescriptionIfNotAlreadyExists } from '../utils/repo';
import { GITHUB_PUSH_DESCRIPTION_MOCK, BRANCHES_REFS_LIST_MOCK } from './__mocks__/github-entities.mock';
import { TGitHubOctokit, IGitHubPushDescription } from '../types/github';
import {checkActivePRExists, createNewPR, addLabelForPr} from '../lib/repo-api';

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
  describe('createpushDescriptionIfNotAlreadyExists', () => {
    it('Should not create a new pr if already exists for source and target branches', async () => {
      (checkActivePRExists as any).mockReturnValue(true)
      const targetBranchName = 'target_branch';
      const sourceBranchName = 'source_branch';
      await createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        targetBranchName,
        sourceBranchName,
        'automergePrLabel'
      );
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(checkActivePRExists).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        targetBranchName,
        sourceBranchName
      );
      expect(createNewPR).toBeCalledTimes(0)
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should rejects right after thrown on checking if a PR related exists', async () => {
      (checkActivePRExists as any).mockClear();
      (checkActivePRExists as any).mockImplementation(()=> {
        throw new Error('Failed')
      }) 
      expect(() => checkActivePRExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).toThrow();
      expect(checkActivePRExists).toBeCalledTimes(1);
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(checkActivePRExists).toBeCalledTimes(2)
      expect(createNewPR).toBeCalledTimes(0)
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should create a new PR if a PR related not exists ', async () => {
      jest.clearAllMocks();
      (checkActivePRExists as any).mockReturnValue(false)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).rejects.toThrow();
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should rejects right after thrown on PR creation', async () => {
      jest.clearAllMocks();
      (createNewPR as any).mockImplementation(()=> {
        throw new Error('Failed')
      })
      expect(() => createNewPR(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).toThrow();
      expect(createNewPR).toBeCalledTimes(1)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledTimes(2)
      expect(createNewPR).toHaveBeenLastCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should rejects if not a numeric PR number returned after creation', async () => {
      jest.clearAllMocks();
      (createNewPR as any).mockReturnValue("1")
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        'automergePrLabel'
      )).rejects.toThrow();
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledTimes(1)
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should not create a label for PR created if a label is not provided', async () => {
      jest.clearAllMocks();
      (createNewPR as any).mockReturnValue(1)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )).resolves.toBe(undefined);
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledWith(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
      )
      expect(addLabelForPr).toBeCalledTimes(0)
    })
    it('Should create a label for PR created if a is passed in arguments', async () => {
      jest.clearAllMocks();
      const prNumberExpected = 1;
      const prLabelExpected = 'automergePrLabel';
      (createNewPR as any).mockReturnValue(prNumberExpected)
      await expect(createpushDescriptionIfNotAlreadyExists(
        octokit,
        pushDescription,
        'target_branch',
        'source_branch',
        prLabelExpected
      )).resolves.toBe(undefined);
      expect(checkActivePRExists).toBeCalledTimes(1)
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
      jest.clearAllMocks();
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
      expect(checkActivePRExists).toBeCalledTimes(1)
      expect(createNewPR).toBeCalledTimes(1)
      expect(addLabelForPr).toBeCalledTimes(2)
    })
  })
})
