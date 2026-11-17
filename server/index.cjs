const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const profiles = require("./data/profiles.json");
const DEFAULT_DATA_FILE = path.join(__dirname, "data", "state.json");
const INBOUND_LIKES = ["p03", "p09", "p17", "p25"];

function createStore(dataFile = DEFAULT_DATA_FILE) {
  const directory = path.dirname(dataFile);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
      swipes: [],
      inboundLikes: INBOUND_LIKES
    }, null, 2));
  }

  function read() {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  }

  function write(state) {
    const temporaryFile = `${dataFile}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
    fs.renameSync(temporaryFile, dataFile);
  }

  return { read, write };
}

function createApp(options = {}) {
  const store = createStore(options.dataFile);
  const app = express();
  app.use(express.json());

  app.get("/feed", (_request, response) => {
    const state = store.read();
    const swipedIds = new Set(state.swipes.map((swipe) => swipe.profileId));
    response.json({
      profiles: profiles
        .filter((profile) => !swipedIds.has(profile.id))
        .map(({ id, name, age, photo, bio, location, interests }) => ({
          id, name, age, photo, bio, location, interests
        }))
    });
  });

  app.post("/swipe", (request, response) => {
    const { profileId, action } = request.body || {};
    if (typeof profileId !== "string" || !["like", "pass"].includes(action)) {
      return response.status(400).json({ error: "profileId and a like or pass action are required" });
    }

    const profile = profiles.find((candidate) => candidate.id === profileId);
    if (!profile) {
      return response.status(404).json({ error: "Profile not found" });
    }

    const state = store.read();
    if (state.swipes.some((swipe) => swipe.profileId === profileId)) {
      return response.json({ match: false, alreadySwiped: true });
    }

    state.swipes.push({ profileId, action, createdAt: new Date().toISOString() });
    store.write(state);

    const match = action === "like" && state.inboundLikes.includes(profileId);
    return response.status(201).json({
      match,
      ...(match ? {
        profile: {
          id: profile.id,
          name: profile.name,
          age: profile.age,
          photo: profile.photo,
          bio: profile.bio,
          location: profile.location,
          interests: profile.interests
        }
      } : {})
    });
  });

  app.get("/matches", (_request, response) => {
    const state = store.read();
    const mutualIds = new Set(
      state.swipes
        .filter((swipe) => swipe.action === "like" && state.inboundLikes.includes(swipe.profileId))
        .map((swipe) => swipe.profileId)
    );
    response.json({
      matches: profiles
        .filter((profile) => mutualIds.has(profile.id))
        .map(({ id, name, age, photo, bio, location, interests }) => ({
          id, name, age, photo, bio, location, interests
        }))
    });
  });

  const clientBuild = path.join(__dirname, "..", "dist");
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get("*", (_request, response) => response.sendFile(path.join(clientBuild, "index.html")));
  }

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => console.log(`Coy Discover API listening on http://localhost:${port}`));
}

module.exports = { createApp };
