const OWNER = "mar08meow";
const REPO = "amnecorda";
const BRANCH = "main";

const EXACT_PATHS = new Set([
  "index.html",
  "about.html",
  "projects.html",
  "writing.html",
  "assets/css/main.css",
  "data/posts.json",
  "sitemap.xml",
  "robots.txt",
  "_headers",
]);

const POST_PATH = /^posts\/[A-Za-z0-9\u4e00-\u9fa5._-]+\.html$/;

export class GitHubError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export function assertAllowedPath(path) {
  if (
    typeof path !== "string" ||
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..")
  ) {
    throw new GitHubError("非法文件路径", 400);
  }

  if (EXACT_PATHS.has(path) || POST_PATH.test(path)) return;
  throw new GitHubError("不允许修改该文件", 400);
}

async function githubRequest(env, path, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new GitHubError("Cloudflare 环境变量 GITHUB_TOKEN 未配置");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "amnecorda-admin",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    throw new GitHubError(
      (data && data.message) || `GitHub API ${response.status}`,
      response.status
    );
  }

  return data;
}

const decodeBase64 = (value) => {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export async function getFile(env, path) {
  assertAllowedPath(path);
  const encoded = path.split("/").map(encodeURIComponent).join("/");

  try {
    const data = await githubRequest(
      env,
      `/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${BRANCH}`
    );
    return {
      content: decodeBase64(data.content),
      sha: data.sha,
    };
  } catch (error) {
    if (error.status === 404) {
      return { content: "", sha: null };
    }
    throw error;
  }
}

export async function commitFiles(env, changes, message) {
  if (!Array.isArray(changes) || !changes.length || changes.length > 20) {
    throw new GitHubError("变更数量不合法", 400);
  }

  let totalCharacters = 0;
  for (const change of changes) {
    assertAllowedPath(change.path);
    if (change.content !== null && typeof change.content !== "string") {
      throw new GitHubError("文件内容格式不正确", 400);
    }
    if (typeof change.content === "string") {
      if (change.content.length > 2_000_000) {
        throw new GitHubError("单个文件超过 2MB 限制", 400);
      }
      totalCharacters += change.content.length;
    }
  }
  if (totalCharacters > 4_000_000) {
    throw new GitHubError("本次提交内容超过 4MB 限制", 400);
  }

  const ref = await githubRequest(
    env,
    `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`
  );
  const parentSha = ref.object.sha;
  const parent = await githubRequest(
    env,
    `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`
  );

  const tree = [];
  for (const change of changes) {
    if (change.content === null) {
      tree.push({
        path: change.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }

    const blob = await githubRequest(
      env,
      `/repos/${OWNER}/${REPO}/git/blobs`,
      {
        method: "POST",
        body: JSON.stringify({
          content: change.content,
          encoding: "utf-8",
        }),
      }
    );

    tree.push({
      path: change.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const newTree = await githubRequest(
    env,
    `/repos/${OWNER}/${REPO}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
    }
  );

  const commit = await githubRequest(
    env,
    `/repos/${OWNER}/${REPO}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message: String(message || "Admin update").slice(0, 200),
        tree: newTree.sha,
        parents: [parentSha],
      }),
    }
  );

  await githubRequest(
    env,
    `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    }
  );

  return {
    sha: commit.sha,
    html_url: commit.html_url,
  };
}
