import { useEffect, useState } from 'react'
export default function DocumentPreview({ file, findings, selected, onBack }) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    let active = true
    if (/\.txt$/i.test(file.name))
      file
        .text()
        .then((value) => {
          if (active) setText(value)
        })
        .catch(() => {
          if (active)
            setText(
              'Не удалось прочитать файл. Откройте оригинал на устройстве.',
            )
        })
    return () => {
      active = false
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])
  return (
    <section className="document-panel">
      <div className="panel-heading">
        <h2>Документ</h2>
        <span>ИСХОДНЫЙ ФАЙЛ</span>
      </div>
      {selected !== null && findings[selected] && (
        <div className="selected-excerpt">
          <button className="text-button" onClick={onBack}>
            ← К замечанию
          </button>
          <small>{findings[selected].clause || 'Цитата из анализа'}</small>
          <blockquote>
            {findings[selected].quote ||
              'Для этого замечания ИИ не вернул цитату.'}
          </blockquote>
        </div>
      )}
      {/\.pdf$/i.test(file?.name || '') && url ? (
        <>
          <iframe title="Исходный PDF-документ" src={url} />
          <a
            className="document-link"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Открыть PDF в отдельной вкладке ↗
          </a>
        </>
      ) : /\.txt$/i.test(file?.name || '') ? (
        <pre className="document-text">{text}</pre>
      ) : (
        <div className="excerpts">
          <p className="muted">
            Фрагменты, приведённые ИИ. Сверяйте цитаты с исходным DOCX на
            устройстве.
          </p>
          {findings.map(
            (finding, index) =>
              finding.quote && (
                <article
                  className={selected === index ? 'selected' : ''}
                  key={index}
                >
                  <small>{finding.clause || `Фрагмент ${index + 1}`}</small>
                  <blockquote>{finding.quote}</blockquote>
                </article>
              ),
          )}
          {url && (
            <a className="document-link" href={url} download={file?.name}>
              Скачать исходный документ ↗
            </a>
          )}
        </div>
      )}
    </section>
  )
}
