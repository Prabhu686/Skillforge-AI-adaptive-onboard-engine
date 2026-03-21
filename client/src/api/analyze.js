export async function analyzeDocuments(resumeFile, jdFile) {
  const form = new FormData();
  form.append("resume", resumeFile);
  form.append("jd",     jdFile);

  const res = await fetch("/api/analyze", { method: "POST", body: form });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `Server error ${res.status}`);
  }
  return res.json();
}
