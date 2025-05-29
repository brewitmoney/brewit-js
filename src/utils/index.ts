export const generateRandomBuffer = (): ArrayBuffer => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr.buffer;
};



export function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedDays = days ? `${days} day${days > 1 ? 's' : ''}` : '';
  const formattedHours = hours ? `${hours} hour${hours > 1 ? 's' : ''}` : '';
  const formattedMinutes = minutes
    ? `${minutes} min${minutes > 1 ? 's' : ''}`
    : '';
  const formattedSeconds = remainingSeconds
    ? `${remainingSeconds} sec${remainingSeconds > 1 ? 's' : ''}`
    : '';

  return [formattedDays, formattedHours, formattedMinutes, formattedSeconds]
    .filter(Boolean)
    .join(', ');
}

export function convertToSeconds(
  value: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): number {
  let seconds;
  switch (unit) {
    case 'minutes':
      seconds = value * 60;
      break;
    case 'hours':
      seconds = value * 60 * 60;
      break;
    case 'days':
      seconds = value * 60 * 60 * 24;
      break;
    default:
      seconds = value; // Assume value is already in seconds
  }
  return seconds;
}

// export function createJobId(
//   startTime: Date,
//   endTime: Date,
//   interval: number,
//   account: string,
//   chainId: string
// ): string {
//   const startTimeStr = startTime.toISOString();
//   const endTimeStr = endTime.toISOString();
//   const intervalStr = interval.toString();

//   let inputString = `${startTimeStr}|${endTimeStr}|${intervalStr}|${account}|${chainId}`;
//   const hash = createHash('sha256').update(inputString).digest('hex');
//   return `j_${hash.slice(0, 16)}`;
// }

/**
 * Truncates a string in the middle and adds ellipsis if needed.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length of the string including ellipsis.
 * @returns The truncated string.
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) {
    return str;
  }
  const half = Math.floor((maxLength - 3) / 2);
  return str.slice(0, half) + '...' + str.slice(str.length - half);
}

export const formatBalance = (value: number): string => {
  if (!value) return '0.00';

  const absValue = Math.abs(value);

  // Check for very small values
  if (absValue <= 0.00000001) {
    return '< 0.00000001';
  }

  let decimalPlaces: number;

  if (absValue >= 10) {
    decimalPlaces = 2; // Standard format for values >= 10
  } else if (absValue >= 1) {
    decimalPlaces = 3; // Three decimal places for values between 1 and 10
  } else {
    decimalPlaces = Math.min(
      Math.max(2, -Math.floor(Math.log10(absValue)) + 2),
      8
    );
  }

  const formatted =
    absValue >= 1000
      ? value.toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })
      : value.toFixed(decimalPlaces);

  // Trim trailing zeros after the decimal point while keeping at least 2 decimal places
  return formatted.replace(/\.?0+$/, '').replace(/(\.\d\d[1-9]*)0+$/, '$1');
};

/**
 * Formats a number with appropriate suffix (K, M, B, T) for better readability
 * @param num - The number to format
 * @param decimalPlaces - Number of decimal places to show (default 2)
 * @param includeCurrency - Whether to include $ symbol for currency (default false)
 * @param currencySymbol - Symbol to use for currency (default $)
 * @returns Formatted string with appropriate suffix
 */
export function formatNumberWithSuffix(
  num: number | null | undefined,
  decimalPlaces = 2,
  includeCurrency = false,
  currencySymbol = '$'
): string {
  if (num === null || num === undefined) return 'N/A';

  // Handle small numbers directly
  if (Math.abs(num) < 1000) {
    return `${includeCurrency ? currencySymbol : ''}${num.toFixed(decimalPlaces)}`;
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaledNum = num / Math.pow(1000, magnitude);
  const formattedNum = scaledNum.toFixed(decimalPlaces);

  // Remove trailing zeros after decimal point if they exist
  const trimmedNum = formattedNum
    .replace(/\.0+$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1');

  return `${includeCurrency ? currencySymbol : ''}${trimmedNum}${suffixes[magnitude]}`;
}
