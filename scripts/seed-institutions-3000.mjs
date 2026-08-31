import fs from "node:fs";
import path from "node:path";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

function normalizeWhitespace(input) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function cleanMojibake(input) {
  if (input == null) return null;
  const cleaned = String(input)
    .replace(/ï¿½/g, " ")
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€�/g, '"')
    .replace(/Â/g, " ")
    .replace(/\u0000/g, " ");
  const collapsed = normalizeWhitespace(cleaned);
  return collapsed || null;
}

function unescapeSqlText(input) {
  return input.replace(/''/g, "'");
}

function makeNormalizedName(name) {
  return normalizeWhitespace(
    String(name || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " "),
  );
}

function parseHydSeedRows(sqlText) {
  const rows = [];
  const pattern =
    /\('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)',(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\),?/g;

  let m = null;
  while ((m = pattern.exec(sqlText))) {
    const name = cleanMojibake(unescapeSqlText(m[1]));
    const normalizedFromSql = cleanMojibake(unescapeSqlText(m[2]));
    const address = cleanMojibake(unescapeSqlText(m[4]));
    const area = cleanMojibake(unescapeSqlText(m[5]));
    const city = cleanMojibake(unescapeSqlText(m[6]));
    const state = cleanMojibake(unescapeSqlText(m[7]));
    const phone = cleanMojibake(unescapeSqlText(m[8]));

    if (!name) continue;
    rows.push({
      name,
      normalized_name: normalizedFromSql || makeNormalizedName(name),
      institution_type: "School",
      brand_relevance: "both",
      address_line_1: address,
      area,
      city,
      state,
      primary_contact_phone: phone && phone.toLowerCase() !== "nan" ? phone : null,
      country: "India",
      current_lead_stage: "new_lead",
      is_active: true,
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.normalized_name}|${(row.city || "").toLowerCase()}|${(row.area || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

async function fetchCount(url, serviceKey) {
  const res = await fetch(`${url}/rest/v1/institutions?select=id`, {
    method: "GET",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "count=exact",
    },
  });
  const range = res.headers.get("content-range") || "";
  const parts = range.split("/");
  const total = Number(parts[1] || "0");
  return Number.isFinite(total) ? total : 0;
}

async function main() {
  const root = process.cwd();
  const env = {
    ...readEnvFile(path.join(root, ".env")),
    ...readEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sqlPath = path.join(root, "supabase", "school_list_hyd_replace.sql");
  const sqlText = fs.readFileSync(sqlPath, "utf8");
  const rows = parseHydSeedRows(sqlText);
  if (rows.length < 3000) {
    console.error(`Parsed only ${rows.length} rows; expected at least 3000.`);
    process.exit(1);
  }

  const before = await fetchCount(supabaseUrl, serviceKey);
  console.log(`institutions_before=${before}`);
  console.log(`parsed_rows=${rows.length}`);

  const chunkSize = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${supabaseUrl}/rest/v1/institutions`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      failed += chunk.length;
      const body = await res.text();
      console.error(`chunk_failed start=${i} count=${chunk.length} status=${res.status} body=${body.slice(0, 260)}`);
      continue;
    }
    inserted += chunk.length;
    console.log(`chunk_ok start=${i} count=${chunk.length}`);
  }

  const after = await fetchCount(supabaseUrl, serviceKey);
  console.log(`institutions_after=${after}`);
  console.log(`inserted_attempted_ok=${inserted}`);
  console.log(`inserted_failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

