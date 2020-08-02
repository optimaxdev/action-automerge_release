import {
  getBranchNameWithoutPrefix,
  getBranchNameReleaseSerialNumber,
  getBranchesWithUpperSerialNumber,
  mergeToRelated,
  mergeSourceToBranch,
} from '../merge-to-release';
import {mergeBranchTo} from '../lib/repo-api';
import {createPullRequestIfNotAlreadyExists} from '../utils/repo';
import { GITHUB_PULL_REQUEST_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME } from './__mocks__/github-entities.mock';
import { IContextEnv } from '../types/context';

jest.mock('../lib/repo-api');
jest.mock('../utils/repo');

const CONTEXT_ENV_MOCK = {
  automergePrLabel: 'automergePrLabel',
  releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
  releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
} as unknown as IContextEnv;

describe('merge-to-release module', () => {
  describe('getBranchNameWithoutPrefix', () => {
    it('should return "RLS-11" for branchName = "release/RLS-11" and releasePrefix="release"', () => {
      const testBranchName = 'release/RLS-11'
      const testReleasePrefix = 'release'
      const expected = 'RLS-11'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return "RLS-11" for branchName = "release/RLS-11" and releasePrefix="RELEASE"', () => {
      const testBranchName = 'release/RLS-11'
      const testReleasePrefix = 'RELEASE'
      const expected = 'RLS-11'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return "BRANCH_NAME" for branchName = " release/ BRANCH_NAME  " and releasePrefix="ReLease"', () => {
      const testBranchName = ' release/ BRANCH_NAME  '
      const testReleasePrefix = 'ReLease'
      const expected = 'BRANCH_NAME'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return "B" for branchName = " R/ B  " and releasePrefix="R/"', () => {
      const testBranchName = ' R/ B  '
      const testReleasePrefix = 'R/'
      const expected = 'B'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return "B/C/D" for branchName = " R/ B/C/D  " and releasePrefix="R/"', () => {
      const testBranchName = ' R/ B/C/D  '
      const testReleasePrefix = 'R/'
      const expected = 'B/C/D'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return an empty string for branchName = "" and releasePrefix="R/"', () => {
      const testBranchName = ''
      const testReleasePrefix = 'R/'
      const expected = ''
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return an empty string for branchName = "/" and releasePrefix="R/"', () => {
      const testBranchName = '/'
      const testReleasePrefix = 'R/'
      const expected = ''
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return an empty string for branchName = "R/" and releasePrefix="R/"', () => {
      const testBranchName = 'R/'
      const testReleasePrefix = 'R/'
      const expected = ''
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
  })
  describe('getBranchNameReleaseSerialNumber', () => {
    it('should return 11 for branchName = "release/RLS-11", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = 'release/RLS-11'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = 11
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return 11 for branchName = "release/RLS-11-release/", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = 'release/RLS-11-release/'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = 11
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return 1 for branchName = "release/  RLS-01-release/", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = 'release/  RLS-01-release/'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = 1
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return undefined for branchName = "release/PREFIX-01", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = 'release/PREFIX-01'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = undefined
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return undefined for branchName = "", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = ''
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = undefined
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return undefined for branchName = "release/RLS-01", releasePrefix="release", releaseTaskPrefix="RLS"', () => {
      const testBranchName = 'release/RLS-01'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS'
      const expected = undefined
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
    it('should return undefined for branchName = "release/RLS01", releasePrefix="release", releaseTaskPrefix="RLS-"', () => {
      const testBranchName = 'release/RLS01'
      const testReleasePrefix = 'release'
      const releaseTaskPrefix = 'RLS-'
      const expected = undefined
      expect(
        getBranchNameReleaseSerialNumber(
          testBranchName,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toBe(expected)
    })
  })

  describe('getBranchesWithUpperSerialNumber', () => {
    it('Should throw if failed to define serial number for the current branch', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS-01']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS'
      expect(() => 
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toThrow();
    })
    it('Should not return branch with the same serial number', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS-01']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = []
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
    it('Should return branch with an upper serial number', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS-02']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = ['release/RLS-02']
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
    it('Should only return branch with an upper serial number, if another branches has no serial number related', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS-02', 'release/RLS02', 'rel/RLS-02']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = ['release/RLS-02']
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
    it('Should return branches with an upper serial numbers and zero leading characters, if another branches has no serial number related', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS-0010', 'release/RLS-02', 'release/RLS02', 'rel/RLS-02', 'release/RLS-2', 'release/RLS-002']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = ['release/RLS-0010', 'release/RLS-02', 'release/RLS-2', 'release/RLS-002']
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expect.arrayContaining(expected))
    })
    it('Should return branches related sorted ascending', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = [
        'release/RLS-02',
        'release/RLS02',
        'rel/RLS-02',
        'release/R-1',
        'release/RLS-0010-_-_-_____dfkjflkkfjsdf;ksd;jfsdfdsfjsdfjsdfkljsdfklsdjfk;lsdjfsdk;lfj',
        'release/RLS-2',
        'release/RLS-0000011_dkdkd-39393939393939',
        'release/RLS-1',
        'release/RLS-002',
        'release/RLS-4',
        'release/RLS4',
        'release/RLS-00000000_9000_888888',
      ]
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = [
        // 'release/RLS-1', - absent cause it equals to the current branch number
        'release/RLS-02',
        'release/RLS-2',
        'release/RLS-002',
        'release/RLS-4',
        'release/RLS-0010-_-_-_____dfkjflkkfjsdf;ksd;jfsdfdsfjsdfjsdfkljsdfklsdjfk;lsdjfsdk;lfj',
        'release/RLS-0000011_dkdkd-39393939393939'
      ]
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
    it('Should return empty, if there is no branches has a serial number related', () => {
      const testBranchName = 'release/RLS-01'
      const testBranchesNames = ['release/RLS02', 'rel/RLS-02', 'release/PREF-02', 'TASK_NUMBER122']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = []
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
    it('Should not return branches with the same serial number but with leading zero characters', () => {
      const testBranchName = 'release/RLS-010'
      const testBranchesNames = ['release/RLS-00010', 'release/RLS-0010', 'release/RLS-010']
      const testReleasePrefix = 'release/'
      const releaseTaskPrefix = 'RLS-'
      const expected: any[] = []
      expect(
        getBranchesWithUpperSerialNumber(
          testBranchName,
          testBranchesNames,
          testReleasePrefix,
          releaseTaskPrefix
        )
      ).toEqual(expected)
    })
  })

  describe('mawaitergeSourceToBranch', () => {
    test('should not create a PR if no merge conflict with a target branch', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue();
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(0);
    })
    test('should not create a PR if GitHub API call throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockImplementation(() => {
        throw new Error('Error');
      });
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();

      const octokit = {} as any;

      expect(() => mergeBranchTo(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        'branch_b',
        GITHUB_PULL_REQUEST_MOCK.head.ref,
      )).toThrow();
      expect(mergeBranchTo).toBeCalledTimes(1);
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).rejects.toThrow()
      expect(mergeBranchTo).toBeCalledTimes(2);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(0);
    })
    test('should rejects if PR creation throws on merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
      (createPullRequestIfNotAlreadyExists as any).mockImplementation(() => {
        throw new Error('Error');
      });

      const octokit = {} as any;

      expect(() => createPullRequestIfNotAlreadyExists(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        'branch_b',
        GITHUB_PULL_REQUEST_MOCK.head.ref,
      )).toThrow();
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(1);
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).rejects.toThrow()
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(2);
    })
    test('should create a PR on a merge conflict with a branch', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        'branch_b',
        GITHUB_PULL_REQUEST_MOCK.head.ref,
        CONTEXT_ENV_MOCK.automergePrLabel
      );
    })
    test('should resolves with false on a merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(false);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(1);
    })
    test('should resolves with undefined if no merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue();
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequestIfNotAlreadyExists).toBeCalledTimes(0);
    })
  })

  describe('mergeToRelated', () => {
    beforeEach(() => {
      (mergeBranchTo as any).mockReturnValue(undefined);
      (createPullRequestIfNotAlreadyExists as any).mockReturnValue();
    })
    it('should rejects if serial number was not found for the PR target branch', async () => {
      expect(mergeToRelated(
        {} as any,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: 'releaseBranchPrfix',
          releaseBranchTaskPrefix: 'releaseBranchTaskPrefix',
        } as any,
        [''],
      )).rejects.toThrow('Failed to determine PR target branch');
    })
    it('should resolves with undefined if no branches to merge were found', async () => {
      (mergeBranchTo as any).mockClear();
      expect(mergeToRelated(
        {} as any,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [''],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).not.toBeCalled();
    })
    it('should resolves with undefined if PR branch succesfully merged to a branch with upper version', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetName = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetName],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PULL_REQUEST_MOCK,
        branchTargetName,
        GITHUB_PULL_REQUEST_MOCK.head.ref
      );
    })
    it('should resolves with undefined if PR branch succesfully merged to multiple branches with upper version', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameFirst, branchTargetNameSecond],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PULL_REQUEST_MOCK,
        branchTargetNameFirst,
        GITHUB_PULL_REQUEST_MOCK.head.ref
      );
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PULL_REQUEST_MOCK,
        branchTargetNameSecond,
        GITHUB_PULL_REQUEST_MOCK.head.ref
      );
    })
    it('should not merge branches not related to the PR branch', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameFirst, notRelatedFirst, branchTargetNameSecond, notRelatedSecond],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).not.toBeCalledWith(
        expect.anything(),
        expect.anything(),
        notRelatedFirst,
        expect.anything()
      );
      expect(mergeBranchTo).not.toBeCalledWith(
        expect.anything(),
        expect.anything(),
        notRelatedSecond,
        expect.anything()
      );
    })

    it('should merge branches in ascending order related to it serial number', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameSame = GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}0`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1__999999999999999999`;
      const branchTargetNameThird = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}00`;
      const branchTargetNameForth = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}01_dfkfjd___9999999999999999999999`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameThird, branchTargetNameSame, branchTargetNameForth, notRelatedFirst, branchTargetNameSecond, notRelatedSecond, branchTargetNameFirst],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledTimes(4);
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.anything(),
        branchTargetNameFirst,
        expect.anything()
      );
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.anything(),
        branchTargetNameSecond,
        expect.anything()
      );
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        3,
        expect.anything(),
        expect.anything(),
        branchTargetNameThird,
        expect.anything()
      );
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        4,
        expect.anything(),
        expect.anything(),
        branchTargetNameForth,
        expect.anything()
      );
    })

    it('should stop to merge branches after the first merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, notRelatedFirst, branchTargetNameSecond, notRelatedSecond],
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
    })

    it('should call once createPullRequestIfNotAlreadyExists with target branch which failed cause of conflict while a first merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, notRelatedFirst, branchTargetNameSecond, notRelatedSecond],
      )
      expect(createPullRequestIfNotAlreadyExists).toHaveBeenCalledTimes(1)
      expect(createPullRequestIfNotAlreadyExists).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        branchTargetNameFirst,
        GITHUB_PULL_REQUEST_MOCK.head.ref,
        CONTEXT_ENV_MOCK.automergePrLabel
      );
    })

    it('should rejects if createPullRequestIfNotAlreadyExists throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequestIfNotAlreadyExists as any).mockClear();
      (createPullRequestIfNotAlreadyExists as any).mockImplementation(() => {
        throw new Error('Failed');
      });

      expect(createPullRequestIfNotAlreadyExists).toThrow();

      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, notRelatedFirst, branchTargetNameSecond, notRelatedSecond],
      )).rejects.toThrow(); 
    })

    it('should rejects and stop to merge branches after the first fail of merging', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockRejectedValueOnce();
      const octokit = {} as any;
      const branchTargetNameFirst = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetNameSecond = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const notRelatedFirst = `notRelatedFirst`;
      const notRelatedSecond = `notRelatedSecond`;

      await expect(mergeToRelated(
        octokit,
        GITHUB_PULL_REQUEST_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, notRelatedFirst, branchTargetNameSecond, notRelatedSecond],
      )).rejects.toBe(undefined)
      expect(mergeBranchTo).toBeCalledTimes(1);
    })
  })
})
