interface FileUploadProps {
  label: string
  accept?: string
  hint?: string
  onFile: (file: File) => void
  disabled?: boolean
}

export function FileUpload({
  label,
  accept = '.csv',
  hint,
  onFile,
  disabled = false,
}: FileUploadProps) {
  return (
    <label className={`upload-card${disabled ? ' upload-card--disabled' : ''}`}>
      <span className="upload-card__label">{label}</span>
      {hint ? <span className="upload-card__hint">{hint}</span> : null}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
      <span className="upload-card__action">Choose file</span>
    </label>
  )
}
