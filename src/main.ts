/**
 * GitHub Action entry point.
 * Reads inputs, runs the translation pipeline, and sets outputs.
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as glob from "@actions/glob";
import { translateFiles } from "./translate";

async function run(): Promise<void> {
  try {
    // Read inputs
    const apiKey = core.getInput("api-key", { required: true });
    const sourceLanguage = core.getInput("source-language", { required: true });
    const targetLanguagesRaw = core.getInput("target-languages", {
      required: true,
    });
    const filesPattern = core.getInput("files", { required: true });
    const outputPattern = core.getInput("output-pattern", { required: true });
    const format = core.getInput("format") as "json" | "markdown" | "auto";
    const createPr = core.getBooleanInput("create-pr");
    const dryRun = core.getBooleanInput("dry-run");

    // Parse target languages
    const targetLanguages = targetLanguagesRaw
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (targetLanguages.length === 0) {
      core.setFailed("No target languages specified");
      return;
    }

    // Resolve file glob
    const globber = await glob.create(filesPattern);
    const files = await globber.glob();

    if (files.length === 0) {
      core.warning(`No files matched the pattern: ${filesPattern}`);
      core.setOutput("files-translated", "0");
      core.setOutput("characters-used", "0");
      return;
    }

    core.info(`Found ${files.length} source file(s)`);
    core.info(`Target languages: ${targetLanguages.join(", ")}`);

    if (dryRun) {
      core.info("[dry-run mode] No files will be written");
    }

    // Run translation
    const result = await translateFiles({
      apiKey,
      sourceLanguage,
      targetLanguages,
      files,
      outputPattern,
      format,
      dryRun,
    });

    core.info(
      `Done: ${result.filesTranslated} files translated, ${result.charactersUsed} characters used`
    );

    // Set outputs
    core.setOutput("files-translated", result.filesTranslated.toString());
    core.setOutput("characters-used", result.charactersUsed.toString());

    // Create PR if requested
    if (createPr && !dryRun && result.filesTranslated > 0) {
      await createPullRequest(targetLanguages);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

async function createPullRequest(languages: string[]): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    core.warning(
      "GITHUB_TOKEN not available. Set permissions.contents: write and permissions.pull-requests: write to create PRs."
    );
    return;
  }

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  const branchName = `langbly/translate-${Date.now()}`;
  const baseBranch =
    github.context.payload.pull_request?.base?.ref ??
    github.context.ref.replace("refs/heads/", "");

  core.info(`Creating PR branch: ${branchName}`);

  // Get the current commit SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  // Create branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  });

  // Note: The translated files need to be committed.
  // In a real workflow, users typically use stefanzweifel/git-auto-commit-action
  // after this action to commit the changes. The PR creation here provides the branch.

  const langList = languages.join(", ");

  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `Update translations (${langList})`,
    body: [
      "## Translation update",
      "",
      `Updated translations for: **${langList}**`,
      "",
      "This PR was automatically created by the [Langbly Translate](https://github.com/marketplace/actions/langbly-translate) GitHub Action.",
    ].join("\n"),
    head: branchName,
    base: baseBranch,
  });

  core.info(`Created PR #${pr.number}: ${pr.html_url}`);
}

run();
