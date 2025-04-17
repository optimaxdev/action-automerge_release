import {
  getBranchNameWithoutPrefix,
  getBranchNameReleaseSerialNumber,
  getBranchesWithUpperSerialNumber,
  mergeToBranches,
  mergeSourceToBranch,
  getBranchesRelatedToPD,
} from '../merge-to-release';
import {mergeBranchTo} from '../lib/repo-api';
import {createPullRequest} from '../utils/repo';
import { GITHUB_PUSH_DESCRIPTION_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_TARGET_BRANCH_FULL_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME_VERSION } from './__mocks__/github-entities.mock';
import { IContextEnv } from '../types/context';
import { getTargetBranchesNames, getBranchNameWithoutRefsPrefix, getBranchSerialNumber, versionStringToNumber } from '../merge-to-release';

jest.mock('../lib/repo-api');
jest.mock('../utils/repo');

const CONTEXT_ENV_MOCK = {
  automergePrLabel: 'automergePrLabel',
  releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
  releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
} as unknown as IContextEnv;

describe('merge-to-release module', () => {
  describe('getBranchNameWithoutRefsPrefix', () => {
    it('should return the same branch name if the "refs/heads" string is not in the branch name', () => {
      const expected = 'branch_name_expected';
      expect(getBranchNameWithoutRefsPrefix(expected)).toBe(expected);
    })
    it('should return an empty string if empty string is passes as argument', () => {
      const expected = '';
      expect(getBranchNameWithoutRefsPrefix(expected)).toBe(expected);
    })
    it('should remove the "refs/heads/" prefix', () => {
      const prefix = "refs/heads/";
      const expected = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${expected}`)).toBe(expected);
    })
    it('should remove the "    refs/heads/" prefix', () => {
      const prefix = "    refs/heads/";
      const expected = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${expected}`)).toBe(expected);
    })
    it('should remove the "/refs/heads/" prefix', () => {
      const prefix = " /refs/heads/";
      const expected = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${expected}`)).toBe(expected);
    })
    it('should remove the "       /refs/heads/" prefix', () => {
      const prefix = "       /refs/heads/";
      const expected = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${expected}`)).toBe(expected);
    })
    it('should remove the "       /Refs/HEADs/" prefix', () => {
      const prefix = "       /Refs/HEADs/";
      const expected = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${expected}`)).toBe(expected);
    })
    it('should not remove the "refs/heads" prefix, cause there is no slash at the end', () => {
      const prefix = "refs/heads";
      const branchName = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${branchName}`)).toBe(`${prefix}${branchName}`);
    })
    it('should not remove the "refs_/heads" prefix, cause there is an additional symbol in refs prefix', () => {
      const prefix = "refs_/heads";
      const branchName = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${branchName}`)).toBe(`${prefix}${branchName}`);
    })
    it('should not remove the "_refs/heads" prefix, cause there is an additional symbol in refs prefix', () => {
      const prefix = "_refs/heads";
      const branchName = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${branchName}`)).toBe(`${prefix}${branchName}`);
    })
    it('should not remove the "refs/heads_" prefix, cause there is an additional symbol in heads prefix', () => {
      const prefix = "refs/heads_";
      const branchName = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${prefix}${branchName}`)).toBe(`${prefix}${branchName}`);
    })
    it('should not remove the "refs/heads" if it is not at the start of a ref string', () => {
      const postfix = "refs/heads/";
      const branchName = 'branch_name';
      expect(getBranchNameWithoutRefsPrefix(`${branchName}${postfix}`)).toBe(`${branchName}${postfix}`);
    })
  });
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
    it('should return "RLS-11" for branchName = "refs/heads/release/RLS-11" and releasePrefix="release"', () => {
      const testBranchName = 'refs/heads/release/RLS-11'
      const testReleasePrefix = 'release'
      const expected = 'RLS-11'
      expect(
        getBranchNameWithoutPrefix(testBranchName, testReleasePrefix)
      ).toBe(expected)
    })
    it('should return "RLS-11" for branchName = "    /Refs/Heads/release/RLS-11" and releasePrefix="release"', () => {
      const testBranchName = '    /Refs/Heads/release/RLS-11'
      const testReleasePrefix = 'release'
      const expected = 'RLS-11'
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

  describe('getBranchSerialNumber', () => {
    test('should correctly convert release/1.0.0 to serial number', () => {
      expect(getBranchSerialNumber('release/1.0.0')).toBe(100);
      expect(getBranchSerialNumber('release/2.5.42')).toBe(20542);
      expect(getBranchSerialNumber('release/10.10.100')).toBe(1010100);
    });
  
    test('should return undefined for invalid version-style branches', () => {
      expect(getBranchSerialNumber('release/1.0')).toBeUndefined();
      expect(getBranchSerialNumber('release/2.5')).toBeUndefined();
      expect(getBranchSerialNumber('release/10.100')).toBeUndefined();
    });
  
    test('should correctly handle web-style branches', () => {
      expect(getBranchSerialNumber('release/RLS-001')).toBeDefined();  // Assuming a valid result for RLS-001
      expect(getBranchSerialNumber('release/RLS-002')).toBeDefined();  // Assuming a valid result for RLS-002
      expect(getBranchSerialNumber('release/RLS-100')).toBeDefined();  // Assuming a valid result for RLS-100
    });
  
    test('should return undefined for non-version and non-web branches', () => {
      expect(getBranchSerialNumber('release/abc')).toBeUndefined();
      expect(getBranchSerialNumber('release/xyz123')).toBeUndefined();
      expect(getBranchSerialNumber('feature/1.0.0')).toBeUndefined();
    });
  
    test('should handle edge cases for version-style branches', () => {
      expect(getBranchSerialNumber('release/0.1.0')).toBe(10);
      expect(getBranchSerialNumber('release/1.0.1')).toBe(101);
      expect(getBranchSerialNumber('release/9.9.9')).toBe(999);
    });
  });

  describe('versionStringToNumber', () => {
    test('should correctly convert version strings to numbers', () => {
      expect(versionStringToNumber('1.0.0')).toBe(100);
      expect(versionStringToNumber('2.5.42')).toBe(20542);
      expect(versionStringToNumber('10.10.100')).toBe(1010100);
    });
  
    test('should return NaN for invalid version strings', () => {
      expect(versionStringToNumber('1.0')).toBeNaN();
      expect(versionStringToNumber('2.5')).toBeNaN();
      expect(versionStringToNumber('10.100')).toBeNaN();
    });
  
    test('should handle single-digit versions correctly', () => {
      expect(versionStringToNumber('1.1.1')).toBe(111);
      expect(versionStringToNumber('2.2.2')).toBe(222);
      expect(versionStringToNumber('9.9.9')).toBe(999);
    });
  
    test('should handle edge cases for version strings', () => {
      expect(versionStringToNumber('0.1.0')).toBe(10);  // Should be 10, as major = 0, minor = 1, patch = 0
      expect(versionStringToNumber('1.0.1')).toBe(101);  // Should be 101
      expect(versionStringToNumber('9.9.99')).toBe(9999);  // Should be 9999
    });
  
    test('should return NaN for non-version strings', () => {
      expect(versionStringToNumber('release/1.0.0')).toBeNaN();
      expect(versionStringToNumber('feature/2.0.1')).toBeNaN();
    });
  });

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
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequest).toBeCalledTimes(0);
    })
    test('should not create a PR if GitHub API call throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockImplementation(() => {
        throw new Error('Error');
      });
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();

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
      expect(createPullRequest).toBeCalledTimes(0);
    })
    test('should rejects if PR creation throws on merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();
      (createPullRequest as any).mockImplementation(() => {
        throw new Error('Error');
      });

      const octokit = {} as any;

      expect(() => createPullRequest(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        'branch_b',
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
      )).toThrow();
      expect(createPullRequest).toBeCalledTimes(1);
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).rejects.toThrow()
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequest).toBeCalledTimes(2);
    })
    test('should create a PR on a merge conflict with a branch', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();
      const octokit = {} as any;
      await mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequest).toBeCalledWith(
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
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(false);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequest).toBeCalledTimes(1);
    })
    test('should resolves with undefined if no merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue();
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockReturnValue();
      const octokit = {} as any;
      await expect(mergeSourceToBranch(
        octokit,
        GITHUB_PUSH_DESCRIPTION_MOCK as any,
        CONTEXT_ENV_MOCK,
        'branch_b',
      )).resolves.toBe(undefined);
      expect(mergeBranchTo).toBeCalledTimes(1);
      expect(createPullRequest).toBeCalledTimes(0);
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
      (createPullRequest as any).mockReturnValue();
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

    it('should call once createPullRequest with target branch which failed cause of conflict while a first merge conflict', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequest as any).mockClear();
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
      expect(createPullRequest).toHaveBeenCalledTimes(1)
      expect(createPullRequest).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        branchTargetNameFirst,
        GITHUB_PUSH_DESCRIPTION_MOCK.head.ref,
        CONTEXT_ENV_MOCK.automergePrLabel
      );
    })

    it('should rejects if createPullRequest throws', async () => {
      (mergeBranchTo as any).mockClear();
      (mergeBranchTo as any).mockReturnValue(false);
      (createPullRequest as any).mockClear();
      (createPullRequest as any).mockImplementation(() => {
        throw new Error('Failed');
      });

      expect(createPullRequest).toThrow();

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
