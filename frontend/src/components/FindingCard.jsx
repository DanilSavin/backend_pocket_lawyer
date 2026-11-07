export default function FindingCard({
  finding,
  index,
  openedFindingAction,
  toggleFindingAction,
  showClause,
  selected,
}) {
  return (
    <div
      className={`finding ${finding.severity || 'MEDIUM'} ${selected ? 'selected' : ''}`}
      key={index}
    >
      <span className={`dot ${finding.severity}`} aria-hidden="true" />
      <div>
        <h3> {finding.title} </h3>
        {finding.clause && (
          <button className="finding-clause" onClick={() => showClause(index)}>
            Пункт {finding.clause} ↗
          </button>
        )}
        {finding.quote && <blockquote>«{finding.quote}»</blockquote>}
        <p> {finding.description} </p>
        <b> Что сделать:</b> {finding.recommendation}
        <div className="finding-actions">
          <button
            type="button"
            className="finding-action"
            aria-expanded={openedFindingAction === `${index}-explanation`}
            onClick={() => toggleFindingAction(index, 'explanation')}
          >
            Объяснить
          </button>
          <button
            type="button"
            className="finding-action"
            aria-expanded={openedFindingAction === `${index}-revision`}
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
            <small>
              Это пример для обсуждения со второй стороной, а не готовая
              юридическая консультация.
            </small>
          </div>
        )}
      </div>
    </div>
  )
}
