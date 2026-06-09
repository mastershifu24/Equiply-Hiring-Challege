import { useCallback, useMemo, useState } from 'react'
import { DeviceTypeChart } from './components/DeviceTypeChart'
import { EquipmentTable } from './components/EquipmentTable'
import { FileUpload } from './components/FileUpload'
import {
  enrichRecords,
  parseReferenceCsv,
  type ReferenceLookup,
} from './enrichment'
import { downloadCsv, enrichedToCsv, parseEquipmentCsv } from './lib/csv'
import { sortByManufacturedDateAsc } from './lib/sort'
import { deviceTypeDistribution } from './lib/stats'
import type { EnrichedEquipment } from './types/equipment'
import './App.css'

function App() {
  const [reference, setReference] = useState<ReferenceLookup | null>(null)
  const [enriched, setEnriched] = useState<EnrichedEquipment[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const sortedRows = useMemo(
    () => sortByManufacturedDateAsc(enriched),
    [enriched],
  )

  const distribution = useMemo(
    () => deviceTypeDistribution(sortedRows),
    [sortedRows],
  )

  const readFile = useCallback((file: File) => file.text(), [])

  const handleEquipmentUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)
      setStatus(null)

      try {
        const text = await readFile(file)
        const { records, errors } = parseEquipmentCsv(text)

        if (records.length === 0) {
          setEnriched([])
          setError(errors.join(' ') || 'No valid equipment rows found.')
          return
        }

        const result = enrichRecords(records, reference)
        setEnriched(result)
        setStatus(
          `Enriched ${result.length} record${result.length === 1 ? '' : 's'} from ${file.name}.`,
        )

        if (errors.length > 0) {
          setError(`Skipped ${errors.length} row(s). First issue: ${errors[0]}`)
        }
      } catch (err) {
        setEnriched([])
        setError(err instanceof Error ? err.message : 'Failed to process file.')
      } finally {
        setIsProcessing(false)
      }
    },
    [readFile, reference],
  )

  const handleReferenceUpload = useCallback(
    async (file: File) => {
      setError(null)
      try {
        const text = await readFile(file)
        const lookup = parseReferenceCsv(text)
        setReference(lookup)
        setStatus(
          `Loaded reference data (${lookup.size} lookup entries) from ${file.name}. Re-upload equipment CSV to re-enrich.`,
        )
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load reference file.',
        )
      }
    },
    [readFile],
  )

  const handleExport = useCallback(() => {
    if (sortedRows.length === 0) return
    const csv = enrichedToCsv(sortedRows)
    downloadCsv('enriched.csv', csv)
  }, [sortedRows])

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">CSV enrichment</p>
          <h1>Hospital equipment enrichment</h1>
          <p className="lede">
            Upload equipment CSV, enrich with manufactured date and device type,
            visualize distribution, and export sorted results — all in the browser.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExport}
          disabled={sortedRows.length === 0}
        >
          Export enriched CSV
        </button>
      </header>

      <section className="upload-row">
        <FileUpload
          label="Equipment CSV"
          hint="Required columns: manufacturer, model, serial number (or serial_number)"
          onFile={handleEquipmentUpload}
          disabled={isProcessing}
        />
        <FileUpload
          label="Reference data (optional)"
          hint="Optional CSV overrides for manufactured_date and device_type — re-upload equipment after"
          onFile={handleReferenceUpload}
          disabled={isProcessing}
        />
      </section>

      {isProcessing ? <p className="status">Processing…</p> : null}
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <main className="dashboard">
        <section className="panel panel--wide">
          <div className="panel__head">
            <h2>Enriched equipment</h2>
            <span className="badge">{sortedRows.length} rows</span>
          </div>
          <p className="panel__sub">
            Sorted ascending by manufactured date.
          </p>
          <EquipmentTable rows={sortedRows} />
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Device type mix</h2>
          </div>
          <p className="panel__sub">Percentage of each device type in the file.</p>
          <DeviceTypeChart slices={distribution} />
        </section>
      </main>
    </div>
  )
}

export default App
