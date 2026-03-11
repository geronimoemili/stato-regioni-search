import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

console.log("Scraper avviato");

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} else {
  console.log("Variabili Supabase non impostate, modalità test locale.");
}

const BASE = "https://www.statoregioni.it";

// Funzione con retry automatico
async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        },
        timeout: 20000
      });
    } catch (err) {
      console.log(`Tentativo ${i + 1} fallito per ${url}`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function getSedute(year) {
  const url = `${BASE}/it/conferenza-stato-regioni/sedute-${year}/`;
  console.log("\nLeggo:", url);

  const response = await fetchWithRetry(url);
  const html = response.data;

  const $ = cheerio.load(html);

  const links = [];

  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("seduta-del")) {
      links.push(BASE + href);
    }
  });

  console.log("Trovate sedute:", links.length);
  return links;
}

async function main() {
  console.log("Inizio scraping...");

  let allSedute = [];

  for (let year = 2022; year <= 2026; year++) {
    const sedute = await getSedute(year);
    allSedute = allSedute.concat(sedute);
  }

  console.log("\nTotale sedute trovate:", allSedute.length);
  console.log(allSedute);
}

main();
