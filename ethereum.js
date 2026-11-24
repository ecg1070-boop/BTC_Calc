// Every denomination is exactly 10 ** power wei.
const units = [
  { id: "wei", name: "wei", power: 0 },
  { id: "kwei", name: "kwei (babbage)", power: 3 },
  { id: "mwei", name: "mwei (lovelace)", power: 6 },
  { id: "gwei", name: "gwei (shannon)", power: 9 },
  { id: "microether", name: "microether (szabo)", power: 12 },
  { id: "milliether", name: "milliether (finney)", power: 15 },
  { id: "eth", name: "ether (ETH)", power: 18 },
];

const maxDecimals = 24;
const integerFormatter = new Intl.NumberFormat("en-US");
const amountInput = document.getElementById("amount");
const unitInput = document.getElementById("unit");
const results = document.getElementById("results");
const error = document.getElementById("error");

for (const unit of units) unitInput.add(new Option(unit.name, unit.id));
document.getElementById("count").textContent = `${units.length} entries`;

function parseDecimal(text) {
  const value = text.trim().replace(/[,_\s]/g, "");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error("Enter a valid non-negative number.");
  }
  const [whole, fraction = ""] = value.split(".");
  const digits = fraction.replace(/0+$/, "");
  if (digits.length > maxDecimals) {
    throw new Error(`Use up to ${maxDecimals} decimal places.`);
  }
  return { coefficient: BigInt(`${whole || "0"}${digits}`), scale: digits.length };
}

// Shift the decimal point without ever converting the amount to a Number.
function formatDecimal(coefficient, scale) {
  if (scale <= 0) return integerFormatter.format(coefficient * 10n ** BigInt(-scale));
  const divisor = 10n ** BigInt(scale);
  const whole = integerFormatter.format(coefficient / divisor);
  const fraction = (coefficient % divisor).toString().padStart(scale, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function makeRow(unit, source, amount) {
  const row = document.createElement("tr");
  const label = document.createElement("th");
  const reference = document.createElement("span");
  const result = document.createElement("td");
  label.scope = "row";
  label.textContent = unit.name;
  reference.className = "reference";
  reference.textContent = `${integerFormatter.format(10n ** BigInt(unit.power))} wei`;
  label.append(reference);

  result.className = "value";
  result.textContent = amount
    ? formatDecimal(amount.coefficient, amount.scale + unit.power - source.power)
    : "–";

  if (unit === source) {
    row.className = "selected";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Input";
    result.append(badge);
  }
  row.append(label, result);
  return row;
}

function update() {
  const source = units.find(unit => unit.id === unitInput.value);
  const hasInput = Boolean(amountInput.value.trim());
  let amount;
  let message = "";
  try {
    amount = parseDecimal(amountInput.value);
  } catch (cause) {
    message = hasInput ? cause.message : "Enter an amount to see conversions.";
  }
  error.textContent = message;
  amountInput.setAttribute("aria-invalid", String(hasInput && !amount));
  results.replaceChildren(...units.map(unit => makeRow(unit, source, amount)));
}

amountInput.addEventListener("input", update);
unitInput.addEventListener("change", update);
update();
