import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "LeadFlow CRM Backend API is active and running!" });
});

// -- Lemma Config
const LEMMA_API_URL = process.env.LEMMA_API_URL || "https://api.lemma.work";
const LEMMA_POD_ID = process.env.LEMMA_POD_ID;
const LEMMA_API_KEY = process.env.LEMMA_API_KEY || process.env.OPENCODE_API_KEY;

async function verifyLemmaConnection(): Promise<void> {
  if (!LEMMA_POD_ID || !LEMMA_API_KEY) return;
  try {
    const res = await fetch(`${LEMMA_API_URL}/pods/${LEMMA_POD_ID}/agents`, {
      headers: { "Authorization": `Bearer ${LEMMA_API_KEY}`, "Accept": "application/json" },
    });
    if (res.ok) {
      const data: any = await res.json();
      const agentNames = (data.items ?? []).map((a: any) => a.name).join(", ");
      console.log(`🔗 Lemma connected — pod: ${LEMMA_POD_ID}, agents: [${agentNames || "none"}]`);
    } else {
      console.warn(`⚠️  Lemma API responded ${res.status}: ${await res.text()}`);
    }
  } catch (err: any) {
    console.warn("⚠️  Could not reach Lemma API:", err.message || err);
  }
}

verifyLemmaConnection();

// -- Data Types
interface User {
  id: number;
  name: string;
  email: string;
  password: string; // hashed password
  createdAt: string;
}

interface Lead {
  id: number;
  name: string;
  company: string;
  baseScore: number;
  status: string;
  lastContactDate: string;
  promises: string[];
  conversationHistory: string[];
  followUpDraft?: string;
  closedAt?: string;
  outcome?: "won" | "lost" | "ghosted";
  closeReason?: string;
  closeTags?: string[];
}

// -- Database
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(raw) as User[];
    }
  } catch (err) {
    console.warn("⚠️  Could not read users.json:", err);
  }
  return [];
}

function saveUsers(data: User[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save users.json:", err);
    throw err;
  }
}

let users: User[] = loadUsers();
const activeTokens = new Map<string, number>(); // Map<token, userId>

function loadLeads(): Lead[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as Lead[];
    }
  } catch (err) {
    console.warn("⚠️  Could not read leads.json:", err);
  }
  return [];
}

function saveLeads(data: Lead[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save leads.json:", err);
    throw err;
  }
}

interface Settings {
  decayRate: number;
  thresholdHot: number;
  thresholdWarm: number;
}

const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function loadSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileData = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.warn("⚠️  Could not read settings.json, using default settings:", err);
  }
  return { decayRate: 3, thresholdHot: 70, thresholdWarm: 40 };
}

function saveSettings(data: Settings): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save settings.json:", err);
  }
}

let settings: Settings = loadSettings();
let leads: Lead[] = loadLeads();
console.log(`📂 Loaded ${leads.length} lead(s) from disk.`);

// -- Safe ID Generator
function nextId(): number {
  if (leads.length === 0) return 1;
  return Math.max(...leads.map(l => l.id)) + 1;
}

// -- Warmth Decay
function getWarmthScore(lead: Lead): number {
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(lead.lastContactDate).getTime()) / 86400000
  );
  // Score decays points per day without contact based on settings
  const decayed = lead.baseScore - daysSinceContact * settings.decayRate;
  return Math.max(0, Math.min(100, decayed));
}

function getStatus(score: number): string {
  if (score >= settings.thresholdHot) return "Hot";
  if (score >= settings.thresholdWarm) return "Warm";
  return "Cold";
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// -- AI Helpers
async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3001",
      "X-Title": "Local CRM"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat:free",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenRouter API error:", text);
    throw new Error("OpenRouter API error");
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function runLemmaAgent(agentName: string, promptText: string): Promise<string> {
  if (!LEMMA_POD_ID || !LEMMA_API_KEY) {
    return callAI(promptText);
  }
  try {
    const headers = {
      "Authorization": `Bearer ${LEMMA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // 1. Create a conversation for the agent
    const convRes = await fetch(`${LEMMA_API_URL}/pods/${LEMMA_POD_ID}/conversations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ agentName, title: `CRM Run ${agentName}` }),
    });
    if (!convRes.ok) {
      throw new Error(`Failed to create conversation: ${await convRes.text()}`);
    }
    const conversation = await convRes.json() as any;

    // 2. Send the message
    const msgRes = await fetch(`${LEMMA_API_URL}/pods/${LEMMA_POD_ID}/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: promptText }),
    });
    if (!msgRes.ok) {
      throw new Error(`Failed to send message: ${await msgRes.text()}`);
    }

    // 3. Poll for the assistant message
    let attempts = 0;
    while (attempts < 30) {
      const listRes = await fetch(`${LEMMA_API_URL}/pods/${LEMMA_POD_ID}/conversations/${conversation.id}/messages`, {
        headers,
      });
      if (listRes.ok) {
        const data = await listRes.json() as any;
        const messages = data.items ?? [];
        const assistantMessages = messages.filter((m: any) => m.role === "assistant" && m.kind === "TEXT" && m.text);
        if (assistantMessages.length > 0) {
          return assistantMessages[assistantMessages.length - 1].text;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }
    throw new Error(`Timeout waiting for agent ${agentName} reply`);
  } catch (err: any) {
    console.warn(`⚠️ Lemma Agent "${agentName}" failed, falling back to OpenRouter:`, err.message || err);
    return callAI(promptText);
  }
}

// -- Authentication Middleware
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  const userId = activeTokens.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
  req.userId = userId;
  req.user = users.find((u) => u.id === userId);
  next();
}

// -- Auth Endpoints
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  users = loadUsers();

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already registered" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: users.length === 0 ? 1 : Math.max(...users.map((u) => u.id)) + 1,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed", message: err.message, stack: err.stack });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = crypto.randomUUID();
    activeTokens.set(token, user.id);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", message: err.message, stack: err.stack });
  }
});

app.get("/api/auth/me", requireAuth, (req: any, res) => {
  res.json({ success: true, user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

// Protect all CRM endpoints
app.use("/api/leads", requireAuth);
app.use("/api/dashboard", requireAuth);
app.use("/api/analyze", requireAuth);
app.use("/api/draft-followup", requireAuth);
app.use("/api/archive", requireAuth);
app.use("/api/alerts", requireAuth);
app.use("/api/search", requireAuth);
app.use("/api/settings", requireAuth);
app.use("/api/reset", requireAuth);

// -- Routes

// GET settings
app.get("/api/settings", (req, res) => {
  res.json(settings);
});

// POST settings
app.post("/api/settings", (req, res) => {
  const { decayRate, thresholdHot, thresholdWarm } = req.body;
  if (decayRate !== undefined) settings.decayRate = Number(decayRate);
  if (thresholdHot !== undefined) settings.thresholdHot = Number(thresholdHot);
  if (thresholdWarm !== undefined) settings.thresholdWarm = Number(thresholdWarm);
  saveSettings(settings);
  res.json(settings);
});

// GET all leads with live warmth scores
app.get("/api/leads", (req, res) => {
  const activeLeads = leads.filter(l => !l.closedAt);
  const enriched = activeLeads.map((lead) => {
    const warmthScore = getWarmthScore(lead);
    return {
      ...lead,
      warmthScore,
      status: getStatus(warmthScore),
      daysSinceContact: getDaysSince(lead.lastContactDate),
      overdueFollowUp: getDaysSince(lead.lastContactDate) > 3,
    };
  });

  // Sort by overdue first, then warmth score
  enriched.sort((a, b) => {
    if (a.overdueFollowUp && !b.overdueFollowUp) return -1;
    if (!a.overdueFollowUp && b.overdueFollowUp) return 1;
    return b.warmthScore - a.warmthScore;
  });

  res.json(enriched);
});

// GET dashboard stats
app.get("/api/dashboard", (req, res) => {
  const activeLeads = leads.filter(l => !l.closedAt);
  const enriched = activeLeads.map((l) => ({
    ...l,
    warmthScore: getWarmthScore(l),
    overdueFollowUp: getDaysSince(l.lastContactDate) > 3,
  }));

  res.json({
    total: leads.length,
    hot: enriched.filter((l) => l.warmthScore >= 70).length,
    warm: enriched.filter((l) => l.warmthScore >= 40 && l.warmthScore < 70).length,
    cold: enriched.filter((l) => l.warmthScore < 40).length,
    overdueFollowUps: enriched.filter((l) => l.overdueFollowUp).length,
    totalPromises: enriched.reduce((sum, l) => sum + l.promises.length, 0),
  });
});

// POST analyze transcript → extract lead info + promises
app.post("/api/analyze", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: "No transcript" });

  try {
    const text = await runLemmaAgent("transcript-analyzer", `
You are a CRM memory assistant. Analyze this sales conversation and extract:
1. The prospect's name and company
2. A lead score 0-100 based on buying signals
3. Every promise or commitment made (by either party)
4. A one-line summary

Respond ONLY with valid JSON:
{
  "name": "Full Name",
  "company": "Company Name",
  "score": 75,
  "status": "Warm",
  "summary": "one line summary",
  "promises": ["promise 1", "promise 2"]
}
Score: 70-100 = Hot, 40-69 = Warm, 0-39 = Cold.

Conversation:
${transcript}
    `);

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Add to leads database
    const newLead: Lead = {
      id: nextId(),
      name: parsed.name,
      company: parsed.company,
      baseScore: parsed.score,
      status: parsed.status,
      lastContactDate: new Date().toISOString(),
      promises: parsed.promises || [],
      conversationHistory: [transcript.slice(0, 300)],
    };
    leads.push(newLead);
    saveLeads(leads);

    res.json({ ...parsed, id: newLead.id });
  } catch (err: any) {
    console.error("❌ Transcript analysis failed:", err);
    res.status(500).json({ error: "Failed to analyze transcript. Please try again." });
  }
});

// POST generate 1-click follow-up draft
app.post("/api/draft-followup/:id", async (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const warmthScore = getWarmthScore(lead);
  const daysSince = getDaysSince(lead.lastContactDate);

  try {
    const draft = await runLemmaAgent("follow-up-draft-agent", `
You are a sales assistant. Write a short, natural follow-up email for this lead.

Lead: ${lead.name} from ${lead.company}
Days since last contact: ${daysSince}
Current warmth score: ${warmthScore}/100
Promises made: ${lead.promises.join(", ")}
Last conversation: ${lead.conversationHistory[lead.conversationHistory.length - 1]}

Write a friendly 3-4 sentence follow-up email. Subject line first, then body.
Keep it human, not salesy. Reference the specific promises made.
    `);

    lead.followUpDraft = draft;
    res.json({ draft });
  } catch {
    const draft = `Subject: Following up — ${lead.company}\n\nHi ${lead.name.split(" ")[0]},\n\nJust following up on our last conversation. I wanted to make sure I delivered on my promise to ${lead.promises[0] || "follow up with you"}.\n\nLet me know if you have any questions!\n\nBest regards`;
    lead.followUpDraft = draft;
    res.json({ draft });
  }
});

// POST add conversation note to existing lead
app.post("/api/leads/:id/note", (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const { note, newPromises } = req.body;
  if (note) lead.conversationHistory.push(note);
  if (Array.isArray(newPromises)) {
    lead.promises.push(...newPromises);
  } else if (typeof newPromises === "string" && newPromises.trim() !== "") {
    lead.promises.push(newPromises);
  }
  lead.baseScore = getWarmthScore(lead); // update baseScore before resetting date
  lead.lastContactDate = new Date().toISOString(); // reset warmth decay
  saveLeads(leads);

  res.json({ success: true, lead });
});

// POST mark promise as done
app.post("/api/leads/:id/promise-done", (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const { promise } = req.body;
  lead.promises = lead.promises.filter((p) => p !== promise);
  saveLeads(leads);
  res.json({ success: true });
});
// Manual lead creation
app.post("/api/leads", (req, res) => {
  const { name, company, score, status, promises } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid 'name'" });
  }
  if (!company || typeof company !== "string" || company.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid 'company'" });
  }

  const newLead: Lead = {
    id: nextId(),
    name: name.trim(),
    company: company.trim(),
    baseScore: score || 60,
    status: status || "Warm",
    lastContactDate: new Date().toISOString(),
    promises: promises ? [promises] : [],
    conversationHistory: ["Lead added manually"],
  };
  leads.push(newLead);
  saveLeads(leads);
  res.json(newLead);
});
// Close a deal
app.post("/api/leads/:id/close", async (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const { outcome, closeReason } = req.body;
  if (!outcome || !["won", "lost", "ghosted"].includes(outcome))
    return res.status(400).json({ error: "outcome must be won | lost | ghosted" });

  let closeTags: string[] = [];
  if (closeReason) {
    try {
      const text = await callAI(`
You are a CRM analyst. Given this deal close reason, extract 1-3 short category tags.
Outcome: ${outcome}
Reason: "${closeReason}"
Lead: ${lead.name} from ${lead.company}
Return ONLY valid JSON — no markdown:
{ "tags": ["tag1", "tag2"] }
Tag examples for lost: "price", "competitor", "timing", "no budget", "ghosted", "bad fit"
Tag examples for won: "strong roi", "champion", "urgency", "demo success", "referral"
Keep each tag under 3 words, lowercase.`);
      closeTags = JSON.parse(text.replace(/```json|```/g, "").trim()).tags ?? [];
    } catch { closeTags = []; }
  }

  lead.outcome = outcome;
  lead.closeReason = closeReason || "";
  lead.closeTags = closeTags;
  lead.closedAt = new Date().toISOString();
  lead.status = outcome === "won" ? "Closed Won" : outcome === "lost" ? "Closed Lost" : "Ghosted";
  saveLeads(leads);
  res.json({ success: true, lead });
});

// Get all closed deals
app.get("/api/archive", (req, res) => {
  const closed = leads
    .filter((l) => l.closedAt)
    .map((l) => ({
      ...l,
      warmthScore: getWarmthScore(l),
      daysSinceContact: getDaysSince(l.lastContactDate),
    }))
    .sort((a, b) => new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime());
  res.json(closed);
});

// Generic AI chat endpoint for the frontend
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const text = await callAI(prompt);
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get win/loss stats
app.get("/api/archive/stats", (req, res) => {
  const closed = leads.filter((l) => l.closedAt);
  const won = closed.filter((l) => l.outcome === "won");
  const lost = closed.filter((l) => l.outcome === "lost");
  const ghosted = closed.filter((l) => l.outcome === "ghosted");

  const tagCounts: Record<string, { won: number; lost: number; ghosted: number }> = {};
  closed.forEach((l) => {
    (l.closeTags ?? []).forEach((tag) => {
      if (!tagCounts[tag]) tagCounts[tag] = { won: 0, lost: 0, ghosted: 0 };
      if (l.outcome) tagCounts[tag][l.outcome]++;
    });
  });

  const topTags = Object.entries(tagCounts)
    .map(([tag, counts]) => ({ tag, ...counts, total: counts.won + counts.lost + counts.ghosted }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  res.json({
    total: closed.length,
    won: won.length, lost: lost.length, ghosted: ghosted.length,
    winRate: closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0,
    topTags,
  });
});
// What did I promise? Memory recall
app.post("/api/leads/:id/recall-promises", async (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const warmthScore = getWarmthScore(lead);
  const daysSince = getDaysSince(lead.lastContactDate);

  try {
    const text = await runLemmaAgent("memory-agent", `
You are a CRM memory assistant. A salesperson is asking: "What did I promise this lead?"

Lead: ${lead.name} from ${lead.company}
Days since last contact: ${daysSince}
Current warmth score: ${warmthScore}/100
Open promises list: ${JSON.stringify(lead.promises)}
Full conversation history:
${lead.conversationHistory.map((h, i) => `[${i + 1}] ${h}`).join("\n")}

Extract every commitment or promise made — both from the promises list AND from conversation history.
Return ONLY valid JSON, no markdown:
{
  "promises": [
    {
      "text": "what was promised",
      "source": "explicit",
      "urgency": "high",
      "status": "open"
    }
  ],
  "summary": "One sentence memory summary of this lead relationship"
}

Rules:
- source: "explicit" = directly in promises list, "inferred" = from conversation notes
- urgency: "high" = time-sensitive or overdue, "medium" = mentioned but no deadline, "low" = vague future intent
- Include ALL promises found`);

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json({ leadName: lead.name, company: lead.company, daysSince, warmthScore, ...parsed });
  } catch {
    res.json({
      leadName: lead.name, company: lead.company, daysSince, warmthScore,
      promises: lead.promises.map(p => ({
        text: p, source: "explicit", urgency: "medium", status: "open",
      })),
      summary: `${lead.name} from ${lead.company}. ${lead.promises.length} open promise(s).`,
    });
  }
});
// Cold alert digest
app.get("/api/alerts", async (req, res) => {
  const enriched = leads
    .filter((l) => !l.closedAt)
    .map((l) => ({
      ...l,
      warmthScore: getWarmthScore(l),
      daysSinceContact: getDaysSince(l.lastContactDate),
      overdueFollowUp: getDaysSince(l.lastContactDate) > 3,
    }));

  const cold = enriched.filter((l) => l.warmthScore < 35);
  const overdue = enriched.filter((l) => l.overdueFollowUp && l.warmthScore >= 35);

  const alerts = [
    ...cold.map((l) => ({ ...l, reason: "going_cold" as const, lastNote: l.conversationHistory[l.conversationHistory.length - 1] ?? "" })),
    ...overdue.map((l) => ({ ...l, reason: "overdue" as const, lastNote: l.conversationHistory[l.conversationHistory.length - 1] ?? "" })),
  ];

  if (alerts.length === 0) return res.json({ alerts: [], aiInsight: null });

  try {
    const text = await runLemmaAgent("cold-alert-agent", `
You are a CRM alert assistant. For each at-risk lead, write a 1-sentence action insight.
Leads: ${JSON.stringify(alerts.map(a => ({ id: a.id, name: a.name, company: a.company, warmthScore: a.warmthScore, daysSinceContact: a.daysSinceContact, promises: a.promises, lastNote: a.lastNote, reason: a.reason })), null, 2)}
Return ONLY valid JSON:
{ "insights": [{ "id": 1, "insight": "one sentence action tip" }], "summary": "one sentence overall warning" }
Rules: reference specific promise or last note, be direct and action-oriented.`);

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const withInsights = alerts.map((a) => ({
      ...a,
      insight: parsed.insights?.find((i: any) => i.id === a.id)?.insight ?? `Contact ${a.name} today.`,
    }));
    res.json({ alerts: withInsights, aiInsight: parsed.summary });
  } catch {
    const withInsights = alerts.map((a) => ({
      ...a,
      insight: a.reason === "going_cold"
        ? `${a.name}'s warmth is at ${a.warmthScore} — contact them today.`
        : `${a.name} follow-up is ${a.daysSinceContact} days overdue.`,
    }));
    res.json({ alerts: withInsights, aiInsight: `${alerts.length} lead(s) need immediate attention.` });
  }
});

// Draft re-engagement message
app.post("/api/alerts/:id/draft-reengagement", async (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const warmthScore = getWarmthScore(lead);
  const daysSince = getDaysSince(lead.lastContactDate);

  try {
    const draft = await callAI(`
Write a short re-engagement email for a cold lead.
Lead: ${lead.name} from ${lead.company}
Days since last contact: ${daysSince}
Warmth: ${warmthScore}/100
Open promises: ${lead.promises.join(", ") || "none"}
Last conversation: ${lead.conversationHistory[lead.conversationHistory.length - 1] ?? "no notes"}
Write 2-3 sentences. Subject line first, then body. Human and warm, not pushy. Reference the last promise.`);
    res.json({ draft });
  } catch {
    const firstName = lead.name.split(" ")[0];
    res.json({
      draft: `Subject: Checking in — ${lead.company}\n\nHi ${firstName},\n\nJust checking in — it's been a while. I wanted to follow up on ${lead.promises[0] ?? "our last conversation"} and see if there's anything I can help with.\n\nLooking forward to hearing from you!`,
    });
  }
});
// Pre-call briefing
app.post("/api/leads/:id/pre-call-brief", async (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const warmthScore = getWarmthScore(lead);
  const daysSince = getDaysSince(lead.lastContactDate);
  const trend = warmthScore >= lead.baseScore - 6 ? "stable" : warmthScore >= lead.baseScore - 15 ? "declining" : "critical";

  try {
    const text = await runLemmaAgent("pre-call-brief-agent", `
You are an expert sales coach preparing a salesperson for a call.
Lead: ${lead.name} from ${lead.company}
Warmth: ${warmthScore}/100 (base was ${lead.baseScore}), trend: ${trend}
Days since last contact: ${daysSince}
Open promises: ${JSON.stringify(lead.promises)}
Conversation history:
${lead.conversationHistory.map((h, i) => `[${i + 1}] ${h}`).join("\n")}

Return ONLY valid JSON:
{
  "lastDiscussed": "one sentence summary of last conversation",
  "openPromises": ["promise 1"],
  "objections": ["objection raised"],
  "suggestedOpener": "specific natural opening line referencing last conversation",
  "mainObjective": "single most important thing to achieve on this call",
  "warmthTrend": "${trend}",
  "talkingPoints": ["point 1", "point 2", "point 3"],
  "risksToAvoid": ["risk 1"]
}
Rules: suggestedOpener must reference a specific detail. talkingPoints exactly 3. Everything specific to this lead, never generic.`);

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ leadName: lead.name, company: lead.company, warmthScore, daysSince, ...parsed });
  } catch {
    res.json({
      leadName: lead.name, company: lead.company, warmthScore, daysSince,
      lastDiscussed: lead.conversationHistory[lead.conversationHistory.length - 1] ?? "No notes yet.",
      openPromises: lead.promises, objections: [],
      suggestedOpener: `Hi ${lead.name.split(" ")[0]}, just following up from our last conversation.`,
      mainObjective: `Follow up on: ${lead.promises[0] ?? "last discussion"}`,
      warmthTrend: trend,
      talkingPoints: ["Reference your last conversation", "Address open promises", "Confirm next steps"],
      risksToAvoid: ["Don't rush the conversation"],
    });
  }
});
// Reopen a closed deal
app.post("/api/leads/:id/reopen", (req, res) => {
  const lead = leads.find((l) => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  lead.closedAt = undefined;
  lead.outcome = undefined;
  lead.closeReason = undefined;
  lead.closeTags = undefined;
  lead.status = "Warm";
  lead.lastContactDate = new Date().toISOString();
  lead.conversationHistory.push("Deal reopened — returning to active pipeline.");
  saveLeads(leads);

  res.json({ success: true, lead });
});
// Natural language lead search
app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "No query" });

  const active = leads
    .filter((l) => !l.closedAt)
    .map((l) => ({
      id: l.id, name: l.name, company: l.company,
      warmthScore: getWarmthScore(l),
      daysSinceContact: getDaysSince(l.lastContactDate),
      overdueFollowUp: getDaysSince(l.lastContactDate) > 3,
      promises: l.promises, status: l.status,
      conversationHistory: l.conversationHistory,
    }));

  try {
    const text = await callAI(`
You are a CRM search assistant. The user typed a natural language query to find leads.
All active leads: ${JSON.stringify(active, null, 2)}
User query: "${query}"
Return ONLY valid JSON:
{ "matchedIds": [1, 2], "explanation": "One sentence explaining what you found and why" }
Rules:
- Match based on: names, companies, warmth score ranges, overdue status, promises, conversation content
- "show leads going cold" → warmthScore < 40
- "who did I promise a demo to" → promises containing demo text
- "overdue more than 5 days" → daysSinceContact > 5
- "hot leads" → warmthScore >= 70
- "cold leads" → warmthScore < 35
- "who needs follow up" → overdueFollowUp === true
- explanation must be specific, never generic`);

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const results = active.filter((l) => parsed.matchedIds.includes(l.id));
    res.json({ results, explanation: parsed.explanation, query });
  } catch {
    const q = query.toLowerCase();
    const results = active.filter(
      (l) => l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.promises.some((p) => p.toLowerCase().includes(q))
    );
    res.json({ results, explanation: `Found ${results.length} lead(s) matching "${query}"`, query });
  }
});
app.delete("/api/reset", (req, res) => {
  const secret = req.query.secret;
  const expectedSecret = process.env.RESET_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  leads = [];
  saveLeads(leads);
  res.json({ message: "Leads database reset successfully" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));