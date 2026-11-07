import { useState } from 'react'
export default function UploadForm({
  file,
  loading,
  error,
  handleFileChange,
  submit,
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <form onSubmit={submit}>
      <label
        className={`dropzone ${dragging ? 'dragging' : ''} ${loading ? 'is-loading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!loading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!loading)
            handleFileChange({ target: { files: e.dataTransfer.files } })
        }}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={loading}
          onChange={handleFileChange}
          aria-label="Выбрать документ"
        />
        <svg
          className="upload-icon"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
        </svg>
        <span className="file-description">
          <strong>{file ? file.name : 'Начните с вашего документа'}</strong>
          <small>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} МБ · Нажмите, чтобы заменить`
              : 'Перетащите файл сюда или выберите на устройстве'}
          </small>
        </span>
        <span className="file-format">PDF, DOCX, TXT · ДО 40 МБ</span>
        {!file && <span className="choose-file">Выбрать файл ↗</span>}
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {file && (
        <div className="submit-row">
          <span>Резюме, риски и рекомендации в одном отчёте</span>
          <button disabled={loading}>
            {loading ? 'Анализируем документ…' : 'Проверить документ ↗'}
          </button>
        </div>
      )}
    </form>
  )
}
