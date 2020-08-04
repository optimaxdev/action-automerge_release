![build-test](https://github.com/optimaxdev/action-automerge_release/workflows/build-test/badge.svg)

# Auto Merging changes to following up release branches and "default" branch



**What this for.**
E.g. you have release branches:
``release/R-111``, ``release/R-112``, ``release/R-115`` and the default ``master`` branch.
You made a hotfix for ``release/R-111`` and pushed it. 
This action will be triggered right after the merge. It will check all existing branches. And the branch ``release/R-112`` will be chosen to merge, cause number of them are higher then the number of the branch ``release/R-111``. 
Merges will be perfrmed from ``release/R-111``, as source branch, to the ``release/R-112``, as the target branch.
If there were no merge conflicts, a next action will be triggered. It will merge  the ``release/R-112``, as source branch, to the ``release/R-115``, as the target branch.
E.g a merge-conflict was occurred. In this case the process is stopped and a pull request marked with a special label was created.
``release/R-111`` was merged only with ``release/R-112``. When the merge conflict will be resolved and changes pushed in the ``release/R-115``, another action will be triggered, which won't find a branches with a serial number higher then ``115``, therefore it will merge ``release/R-115`` to the ``master`` branch.
So, any updates on a lower-versioned releases will be merged automatically on upper-versioned releases and the main branch.
  
## Use this action

This action has a special version which handles merging of pull requests. It's placed in the branch named ``feature/trigger_on-push``, so you can check how to use that.

To use the automerge action you need to create a file ``root/.git/workflows/any_workflow_name.yml`` with content like this:
```yaml
name: 'Automerge'
on:
pull_request:
 # only if PR closed
 types: [closed]

jobs:
merge: # make sure the action works on a clean machine without building
runs-on: ubuntu-latest
steps:
# run the action
 - uses: optimaxdev/action-automerge_release@master
 name: run_automerge
 id: run_automerge
 # PR must be successfully merged and repo succesfully initiated on the previous step
 if: github.event_name == 'pull_request' && github.event.pull_request.merged == true
 with:
  token: ${{ github.token }}
  mainBranchName: 'master'
  releaseBranchPrfix: 'rel'
  releaseBranchTaskPrefix: 'v.'
  automergePrLabel: 'automerge-conflict'

```

where:

 1. mainBranchName - it the "master" branch or another words "default" branch on GitHub repo.
 2. releaseBranchPrfix - e.g. you pushes releases in branches with names like ``rel/v.192``. In this case the ``releaseBranchPrfix`` parameter must be equals to ``rel``.
 3. releaseBranchTaskPrefix- e.g. you pushes releases in branches with names like ``rel/v.192``. In this case the ``releaseBranchTaskPrefix`` parameter must be equals to ``v.``. Another example: you pushes releases in branches with names like ``release/REL-00012``. In this case the ``releaseBranchTaskPrefix`` parameter must be equals to ``REL-`` and ``releaseBranchPrfix`` = ``release``.
 4. automergePrLabel - is optional param, which defines which GitHub label name to use for automatically created pull requests when does a merge-conflict with some branch was occurred. All of requests automatically created will be marked up with this label.

**You can also specify some other specific params**, please see ./actiom.yml

  

## Code in Main


Install the dependencies

```bash

$ npm install

```

  

Build the typescript and package it for distribution

```bash

$ npm run build && npm run package

```

  

Run the tests :heavy_check_mark:

```bash

$ npm test

  

PASS ./index.test.js

✓ throws invalid number (3ms)

✓ wait 500 ms (504ms)

✓ test runs (95ms)

  

...

```

  

## Change action.yml

  

The action.yml contains defines the inputs and output for your action.

  

Update the action.yml with your name, description, inputs and outputs for your action.

  

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

  

## Change the Code

  

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

  

```javascript

import  *  as  core  from  '@actions/core';

...

  

async  function  run() {

try {

...

}

catch (error) {

core.setFailed(error.message);

}

}

  

run()

```

  

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

  

## Publish to a distribution branch

  

Actions are run from GitHub repos so we will checkin the packed dist folder.

  

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash

$ npm run package

$ git add dist

$ git commit -a -m "prod dependencies"

$ git push origin releases/v1

```

  

Your action is now published! :rocket:

  

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

  

**The best way to build and push a code is to use the following command:**

```npm run push``` or ```yarn push```.

Source code will be compiled and pushed to the branch
