import { useState } from 'react'
import { downloadReport } from '../api/documents'
import FindingCard from './FindingCard'
import DocumentPreview from './DocumentPreview'
const labels = {
  HIGH: 'Высокий риск',
  MEDIUM: 'Требует внимания',
  LOW: 'Низкий риск',
}
export default function AnalysisResult({ result, file }) {
  const [openedFindingAction, setOpenedFindingAction] = useState(null)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('risks')
  const [view, setView] = useState('analysis')
  const [selected, setSelected] = useState(null)
  const findings = result.findings || []
  function toggleFindingAction(index, action) {
    const next = `${index}-${action}`
    setOpenedFindingAction((current) => (current === next ? null : next))
  }
  async function handleDownload() {
    setDownloadingReport(true)
    setError('')
    try {
      await downloadReport(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloadingReport(false)
    }
  }
  return (
    <article className="result">
      <div className="file-toolbar">
        <div>
          <strong>{result.fileName}</strong>
          <span className="analysis-complete">● Разбор готов</span>
        </div>
        <button
          className="secondary"
          disabled={downloadingReport}
          onClick={handleDownload}
        >
          {downloadingReport ? 'Собираем PDF…' : '↓ Скачать PDF'}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="mobile-view-switch" aria-label="Режим просмотра">
        <button
          aria-pressed={view === 'analysis'}
          onClick={() => setView('analysis')}
        >
          Разбор
        </button>
        <button
          aria-pressed={view === 'document'}
          onClick={() => setView('document')}
        >
          Документ
        </button>
      </div>
      <div className={`review-workspace view-${view}`}>
        <DocumentPreview
          file={file}
          findings={findings}
          selected={selected}
          onBack={() => setView('analysis')}
        />
        <section className="analysis-panel">
          <div className="panel-heading">
            <h2>Результат разбора</h2>
          </div>
          <div className={`risk ${result.riskLevel}`}>
            <strong>{labels[result.riskLevel] || 'Требует внимания'}</strong>
            <span>Замечаний: {findings.length}</span>
          </div>
          <div
            className="result-tabs"
            role="tablist"
            aria-label="Разделы заключения"
          >
            {[
              ['risks', `Риски · ${findings.length}`],
              ['summary', 'Резюме'],
              ['strengths', 'Сильные стороны'],
            ].map(([id, label]) => (
              <button
                id={`tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls="result-panel"
                key={id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="result-panel"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            key={tab}
            className="tab-content"
          >
            {tab === 'risks' &&
              (findings.length ? (
                <div className="findings">
                  {findings.map((finding, index) => (
                    <FindingCard
                      key={index}
                      finding={finding}
                      index={index}
                      openedFindingAction={openedFindingAction}
                      toggleFindingAction={toggleFindingAction}
                      showClause={(index) => {
                        setSelected(index)
                        setView('document')
                      }}
                      selected={selected === index}
                    />
                  ))}
                </div>
              ) : (
                <p>
                  ИИ не выделил отдельных замечаний. Ознакомьтесь с резюме и
                  проверьте оригинал.
                </p>
              ))}
            {tab === 'summary' && (
              <div className="summary">
                <h3>Главное о документе</h3>
                <p>{result.summary}</p>
              </div>
            )}
            {tab === 'strengths' && (
              <div className="strengths">
                <h3>Что защищает ваши интересы</h3>
                {result.strengths?.length ? (
                  <ul>
                    {result.strengths.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                ) : (
                  <p>ИИ не выделил сильных сторон.</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="disclaimer">
        {result.disclaimer || 'Анализ ИИ не заменяет консультацию юриста.'}
      </footer>
    </article>
  )
}
