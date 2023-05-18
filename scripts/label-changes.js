const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);

    const prNumber = github.context.payload.pull_request.number;
    const prFiles = await getPRFiles(octokit, prNumber);

    const labelConfigurations = {
      migration: '/migrations/*/*.migrations.ts',
      test: '/test/*/*.spect.ts',
      docs: '/docs/*'
    };

    for (const label in labelConfigurations) {
      const pattern = labelConfigurations[label];
      const filesMatched = prFiles.filter(file => file.filename.match(pattern));

      if (filesMatched.length > 0) {
        await addLabel(octokit, prNumber, label);
      } else {
        await removeLabel(octokit, prNumber, label);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getPRFiles(octokit, prNumber) {
  const response = await octokit.pulls.listFiles({
    ...github.context.repo,
    pull_number: prNumber
  });

  return response.data;
}

async function addLabel(octokit, prNumber, label) {
  await octokit.issues.addLabels({
    ...github.context.repo,
    issue_number: prNumber,
    labels: [label]
  });
}

async function removeLabel(octokit, prNumber, label) {
  await octokit.issues.removeLabel({
    ...github.context.repo,
    issue_number: prNumber,
    name: label
  });
}

run();
