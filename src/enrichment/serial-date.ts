const MIN_YEAR = 1950
const MAX_YEAR = 2040

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function isoDate(year: number, month: number, day: number): string | null {
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null
  }
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function yearFromTwoDigits(yy: number): number {
  return yy >= 70 ? 1900 + yy : 2000 + yy
}

function yearMonthDay(year: number, month: number, day = 1): string | null {
  return isoDate(year, month, day)
}

function yearFromPrefix(twoDigits: number): string | null {
  if (twoDigits < 0 || twoDigits > 99) return null
  return yearMonthDay(yearFromTwoDigits(twoDigits), 1, 1)
}

/** Philips DE serials encode 19xx as DE54, DE62, DE67, etc. */
function philipsYearFromDe(twoDigits: number): string | null {
  if (twoDigits < 0 || twoDigits > 99) return null
  const year = twoDigits >= 40 ? 1900 + twoDigits : 2000 + twoDigits
  return yearMonthDay(year, 1, 1)
}

function cleanSerial(serial: string): string {
  return serial.replace(/^\(\d+\)\s*/i, '').trim()
}

function monthFromLetter(letter: string): number | null {
  const code = letter.toUpperCase().charCodeAt(0)
  if (code >= 65 && code <= 77) return code - 64
  return null
}

function extractEmbeddedIsoDate(s: string): string | null {
  const ymd = s.match(/(20\d{2})(\d{2})(\d{2})/)
  if (ymd) {
    const date = isoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]))
    if (date) return date
  }

  const dashed = s.match(/(20\d{6})/)
  if (dashed) {
    const raw = dashed[1]
    return isoDate(
      Number(raw.slice(0, 4)),
      Number(raw.slice(4, 6)),
      Number(raw.slice(6, 8)),
    )
  }

  return null
}

export function parseManufacturedDate(
  serial: string,
  manufacturer: string,
): string | null {
  const s = cleanSerial(serial)
  const mfg = manufacturer.trim().toLowerCase()

  let match: RegExpMatchArray | null
  let date: string | null

  date = extractEmbeddedIsoDate(s)
  if (date) return date

  match = s.match(/WU(20\d{2})(\d{2})(\d{2})/i)
  if (match) {
    return isoDate(Number(match[1]), Number(match[2]), Number(match[3]))
  }

  match = s.match(/(?:^|-)(20\d{2})(\d{2})(\d{2})/)
  if (match) {
    date = isoDate(Number(match[1]), Number(match[2]), Number(match[3]))
    if (date) return date
  }

  if (mfg.includes('edan')) {
    match = s.match(/[MK](\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('american diagnostic')) {
    match = s.match(/^C(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg === 'biosonic') {
    match = s.match(/^(\d{2})(\d{2})(\d{2})/)
    if (match) {
      const year = yearFromTwoDigits(Number(match[1]))
      const month = Number(match[2])
      const day = Number(match[3])
      date = isoDate(year, month, day > 0 ? day : 1)
      if (date) return date
      return yearMonthDay(year, month > 0 && month <= 12 ? month : 1, 1)
    }
  }

  if (mfg === 'linet') {
    match = s.match(/^(20\d{2})/)
    if (match) return yearMonthDay(Number(match[1]), 1, 1)
  }

  if (mfg.includes('zoll')) {
    match = s.match(/^(AR|AV|AI)(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[2]))
    match = s.match(/^AF(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^D(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^T(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^3T(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^[tT](\d)/)
    if (match) return yearMonthDay(2010 + Number(match[1]), 1, 1)
    match = s.match(/X(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('ge healthcare')) {
    match = s.match(/^SPX(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^SA\d(\d{2})/i)
    if (match) return yearMonthDay(2000 + Number(match[1]), 1, 1)
    match = s.match(/^RTS(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^RT(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^RT(\d)(\d{2})/i)
    if (match) {
      const year = 2000 + Number(match[1])
      const month = Number(match[2])
      if (month >= 1 && month <= 12) return yearMonthDay(year, month, 1)
    }
  }

  if (mfg.includes('welch allyn')) {
    match = s.match(/^A(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('hill rom')) {
    match = s.match(/^([HLGBMJQIN])(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[2]))
    match = s.match(/^Q(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^P(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg === 'hillrom') {
    match = s.match(/^([MJ])(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[2]))
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('philips')) {
    match = s.match(/^DE(\d{2})/i)
    if (match) return philipsYearFromDe(Number(match[1]))
    match = s.match(/^(\d{7,8})$/)
    if (match) {
      match = s.match(/^(\d{2})/)
      if (match) return yearFromPrefix(Number(match[1]))
    }
  }

  if (mfg.includes('hospira')) {
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('baxter')) {
    match = s.match(/^\d(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^(\d{2})/)
    if (match) {
      const yy = Number(match[1])
      if (yy >= 50) return yearFromPrefix(yy)
    }
  }

  if (mfg.includes('mindray')) {
    match = s.match(/^(?:FS|F5)-(\d{2})(\d{2})(\d{2})/i)
    if (match) {
      date = isoDate(
        yearFromTwoDigits(Number(match[1])),
        Number(match[2]),
        Number(match[3]),
      )
      if (date) return date
    }
    match = s.match(/^(?:FS|F5)-(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))

    match = s.match(/^AH9-(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
    match = s.match(/^AH9-(\d)([A-Z])/i)
    if (match) {
      const year = 2010 + Number(match[1])
      const month = monthFromLetter(match[2]) ?? 1
      return yearMonthDay(year, month, 1)
    }
  }

  if (mfg.includes('masimo') && /^M\d/i.test(s)) {
    match = s.match(/^M(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('stryker')) {
    match = s.match(/^(20\d{2})/)
    if (match) return yearMonthDay(Number(match[1]), 1, 1)
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('thermo scientific')) {
    return yearFromPrefix(Number(s.slice(0, 2)))
  }

  if (mfg.includes('arjo')) {
    match = s.match(/^(20\d{2})/)
    if (match) return yearMonthDay(Number(match[1]), 1, 1)
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('exergen')) {
    match = s.match(/^A(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('cogentix')) {
    match = s.match(/^CS(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('olympus')) {
    match = s.match(/^(\d{2})/)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('covidien')) {
    match = s.match(/^VL0*(\d{2})/i)
    if (match) return yearFromPrefix(Number(match[1]))
  }

  if (mfg.includes('lab corp')) {
    match = s.match(/^(\d{2})(\d{2})(\d{2})/)
    if (match) {
      const year = 2000 + Number(match[1])
      date = isoDate(year, Number(match[2]), Number(match[3]))
      if (date) return date
    }
  }

  match = s.match(/^(20\d{2})(\d{2})(\d{2})/)
  if (match) {
    return isoDate(Number(match[1]), Number(match[2]), Number(match[3]))
  }

  match = s.match(/(\d{2})(\d{2})(\d{2})/)
  if (match) {
    date = isoDate(
      yearFromTwoDigits(Number(match[1])),
      Number(match[2]),
      Number(match[3]),
    )
    if (date) return date
  }

  return null
}
