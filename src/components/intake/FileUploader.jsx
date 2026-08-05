import { useRef, useState } from 'react'
import { Check, Loader2, Paperclip, X } from 'lucide-react'
import { ACCEPT, formatBytes, uploadIntakeFile } from '../../lib/intake-upload-client'

// Uploads start the moment files are chosen rather than on submit. A client who
// picks 30 photos and then hits Submit would sit on a blank screen for minutes;
// uploading as they go means the wait is spent filling in the rest of the form.
//
// `value` is the list of COMPLETED uploads ({name,id,url}) and is what gets saved
// to the draft and sent to /api/intake-submit. In-flight and failed files live in
// local state only — a failed upload must never look like an answer.
export default function FileUploader({ question, token, value = [], onChange, onBusyChange }) {
  const inputRef = useRef(null)
  const [inFlight, setInFlight] = useState([])
  const [dragging, setDragging] = useState(false)

  // Uploading a batch appends one file at a time, but React has not re-rendered
  // with the previous append by the time the next finishes — reading the `value`
  // prop inside the loop would drop every file but the last. This ref carries the
  // freshest list across iterations.
  const latest = useRef(value)
  latest.current = value

  const commit = (next) => {
    latest.current = next
    onChange(next)
  }

  const setBusy = (list) => {
    setInFlight(list)
    if (onBusyChange) onBusyChange(list.some((f) => f.status === 'uploading'))
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const queued = files.map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      error: null,
      file,
    }))
    let current = [...inFlight, ...queued]
    setBusy(current)

    const patch = (key, changes) => {
      current = current.map((f) => (f.key === key ? { ...f, ...changes } : f))
      setBusy(current)
    }

    // Sequential on purpose. Parallel uploads of ten phone photos on hotel wifi
    // starve each other and every progress bar crawls at once, which reads as
    // frozen. One at a time finishes sooner in practice and always looks alive.
    for (const item of queued) {
      try {
        const uploaded = await uploadIntakeFile({
          file: item.file,
          kind: question.uploadKind,
          token,
          onProgress: (progress) => patch(item.key, { progress }),
        })
        commit([...(latest.current || []), uploaded])
        // Drop it from the in-flight list once it is a real answer.
        current = current.filter((f) => f.key !== item.key)
        setBusy(current)
      } catch (err) {
        patch(item.key, { status: 'error', error: err.message || 'Upload failed' })
      }
    }
  }

  const remove = (index) => commit(value.filter((_, i) => i !== index))
  const retry = (key) => {
    const item = inFlight.find((f) => f.key === key)
    if (!item) return
    setBusy(inFlight.filter((f) => f.key !== key))
    handleFiles([item.file])
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? 'border-brass bg-brass/5' : 'border-stone/70 bg-white/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT[question.uploadKind] || undefined}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Paperclip className="mx-auto mb-3 text-mid-charcoal/40" size={22} aria-hidden="true" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-sans text-xs font-medium tracking-widest uppercase px-6 py-3 bg-charcoal text-ivory hover:bg-brass transition-colors"
        >
          Choose files
        </button>
        <p className="font-sans text-mid-charcoal/55 text-sm mt-3">
          or drag them here · up to 100 MB each
        </p>
      </div>

      {(value.length > 0 || inFlight.length > 0) && (
        <ul className="mt-3 space-y-2">
          {value.map((f, i) => (
            <li
              key={`${f.id || f.name}-${i}`}
              className="flex items-center gap-3 border border-stone/40 bg-white/70 px-3 py-2"
            >
              <Check className="text-brass shrink-0" size={16} aria-hidden="true" />
              <span className="font-sans text-charcoal text-sm truncate flex-1">{f.name}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${f.name}`}
                className="text-mid-charcoal/40 hover:text-charcoal transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </li>
          ))}

          {inFlight.map((f) => (
            <li key={f.key} className="border border-stone/40 bg-white/70 px-3 py-2">
              <div className="flex items-center gap-3">
                {f.status === 'uploading' ? (
                  <Loader2 className="animate-spin text-mid-charcoal/50 shrink-0" size={16} aria-hidden="true" />
                ) : (
                  <X className="text-red-600 shrink-0" size={16} aria-hidden="true" />
                )}
                <span className="font-sans text-charcoal text-sm truncate flex-1">{f.name}</span>
                <span className="font-sans text-mid-charcoal/50 text-xs shrink-0">
                  {f.status === 'uploading' ? `${f.progress}%` : formatBytes(f.size)}
                </span>
              </div>
              {f.status === 'uploading' && (
                <div className="mt-2 h-1 bg-stone/40" role="progressbar" aria-valuenow={f.progress}>
                  <div className="h-1 bg-brass transition-all" style={{ width: `${f.progress}%` }} />
                </div>
              )}
              {f.status === 'error' && (
                <p className="font-sans text-red-700 text-sm mt-1">
                  {f.error}{' '}
                  <button type="button" onClick={() => retry(f.key)} className="underline hover:text-red-900">
                    Try again
                  </button>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
