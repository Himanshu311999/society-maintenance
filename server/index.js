import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { getLedger, recordPayment, deletePayment, resetLedger, updateSettings } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/ledger", async (req, res) => {
  try {
    res.json(await getLedger());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/flats/:flatId/payments", async (req, res) => {
  const { flatId } = req.params;
  const { amount, mode } = req.body;
  try {
    const result = await recordPayment(flatId, Number(amount), mode || "Cash");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete("/api/flats/:flatId/payments/:paymentId", async (req, res) => {
  const { flatId, paymentId } = req.params;
  try {
    const ledger = await deletePayment(flatId, paymentId);
    res.json({ ledger });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put("/api/settings", async (req, res) => {
  const { monthlyAmount } = req.body;
  try {
    const ledger = await updateSettings(Number(monthlyAmount));
    res.json({ ledger });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/reset", async (req, res) => {
  try {
    res.json({ ledger: await resetLedger() });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

const port = process.env.BACKEND_PORT || process.env.PORT || 4000;
const host = process.env.BACKEND_HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Backend running on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});
