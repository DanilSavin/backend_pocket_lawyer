export default function UploadForm({
  file,
  loading,
  error,
  handleFileChange,
  submit,
}) {
  return (
    <form onSubmit={submit}>
      <div className="hotline">БЫСТРАЯ ПРОВЕРКА · БЕЗ МЕЛКОГО ШРИФТА*</div>

      <label className={`dropzone ${loading ? 'is-loading' : ''}`}>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={loading}
          onChange={handleFileChange}
        />

        <span className="file-icon" aria-hidden="true">
          ↑
        </span>
        <strong>{file ? file.name : 'Загрузите ваш документ'}</strong>

        <small>
          {file
            ? `${Math.ceil(file.size / 1024)} КБ`
            : 'PDF, DOCX или TXT · до 40 МБ'}
        </small>
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {file && (
        <button disabled={loading}>
          {loading ? 'Заключение готовится…' : 'Проверить документ'}
        </button>
      )}
    </form>
  )
}
