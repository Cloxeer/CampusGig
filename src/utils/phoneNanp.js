/** US NANP formatting for profile phone inputs */

export function nanpDigitsFromInput(raw) {
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d[0] === "1") return d.slice(0, 11);
  return d.slice(0, 10);
}

export function formatNanpDisplay(digits) {
  if (!digits) return "";
  const rest = digits[0] === "1" ? digits.slice(1) : digits;
  if (rest.length === 0) return "+1";
  let s = "+1 (" + rest.slice(0, 3);
  if (rest.length <= 3) return s;
  s += ") " + rest.slice(3, 6);
  if (rest.length <= 6) return s;
  return s + "-" + rest.slice(6, 10);
}

export function phoneFromStored(stored) {
  const d = String(stored ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return formatNanpDisplay(d);
  if (d.length === 10) return formatNanpDisplay("1" + d);
  if (d[0] === "1") return formatNanpDisplay(d.slice(0, 11));
  return formatNanpDisplay(d.slice(0, 10));
}
