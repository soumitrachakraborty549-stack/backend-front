const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataFile = path.join(__dirname, "donations.json");
const wildlifeFolder = path.join(__dirname, "wildlife");

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.get("/home", (req, res) => {
  return res.sendFile(path.join(wildlifeFolder, "index.html"));
});

let writeQueue = Promise.resolve();

function saveDonation(donation) {
  const save = writeQueue.then(async () => {
    let donations = [];

    try {
      donations = JSON.parse(await fs.readFile(dataFile, "utf8"));
      if (!Array.isArray(donations)) donations = [];
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    donations.push(donation);
    await fs.writeFile(dataFile, `${JSON.stringify(donations, null, 2)}\n`, "utf8");
    return donation;
  });

  // Keep the queue usable after a failed write while returning the error to this request.
  writeQueue = save.catch(() => {});
  return save;
}

app.post("/api/donations", async (req, res, next) => {
  const amount = Number(req.body?.amount);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Enter a donation amount greater than zero." });
  }
  if (!name || name.length > 100) {
    return res.status(400).json({ error: "Enter your name (up to 100 characters)." });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const donation = {
    id: randomUUID(),
    amount,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  try {
    await saveDonation(donation);
    return res.status(201).json({ message: "Donation details saved.", donation });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(wildlifeFolder));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 500;
  const message = status === 400 ? "Request body must contain valid JSON." : "Unable to save donation details.";
  console.error(error);
  return res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`Wildlife site and donation API running at http://localhost:${port}`);
});
