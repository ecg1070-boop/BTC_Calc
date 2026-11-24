// Each factor is the exact number of satoshis in one unit.
const UNITS = [
  { id: "max", name: "Algorithmic max", sats: 2_099_999_997_690_000n },
  { id: "MBTC", name: "megaBitcoin (MBTC)", sats: 100_000_000_000_000n },
  { id: "kBTC", name: "kiloBitcoin (kBTC)", sats: 100_000_000_000n },
  { id: "daBTC", name: "decaBitcoin (daBTC)", sats: 1_000_000_000n },
  { id: "btc", name: "bitcoin (BTC)", sats: 100_000_000n },
  { id: "dBTC", name: "deciBitcoin (dBTC)", sats: 10_000_000n },
  { id: "cBTC", name: "centiBitcoin (cBTC)", sats: 1_000_000n },
  { id: "mBTC", name: "milliBitcoin (mBTC)", sats: 100_000n },
  { id: "uBTC", name: "microBitcoin (uBTC)", sats: 100n },
  { id: "finney", name: "finney", sats: 10n },
  { id: "sat", name: "satoshi (sat)", sats: 1n },
];
const SATS_PER_BTC = 100_000_000n;
const MAX_INPUT_DECIMALS = 24;
const formatInteger = new Intl.NumberFormat("en-US");
const amountEl = document.getElementById("amount");
const unitEl = document.getElementById("unit");
const resultsEl = document.getElementById("results");
const errorEl = document.getElementById("error");

for (const unit of UNITS) {
  unitEl.add(new Option(unit.name, unit.id, false, unit.id === "sat"));
}

// Parse a decimal as an integer numerator and a power-of-ten denominator.
function parseAmount(raw) {
  const value = raw.trim().replace(/[,_\s]/g, "");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error("Enter a valid non-negative number.");
  }
  const [whole, fraction = ""] = value.split(".");
  const decimals = fraction.replace(/0+$/, "");
  if (decimals.length > MAX_INPUT_DECIMALS) {
    throw new Error(`Use up to ${MAX_INPUT_DECIMALS} decimal places.`);
  }
  return {
    numerator: BigInt(`${whole || "0"}${decimals}`),
    denominator: 10n ** BigInt(decimals.length),
  };
}

// Standard units terminate exactly; only the supply ratio may need rounding.
function formatRatio(numerator, denominator, places) {
  const scale = 10n ** BigInt(places);
  const scaled = numerator * scale;
  const remainder = scaled % denominator;
  const rounded = scaled / denominator + (remainder * 2n >= denominator ? 1n : 0n);
  const whole = formatInteger.format(rounded / scale);
  const decimals = (rounded % scale).toString().padStart(places, "0").replace(/0+$/, "");
  return `${remainder ? "≈ " : ""}${whole}${decimals ? `.${decimals}` : ""}`;
}

function makeRow(unit, from, quantity) {
  const row = document.createElement("tr");
  const unitCell = document.createElement("th");
  const reference = document.createElement("span");
  const result = document.createElement("td");
  unitCell.scope = "row";
  unitCell.textContent = unit.name;
  reference.className = "reference";
  reference.textContent = `1 ${unit.id === "max" ? "max" : "unit"} = ${formatRatio(unit.sats, SATS_PER_BTC, 8)} BTC`;
  unitCell.append(reference);
  result.className = "value";
  if (quantity) {
    const numerator = quantity.numerator * from.sats;
    const denominator = quantity.denominator * unit.sats;
    const places = unit.id === "max"
      ? Math.max(24, denominator.toString().length - numerator.toString().length + 7)
      : denominator.toString().length - 1;
    result.textContent = formatRatio(numerator, denominator, places);
  } else {
    result.textContent = "–";
  }
  if (unit === from) {
    row.className = "selected";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Input";
    result.append(badge);
  }
  row.append(unitCell, result);
  return row;
}

function update() {
  const from = UNITS.find(unit => unit.id === unitEl.value);
  let quantity;
  let message = "";
  try {
    quantity = parseAmount(amountEl.value);
  } catch (error) {
    message = amountEl.value.trim() ? error.message : "Enter an amount to see conversions.";
  }
  errorEl.textContent = message;
  amountEl.setAttribute("aria-invalid", String(Boolean(!quantity && amountEl.value.trim())));
  resultsEl.replaceChildren(...UNITS.map(unit => makeRow(unit, from, quantity)));
}

amountEl.addEventListener("input", update);
unitEl.addEventListener("change", update);
update();
