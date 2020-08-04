import {
  getBranchNameWithoutPrefix,
  getBranchNameReleaseSerialNumber,
  getBranchesWithUpperSerialNumber,
  mergeToBranches,
  mergeSourceToBranch,
  getBranchesRelatedToPD,
} from '../merge-to-release';
import {mergeBranchTo} from '../lib/repo-api';
import {createpushDescriptionIfNotAlreadyExists} from '../utils/repo';
import { GITHUB_PUSH_DESCRIPTION_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION } from './__mocks__/github-entities.mock';
import { IContextEnv } from '../types/context';
import { getTargetBranchesNames } from '../merge-to-release';

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
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(0);
    })
    test('should not create a PR if GitHub API call throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockImplementation(() => {
        throw new Error('Error');
      });
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();

      const octokit = {} as any;

      expect(() => mergeBranchTo(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        'branch_b',
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
      )).toThrow();
      expect(mergeBranchTo).toBeCalledTimes(1);
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).rejects.toThrow()
      expect(mergeBranchTo).toBeCalledTimes(2);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(0);
    })
    test('should rejects if PR creation throws on merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
      (createpushDescriptionIfNotAlreadyExists as any).mockImplementation(() => {
        throw new Error('Error');
      });

      const octokit = {} as any;

      expect(() => createpushDescriptionIfNotAlreadyExists(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        'branch_b',
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
      )).toThrow();
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(1);
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).rejects.toThrow()
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(2);
    })
    test('should create a PR on a merge conflict with a branch', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        'branch_b',
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
        CONTEXT_ENV_MOCK.automergePrLabel
      );
    })
    test('should resolves with false on a merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(false);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(1);
    })
    test('should resolves with undefined if no merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue();
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledTimes(0);
    })
  })

  describe('getBranchesRelatedToPD', () => {
    it('should rejects if serial number was not found for the PR target branch', async () => {
      expect(getBranchesRelatedToPD(
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: 'releaseBranchPrfix',
          releaseBranchTaskPrefix: 'releaseBranchTaskPrefix',
        } as any,
        [''],
      )).rejects.toThrow(expect.stringContaining('Failed to define a serial number for the PR branch'));
    })
    it('should resolves with empty branches if no branches related found', async () => {
      expect(getBranchesRelatedToPD(
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [''],
      )).resolves.toBe([]);
    })
    it('should resolves with all branches, sorted by serial number, which has a version upper than PRs branch', async () => {
      const branchTargetName = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}1`;
      const branchTargetName1 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}10v9999999`;
      const branchTargetName2 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}2`;
      const branchTargetName3 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}01`;
      const branchTargetName4 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}0_____999999`;
      const expected = [
        branchTargetName4,
        branchTargetName,
        branchTargetName2,
        branchTargetName3,
        branchTargetName1,
      ];

      await expect(getBranchesRelatedToPD(
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [
          branchTargetName,
          branchTargetName1,
          branchTargetName2,
          branchTargetName3,
          branchTargetName4
        ],
      )).resolves.toEqual(expected);
    })
    it('should resolves with no branches, which has a version below or equal the PRs branch', async () => {
      const prBranchName = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}9`;
      const branchTargetEqualNumber = prBranchName;
      const branchTargetBelowNumber1 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}0`;
      const branchTargetBelowNumber2 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME}8`;
      const expectedNotContain = [
        branchTargetEqualNumber,
        branchTargetBelowNumber1,
        branchTargetBelowNumber2,
      ];

      await expect(getBranchesRelatedToPD(
        { base: { ref: prBranchName } } as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        expectedNotContain,
      )).resolves.not.toEqual(expect.arrayContaining(expectedNotContain));
    })
    it('should resolves with no branches, which has a ref prefix not related to the PR branch', async () => {
      const prBranchName = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}_/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix1 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}//${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix2 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}1/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix3 = `/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix4 = `v${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix5 = `0${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const expectedNotContained = [
        branchTargerWithAnotherBranchPrefix,
        branchTargerWithAnotherBranchPrefix1,
        branchTargerWithAnotherBranchPrefix2,
        branchTargerWithAnotherBranchPrefix3,
        branchTargerWithAnotherBranchPrefix4,
        branchTargerWithAnotherBranchPrefix5,
      ];
      const expectedContained = [
        `${prBranchName}1`,
        `${prBranchName}0`,
      ];
      const result = await getBranchesRelatedToPD(
        { base: { ref: prBranchName } } as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [...expectedNotContained, ...expectedContained],
      );
    
      expect(result).not.toEqual(expect.arrayContaining(expectedNotContained));
      expect(result).toEqual(expect.arrayContaining(expectedContained));
    })
    it('should resolves with no branches, which has a ref branch task prefix not related to the PR branch', async () => {
      const prBranchName = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}-${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix1 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}_${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix2 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix3 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}0${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const branchTargerWithAnotherBranchPrefix4 = `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME}v${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION}`;
      const expectedNotContained = [
        branchTargerWithAnotherBranchPrefix,
        branchTargerWithAnotherBranchPrefix1,
        branchTargerWithAnotherBranchPrefix2,
        branchTargerWithAnotherBranchPrefix3,
        branchTargerWithAnotherBranchPrefix4,
      ];
      const expectedContained = [
        `${prBranchName}1`,
        `${prBranchName}0`,
      ];
      const result = await getBranchesRelatedToPD(
        { base: { ref: prBranchName } } as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [...expectedNotContained, ...expectedContained],
      );
    
      expect(result).not.toEqual(expect.arrayContaining(expectedNotContained));
      expect(result).toEqual(expect.arrayContaining(expectedContained));
    })
  });

  describe('getTargetBranchesNames', () => {
    it('Should return empty array for empty list', () => {
      expect(getTargetBranchesNames([])).toEqual([])
    })
    it('Should return array with the first element from the list', () => {
      expect(getTargetBranchesNames(['1', '2', '3'])).toEqual(['1'])
    })
  })

  describe('mergeToBranches', () => {
    beforeEach(() => {
      (mergeBranchTo as any).mockReturnValue(undefined);
      (createpushDescriptionIfNotAlreadyExists as any).mockReturnValue();
    })
    it('should resolves with undefined if no branches to merge', async () => {
      (mergeBranchTo as any).mockClear();
      expect(mergeToBranches(
        {} as any,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).not.toBeCalled();
    })
    it('should resolves with undefined if PR branch succesfully merged to multiple branches', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;

      await expect(mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameFirst, branchTargetNameSecond],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameFirst,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameSecond,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
    })

    it('should merge only branches have a uniq names in the list', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch1`;
      const branchTargetNameForth = `branch2`;

      await expect(mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird, branchTargetNameForth],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameFirst,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
      expect(mergeBranchTo).toBeCalledWith(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameSecond,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
      expect(mergeBranchTo).toBeCalledTimes(2);
    })

    it('should merge branches in order from the given array', async () => {
      (mergeBranchTo as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch3`;

      await expect(mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        {
          releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
          releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        } as any,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird],
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        1,
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameFirst,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        2,
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameSecond,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
      expect(mergeBranchTo).toHaveBeenNthCalledWith(
        3,
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK,
        branchTargetNameThird,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref
      );
    })

    it('should stop to merge branches after the first merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch3`;

      await mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird],
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
    })

    it('should call once createpushDescriptionIfNotAlreadyExists with target branch which failed cause of conflict while a first merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch3`;

      await mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird],
      )
      expect(createpushDescriptionIfNotAlreadyExists).toHaveBeenCalledTimes(1)
      expect(createpushDescriptionIfNotAlreadyExists).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        branchTargetNameFirst,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
        CONTEXT_ENV_MOCK.automergePrLabel
      );
    })

    it('should rejects if createpushDescriptionIfNotAlreadyExists throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createpushDescriptionIfNotAlreadyExists as any).mockClear();
      (createpushDescriptionIfNotAlreadyExists as any).mockImplementation(() => {
        throw new Error('Failed');
      });

      expect(createpushDescriptionIfNotAlreadyExists).toThrow();

      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch3`;

      await expect(mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird],
      )).rejects.toThrow(); 
    })

    it('should rejects and stop to merge branches after the first fail of merging', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockRejectedValueOnce();
      const octokit = {} as any;
      const branchTargetNameFirst = `branch1`;
      const branchTargetNameSecond = `branch2`;
      const branchTargetNameThird = `branch3`;

      await expect(mergeToBranches(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        [branchTargetNameFirst, branchTargetNameSecond, branchTargetNameThird],
      )).rejects.toBe(undefined)
      expect(mergeBranchTo).toBeCalledTimes(1);
    })
  })
})
