import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#4f46e5", "#7c3aed", "#a855f7"];

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
      active
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    {children}
  </button>
);

const Card = ({ text, icon }) => (
  <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
    <span className="text-xl">{icon}</span>
    <span className="text-gray-700 leading-relaxed">{text}</span>
  </div>
);

const Tag = ({ text }) => (
  <span className="inline-block bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-sm mr-2 mb-2">
    {text}
  </span>
);

const RiskMeter = ({ value }) => {
  const color = value < 40 ? "bg-green-500" : value < 70 ? "bg-yellow-500" : "bg-red-500";
  const label = value < 40 ? "נמוך" : value < 70 ? "בינוני" : "גבוה";
  const textColor = value < 40 ? "text-green-600" : value < 70 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="mt-6 mb-6">
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-gray-700">רמת סיכון</span>
        <span className={`font-bold ${textColor}`}>{label} ({value}%)</span>
      </div>
      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export default function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("doctor");

  const handleTranslate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        setError(err.detail);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setResult(data);
      setActiveTab("doctor");
    } catch {
      setError("שגיאה בחיבור לשרת");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <div className="bg-gradient-to-l from-indigo-600 to-purple-700 px-8 py-8 text-white">
        <h1 className="text-3xl font-bold">🏥 Medical Paper Translator</h1>
        <p className="mt-2 opacity-80">העלי מאמר רפואי וקבלי הסבר בשלוש רמות</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-8 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">📄 העלי קובץ PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => { setFile(e.target.files[0]); setError(null); setResult(null); }}
            className="block mb-5 text-sm text-gray-500"
          />
          <button
            onClick={handleTranslate}
            disabled={!file || loading}
            className={`px-8 py-3 rounded-xl text-white font-semibold text-base transition-all ${
              !file || loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200"
            }`}
          >
            {loading ? "⏳ מעבד את המאמר..." : "✨ תרגם"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 font-medium">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex border-b border-gray-200 px-6">
              <TabButton active={activeTab === "doctor"} onClick={() => setActiveTab("doctor")}>👨‍⚕️ רופא</TabButton>
              <TabButton active={activeTab === "patient"} onClick={() => setActiveTab("patient")}>🙋 מטופל</TabButton>
              <TabButton active={activeTab === "child"} onClick={() => setActiveTab("child")}>👧 ילד</TabButton>
            </div>

            <div className="p-8">
              {activeTab === "doctor" && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-base mb-6">{result.doctor.summary}</p>
                  <h3 className="font-bold text-gray-800 mb-4">📊 נתונים סטטיסטיים</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={result.doctor.stats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {result.doctor.stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <h3 className="font-bold text-gray-800 mt-6 mb-4">🔬 ממצאים עיקריים</h3>
                  {result.doctor.findings.map((f, i) => <Card key={i} text={f} icon="🔬" />)}
                  <h3 className="font-bold text-gray-800 mt-6 mb-3">🏷️ מילות מפתח</h3>
                  <div>{result.doctor.keywords.map((k, i) => <Tag key={i} text={k} />)}</div>
                </div>
              )}

              {activeTab === "patient" && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg mb-2">{result.patient.summary}</p>
                  <RiskMeter value={result.patient.risk_level} />
                  <h3 className="font-bold text-gray-800 mb-4">⚠️ תסמינים רלוונטיים</h3>
                  {result.patient.symptoms.map((s, i) => <Card key={i} text={s} icon="⚠️" />)}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-5">
                    <p className="font-semibold text-green-800 mb-1">💡 מה חשוב לדעת:</p>
                    <p className="text-green-700 leading-relaxed">{result.patient.takeaway}</p>
                  </div>
                </div>
              )}

              {activeTab === "child" && (
                <div className="text-center">
                  <div className="text-5xl mb-6 tracking-widest">
                    {result.child.emoji_summary?.join(" ")}
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-amber-200 rounded-2xl p-8 text-lg leading-9 text-gray-700 text-right shadow-inner">
                    {result.child.story}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}