const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp } = require("../server/index.cjs");

async function withApi(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "coy-discover-"));
  const server = createApp({ dataFile: path.join(directory, "state.json") }).listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl, path.join(directory, "state.json"));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("feed contains 30 profiles and does not expose inbound likes", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/feed`);
    const body = await response.json();
    assert.equal(body.profiles.length, 30);
    assert.ok(body.profiles.every((profile) => !("likedYou" in profile) && !("inboundLikes" in profile)));
  });
});

test("swipes persist, disappear from feed, and only mutual likes create matches", async () => {
  await withApi(async (baseUrl, dataFile) => {
    let response = await fetch(`${baseUrl}/swipe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "p03", action: "like" })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).match, true);

    response = await fetch(`${baseUrl}/swipe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "p01", action: "like" })
    });
    assert.equal((await response.json()).match, false);

    const feed = await (await fetch(`${baseUrl}/feed`)).json();
    assert.equal(feed.profiles.length, 28);
    assert.ok(!feed.profiles.some((profile) => profile.id === "p03" || profile.id === "p01"));

    const matches = await (await fetch(`${baseUrl}/matches`)).json();
    assert.deepEqual(matches.matches.map((profile) => profile.id), ["p03"]);

    const persisted = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    assert.equal(persisted.swipes.length, 2);
    assert.deepEqual(persisted.inboundLikes, ["p03", "p09", "p17", "p25"]);

    const restoredServer = createApp({ dataFile }).listen(0);
    try {
      const restoredUrl = `http://127.0.0.1:${restoredServer.address().port}`;
      const restoredFeed = await (await fetch(`${restoredUrl}/feed`)).json();
      const restoredMatches = await (await fetch(`${restoredUrl}/matches`)).json();
      assert.equal(restoredFeed.profiles.length, 28);
      assert.deepEqual(restoredMatches.matches.map((profile) => profile.id), ["p03"]);
    } finally {
      await new Promise((resolve, reject) => restoredServer.close((error) => error ? reject(error) : resolve()));
    }
  });
});

test("rejects malformed or repeated swipes without creating extra records", async () => {
  await withApi(async (baseUrl) => {
    let response = await fetch(`${baseUrl}/swipe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "p01", action: "maybe" })
    });
    assert.equal(response.status, 400);

    const post = () => fetch(`${baseUrl}/swipe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "p01", action: "pass" })
    });
    assert.equal((await (await post()).json()).alreadySwiped, undefined);
    assert.equal((await (await post()).json()).alreadySwiped, true);
    assert.equal((await (await fetch(`${baseUrl}/matches`)).json()).matches.length, 0);
  });
});
