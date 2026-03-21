const pdfParse = require("pdf-parse");

async function extractText(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  // plain text / docx fallback — treat buffer as UTF-8
  return buffer.toString("utf-8");
}

module.exports = { extractText };
