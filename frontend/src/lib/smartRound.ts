// Rounds a number to two places after any leading zeroes
// e.g. 0.00123456789 -> 0.0012, 0.12345 -> 0.12
export const smartRound = (num: number) => {
  const numStr = num.toString();
  const decimalIndex = numStr.indexOf(".");

  // If no decimal, return number with .00
  if (decimalIndex === -1) {
    return num.toFixed(2);
  }

  // If initial number is greater than 1, we don't need the extra precision
  const integerPart = numStr.slice(0, decimalIndex);
  if (integerPart !== "0") {
    return num.toFixed(2);
  }

  const decimalPart = numStr.slice(decimalIndex + 1);

  // Count leading zeros
  const leadingZeros =
    decimalPart.length - decimalPart.replace(/^0+/, "").length;
  // Add 2 more decimal places after the leading zeros
  const totalDecimals = leadingZeros + 2;

  return Number(num.toFixed(totalDecimals));
};
