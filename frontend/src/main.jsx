import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const labels = {
  HIGH: 'Высокий риск',
  MEDIUM: 'Требует внимания',
  LOW: 'Низкий риск',
}

const analysisStages = [
  'Приняли документ в юридическое производство',
  'Выделяем стороны, сроки и ключевые обязательства',
  'Проверяем ответственность, платежи и расторжение',
  'Готовим заключение по сильным сторонам и рискам',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const SUPPORT_EMAIL = 'sdm260493@gmail.com'

function App() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [emailCopied, setEmailCopied] = useState(false)
  const [openedFindingAction, setOpenedFindingAction] = useState(null)
  const [downloadingReport, setDownloadingReport] = useState(false)

  useEffect(() => {
    if (!loading) {
      setStage(0)
      return undefined
    }

    const timer = window.setInterval(() => {
      setStage(current =>
          Math.min(current + 1, analysisStages.length - 1)
      )
    }, 2400)

    return () => window.clearInterval(timer)
  }, [loading])

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null

    setError('')
    setResult(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('Файл слишком большой. Максимальный размер — 10 МБ.')
      return
    }

    setFile(selectedFile)
  }

  async function submit(event) {
    event.preventDefault()

    if (!file) {
      setError('Сначала выберите документ.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setOpenedFindingAction(null)

    const data = new FormData()
    data.append('file', file)

    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: data,
      })

      const raw = await response.text()

      let payload

      try {
        payload = JSON.parse(raw)
      } catch {
        payload = {
          message:
              raw || 'Сервер вернул некорректный ответ.',
        }
      }

      if (!response.ok) {
        throw new Error(
            payload.message ||
            'Не удалось проанализировать файл.'
        )
      }

      setResult(payload)
    } catch (e) {
      setError(
          e instanceof Error
              ? e.message
              : 'Произошла неизвестная ошибка.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setEmailCopied(true)
      window.setTimeout(() => setEmailCopied(false), 2000)
    } catch {
      setError(`Не удалось скопировать почту. Скопируйте вручную: ${SUPPORT_EMAIL}`)
    }
  }

  async function downloadReport() {
    if (!result) return

    setDownloadingReport(true)
    setError('')

    try {
      const response = await fetch('/api/documents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })

      if (!response.ok) {
        throw new Error('Не удалось сформировать PDF-отчёт.')
      }

      const fileBlob = await response.blob()
      const url = URL.createObjectURL(fileBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'zaklyuchenie-karmannogo-yurista.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сформировать PDF-отчёт.')
    } finally {
      setDownloadingReport(false)
    }
  }

  function toggleFindingAction(index, action) {
    const next = `${index}-${action}`
    setOpenedFindingAction(current => current === next ? null : next)
  }

  return (
      <main>

        <section className="hero">
        <span className="badge">
          ⚖ КАРМАННЫЙ ЮРИСТ · НА СВЯЗИ
        </span>

          <p className="eyebrow">
            Ваш документ. Ваши права. Ваш ход.
          </p>

          <h1>Проверим
            <br />БУМАГИ.
          </h1>

          <p>
            Загрузите договор — сервис выделит типовые
            юридические риски и скажет, куда смотреть
            внимательнее.
          </p>
        </section>

        <section className="panel">

          <form onSubmit={submit}>

            <div className="hotline">
              БЫСТРАЯ ПРОВЕРКА · БЕЗ МЕЛКОГО ШРИФТА*
            </div>

            <label
                className={`dropzone ${
                    loading ? 'is-loading' : ''
                }`}
            >
              <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={loading}
                  onChange={handleFileChange}
              />

              <span
                  className="file-icon"
                  aria-hidden="true"
              >
              ↑
            </span>
              <strong>
                {file
                    ? file.name
                    : 'Загрузите ваш документ'}
              </strong>

              <small>
                {file
                    ? `${Math.ceil(file.size / 1024)} КБ`
                    : 'PDF, DOCX или TXT · до 10 МБ'}
              </small>
            </label>

            {error && (
                <p
                    className="error"
                    role="alert"
                >
                  {error}
                </p>
            )}
            {file && (
                <button disabled={loading}>
                  {loading
                      ? 'Заключение готовится…'
                      : 'Проверить документ'}
                </button>
            )}
          </form>


          {loading && (
              <section
                  className="analysis-progress"
                  aria-live="polite"
              >
                <div
                    className="progress-mark"
                    aria-hidden="true"
                >
                  ⚖
                </div>

                <div>
                  <p className="progress-kicker">
                    ЮРИДИЧЕСКИЙ АНАЛИЗ В РАБОТЕ
                  </p>

                  <h2>
                    {analysisStages[stage]}
                  </h2>

                  <p className="progress-note">
                    Это может занять до пары минут:
                    изучаем условия договора, а не просто
                    ищем слова.
                  </p>

                  <ol>
                    {analysisStages.map((item, index) => (
                        <li
                            className={
                              index < stage
                                  ? 'done'
                                  : index === stage
                                      ? 'active'
                                      : ''
                            }
                            key={item}
                        >
                          {item}
                        </li>
                    ))}
                  </ol>
                </div>
              </section>
          )}

          {result && (
              <article className="result">
                <div
                    className={`risk ${result.riskLevel}`} >
              <span> Общая оценка </span>
                  <strong>
                    {labels[result.riskLevel] ||
                        'Требует внимания'}
                  </strong>
                </div>

                <h2> Заключение </h2>
                <p> {result.summary} </p>

                <button
                    className="report-download"
                    type="button"
                    disabled={downloadingReport}
                    onClick={downloadReport}
                >
                  {downloadingReport ? 'Собираем PDF…' : 'Скачать заключение в PDF'}
                </button>

                {result.strengths?.length > 0 && (
                    <div className="strengths">
                      <h2> Сильные стороны </h2>
                      <ul>
                        {result.strengths.map(
                            (strength, index) => (
                                <li key={index}>
                                  {strength}
                                </li>
                            )
                        )}
                      </ul>
                    </div>
                )}

                {result.findings?.length > 0 && (
                    <div className="findings">
                      {result.findings.map(
                          (finding, index) => (
                              <div className="finding" key={index}>
                      <span className={`dot ${finding.severity}`} aria-hidden="true"/>
                                <div>
                                  <h3> {finding.title} </h3>
                                  {finding.clause && (
                                      <p className="finding-clause">
                                        Пункт договора: {finding.clause}
                                      </p>
                                  )}
                                  {finding.quote && (
                                      <blockquote>
                                        «{finding.quote}»
                                      </blockquote>
                                  )}
                                  <p> {finding.description} </p>
                                  <b> Что сделать:
                                  </b>{' '}
                                  {finding.recommendation}
                                  <div className="finding-actions">
                                    <button
                                        type="button"
                                        className="finding-action"
                                        onClick={() => toggleFindingAction(index, 'explanation')}
                                    >
                                      Объяснить простыми словами
                                    </button>
                                    <button
                                        type="button"
                                        className="finding-action"
                                        onClick={() => toggleFindingAction(index, 'revision')}
                                    >
                                      Предложить правку
                                    </button>
                                  </div>
                                  {openedFindingAction === `${index}-explanation` && (
                                      <div className="finding-detail">
                                        <strong>Простое объяснение</strong>
                                        <p>{finding.explanation || finding.description}</p>
                                      </div>
                                  )}
                                  {openedFindingAction === `${index}-revision` && (
                                      <div className="finding-detail">
                                        <strong>Вариант более безопасной редакции</strong>
                                        <p>{finding.suggestedRevision || finding.recommendation}</p>
                                        <small>Это пример для обсуждения со второй стороной, а не готовая юридическая консультация.</small>
                                      </div>
                                  )}
                                </div>
                              </div>
                          )
                      )}
                    </div>
                )}
                <footer> * {result.disclaimer} </footer>
              </article>
          )}
        </section>
          <footer className="contact-footer">
              <div className="contact-badge">
                  ЕСТЬ ВОПРОСЫ?
              </div>

              <div className="contact-content">
                  <h2>ПОГОВОРИМ.</h2>

                  <p>
                      Вопросы, предложения или нашли ошибку?
                      Напишите нам — мы читаем каждое обращение.
                  </p>

                  <button
                      type="button"
                      className="contact-email"
                      onClick={copySupportEmail}
                  >
                      {emailCopied ? '✓ Почта скопирована' : `✉ ${SUPPORT_EMAIL}`}
                  </button>
              </div>
          </footer>
      </main>
  )
}

createRoot(
    document.getElementById('root')
).render(
    <StrictMode>
      <App />
    </StrictMode>
)
