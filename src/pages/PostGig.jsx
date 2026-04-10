import { useState } from "react";
import { MapPin, Lock, Award, Utensils, Printer, Package, FileText, Bike, MessageCircle, Loader } from "lucide-react";
import { postNewGig } from "../lib/profile";
import TopBar from "../components/TopBar";

const ICON_MAP = {
  Utensils: <Utensils size={15} />,
  Printer: <Printer size={15} />,
  Package: <Package size={15} />,
  FileText: <FileText size={15} />,
  Bike: <Bike size={15} />,
  MessageCircle: <MessageCircle size={15} />,
};

const CATS = [
  { icon: "Utensils", label: "Food" },
  { icon: "Printer", label: "Print" },
  { icon: "Package", label: "Errand" },
  { icon: "FileText", label: "Notes" },
  { icon: "Bike", label: "Delivery" },
  { icon: "MessageCircle", label: "Other" },
];

export default function PostGig({ setScreen }) {
  const [cat, setCat] = useState("Food");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("0");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  async function handlePost() {
    if (!title.trim()) {
      setError("Please describe the task.");
      return;
    }

    setPosting(true);
    setError(null);

    const { error: postError } = await postNewGig({
      title: title.trim(),
      categoryLabel: cat,
      price: parseFloat(price) || 0,
      location: location.trim() || null,
    });

    if (postError) {
      setError(postError.message || "Failed to post gig.");
      setPosting(false);
      return;
    }

    setScreen("home");
  }

  return (
    <div className="page fadein">
      <TopBar title="Post a gig" onBack={() => setScreen("home")} />

      <div className="scroll" style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 100 }}>
        <div className="field">
          <label className="lbl">Category</label>
          <div className="cat-grid">
            {CATS.map((c) => (
              <div key={c.label} className={`cat ${cat === c.label ? "on" : ""}`} onClick={() => setCat(c.label)}>
                <div className="cico">{ICON_MAP[c.icon]}</div>
                <span className="clbl">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="lbl">Task description</label>
          <textarea
            className="ta"
            placeholder="Describe exactly what you need. Be specific — better descriptions get done faster."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="lbl">
            Offer <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>— $0 is fine</span>
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--bd)",
              borderRadius: "var(--r)",
              background: "var(--bg)",
              overflow: "hidden",
              transition: "border-color .12s",
            }}
          >
            <div
              style={{
                height: 40,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                background: "var(--bg3)",
                borderRight: "1px solid var(--bd)",
                fontFamily: "var(--mono)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              $
            </div>
            <input
              style={{
                flex: 1,
                height: 40,
                border: "none",
                outline: "none",
                padding: "0 12px",
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--fg)",
                letterSpacing: "-.04em",
                background: "transparent",
              }}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <span className="hint">+1 Rep just for posting. Your taker earns +10 Rep when they complete it.</span>
        </div>

        <div className="field">
          <label className="lbl">Gig location</label>
          <div className="ig">
            <div className="iad">
              <MapPin size={13} />
            </div>
            <input
              className="ii"
              placeholder="e.g. Science Hall Room 118A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="callout">
          <div className="ci">
            <Lock size={13} />
          </div>
          <span className="ct">
            <strong>Payment info is private.</strong> Your Venmo/Cash App from your profile is only shared once both parties accept the gig.
          </span>
        </div>

        <div className="callout" style={{ background: "var(--green-bg)", borderColor: "var(--green-bd)" }}>
          <div className="ci" style={{ color: "var(--green-d)" }}>
            <Award size={13} />
          </div>
          <span className="ct" style={{ color: "var(--green-text)" }}>
            <strong>+1 Rep</strong> for posting this gig. Taker earns +10 on completion, +5 for a 5-star rating from you.
          </span>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          className="btn bp bfull blg"
          onClick={handlePost}
          disabled={posting}
          style={{ opacity: posting ? 0.7 : 1 }}
        >
          {posting ? <Loader size={16} className="spin" /> : "Post gig"}
        </button>
      </div>
    </div>
  );
}
