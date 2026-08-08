const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");


async function getCloudinaryAITags(localPath, resourceType, publicId) {
  try {
    if (resourceType !== "image") return [];

    const categorizationModel = "aws_rek_tagging";

    // If the file is already on Cloudinary, just request tags via explicit API
    // (avoids uploading twice). Falls back to upload if no publicId yet.
    if (publicId) {
      const result = await cloudinary.uploader.explicit(publicId, {
        type: "upload",
        resource_type: resourceType,
        auto_tagging: 0.7, // confidence threshold 0–1
        categorization: categorizationModel,
      });
      return extractTags(result);
    }

    // Fallback: upload with tagging enabled
    const result = await cloudinary.uploader.upload(localPath, {
      resource_type: resourceType,
      auto_tagging: 0.7,
      categorization: categorizationModel,
    });
    return extractTags(result);
  } catch (err) {
    console.error("[getCloudinaryAITags]", err.message);
    return [];
  }
}

function normalizeConfidence(value) {
  if (typeof value !== "number") return 0;
  if (value > 1) return value / 100; // Cloudinary may return 0-100 values
  return value;
}

function extractTags(cloudinaryResult, minConfidence = 0.7) {
  const tags = new Set();

  // Simple tags array from Cloudinary is already filtered by auto_tagging.
  (cloudinaryResult.tags || []).forEach(t => tags.add(t.toLowerCase()));

  // Categorization data (aws_rek_tagging, google_tagging, etc.)
  const cats = cloudinaryResult.info?.categorization;
  if (cats) {
    Object.values(cats).forEach(cat => {
      (cat.data || []).forEach(item => {
        if (!item.tag) return;
        const confidence = normalizeConfidence(item.confidence ?? item.score ?? item.probability ?? 0);
        if (confidence >= minConfidence) {
          tags.add(item.tag.toLowerCase());
        }
      });
    });
  }

  return [...tags];
}

async function generateImageTags(localPath, publicId) {
  return getCloudinaryAITags(localPath, "image", publicId);
}


async function generateVideoTags(localPath, publicId) {
  return [];
}
async function extractPDFText(localPath) {
  try {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(localPath);
    const data = await pdfParse(buffer);
    return (data.text || "").trim().slice(0, 50000);
  } catch (err) {
    console.error("[extractPDFText]", err.message);
    return "";
  }
}
async function extractDocxText(localPath) {
  try {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: localPath });
    return (result.value || "").trim().slice(0, 50000);
  } catch (err) {
    console.error("[extractDocxText]", err.message);
    return "";
  }
}

async function processDocument(localPath, mimetype) {
  if (mimetype === "application/pdf") {
    const text = await extractPDFText(localPath);
    // Build simple keyword tags from the first 500 chars for bonus tag search
    const tags = buildKeywordTags(text);
    return { extractedText: text, tags };
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const text = await extractDocxText(localPath);
    const tags = buildKeywordTags(text);
    return { extractedText: text, tags };
  }

  return { extractedText: "", tags: [] };
}

function buildKeywordTags(text) {
  if (!text) return [];
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
    "has", "have", "had", "it", "its", "this", "that", "these", "those",
    "i", "we", "you", "he", "she", "they", "my", "our", "your", "his", "her",
  ]);
  const freq = {};
  text.toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);
}

module.exports = {
  generateImageTags,
  generateVideoTags,
  processDocument,
};
