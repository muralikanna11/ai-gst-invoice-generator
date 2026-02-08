export const numberToWords = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  const [wholeStr, fractionStr] = rounded.toFixed(2).split('.');
  const whole = parseInt(wholeStr);
  const fraction = parseInt(fractionStr);

  if (whole === 0 && fraction === 0) return "Zero Rupees Only";

  const convertGroup = (n: number): string => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertGroup(n % 100) : "");
    return "";
  };
  
  // Indian Numbering System: 12,34,56,789
  // Crores, Lakhs, Thousands, Hundreds
  const convertIndian = (n: number): string => {
      if (n === 0) return "";
      
      let str = "";
      
      const crore = Math.floor(n / 10000000);
      const lakh = Math.floor((n % 10000000) / 100000);
      const thousand = Math.floor((n % 100000) / 1000);
      const hundred = n % 1000;
      
      if (crore > 0) str += convertIndian(crore) + " Crore ";
      if (lakh > 0) str += convertGroup(lakh) + " Lakh ";
      if (thousand > 0) str += convertGroup(thousand) + " Thousand ";
      if (hundred > 0) str += convertGroup(hundred);
      
      return str.trim();
  }

  let output = convertIndian(whole) + " Rupees";
  
  if (fraction > 0) {
      output += " and " + convertGroup(fraction) + " Paise";
  }
  
  return output + " Only";
};