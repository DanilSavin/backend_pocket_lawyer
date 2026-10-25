import { useState } from 'react'
import { downloadReport } from '../api/documents'
import FindingCard from './FindingCard'
const labels = {
  HIGH: 'Высокий риск',
  MEDIUM: 'Требует внимания',
  LOW: 'Низкий риск',
}
export default function AnalysisResult({ result }) {
  const [openedFindingAction, setOpenedFindingAction] = useState(null)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [error, setError] = useState('')
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
      <div className={`risk ${result.riskLevel}`}>
        <span> Общая оценка </span>
        <strong>{labels[result.riskLevel] || 'Требует внимания'}</strong>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <h2> Заключение </h2>
      <p> {result.summary} </p>

      <button
        className="report-download"
        type="button"
        disabled={downloadingReport}
        onClick={handleDownload}
      >
        {downloadingReport ? 'Собираем PDF…' : 'Скачать заключение в PDF'}
      </button>

      {result.strengths?.length > 0 && (
        <div className="strengths">
          <h2> Сильные стороны </h2>
          <ul>
            {result.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {result.findings?.length > 0 && (
        <div className="findings">
          {result.findings.map((finding, index) => (
            <FindingCard
              key={index}
              finding={finding}
              index={index}
              openedFindingAction={openedFindingAction}
              toggleFindingAction={toggleFindingAction}
            />
          ))}
        </div>
      )}
      <footer> * {result.disclaimer} </footer>
    </article>
  )
}
