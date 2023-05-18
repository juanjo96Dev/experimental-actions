import * as core from "@actions/core";
import * as github from "@actions/github";

type Octokit = ReturnType<typeof github.getOctokit>;

async function run() {
  try {
    const token = core.getInput("github-token");
    const octokit = github.getOctokit(token);

    const prNumber = github.context.payload.pull_request?.number;
    if (!prNumber) {
      return;
    }

    const prFiles = await getPRFiles(octokit, prNumber);

    const labelConfigurations: Record<string, string> = {
      migration: "/migrations/*/*.migrations.ts",
      test: "/test/*/*.spect.ts",
      docs: "/docs/*",
    };

    for (const label in labelConfigurations) {
      const pattern = labelConfigurations[label];
      const filesMatched = prFiles.filter((file) =>
        file.filename.match(pattern)
      );

      if (filesMatched.length > 0) {
        await addLabel(octokit, prNumber, label);
      } else {
        await removeLabel(octokit, prNumber, label);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function getPRFiles(octokit: Octokit, prNumber: number) {
  const response = await octokit.rest.pulls.listFiles({
    ...github.context.repo,
    pull_number: prNumber,
  });

  return response.data;
}

async function addLabel(octokit: Octokit, prNumber: number, label: string) {
  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: prNumber,
    labels: [label],
  });
}

async function removeLabel(octokit: Octokit, prNumber: number, label: string) {
  await octokit.rest.issues.removeLabel({
    ...github.context.repo,
    issue_number: prNumber,
    name: label,
  });
}

run();
