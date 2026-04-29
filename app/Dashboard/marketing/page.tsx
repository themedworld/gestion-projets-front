"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("simple"); // simple / enriched
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_Image_generation_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">AI Image Generator</h1>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
        className="border p-2 mr-2 w-96"
      />

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="border p-2 mr-2"
      >
        <option value="simple">Simple</option>
        <option value="enriched">Enriched</option>
      </select>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Result</h2>
          <p><strong>Original Prompt:</strong> {result.original_prompt}</p>
          <p><strong>Used Prompt:</strong> {result.used_prompt}</p>
          {result.enriched_prompt && (
            <p><strong>Enriched Prompt:</strong> {result.enriched_prompt}</p>
          )}

          {result.image_base64 && (
            <div className="mt-4">
              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt="Generated"
                className="border shadow-md max-w-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
