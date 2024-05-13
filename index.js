const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const core = require('@actions/core');
const { DefaultArtifactClient } = require('@actions/artifact');
const JSON5 = require('json5');

(async () => {
  try {
    const manifestPath = core.getInput('manifest');
    console.log(`Read manifest from ${manifestPath}...`);
    let content = fs.readFileSync(manifestPath, 'utf8');

    const tokensStr = core.getInput('tokens');
    if (tokensStr) {
      const tokens = JSON5.parse(tokensStr);
      console.log('Replace tokens...');
      console.log(tokens);
      content = Object.keys(tokens).reduce(
        (acc, cur) => acc.replaceAll(cur, tokens[cur]),
        content,
      );
      fs.writeFileSync(manifestPath, content);
    }

    const makeArtifact = core.getInput('artifact');
    if (makeArtifact === 'true') {
      console.log('Upload artifact...');
      const artifactClient = new DefaultArtifactClient();
      await artifactClient.uploadArtifact(
        path.basename(manifestPath),
        [manifestPath],
        path.dirname(manifestPath),
      );
    }

    const namespace = core.getInput('namespace');
    let command = `kubectl apply -f ${manifestPath}`;
    if (namespace) {
      command += ` -n ${namespace}`;
    }
    console.log('Apply manifest...');
    console.log(command);

    const dryRun = core.getInput('dry-run');
    if (dryRun !== 'true') {
      const output = childProcess.execSync(command);
      console.log(output.toString());
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
