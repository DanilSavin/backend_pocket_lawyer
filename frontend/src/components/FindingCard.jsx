export default function FindingCard({
  finding,
  index,
  openedFindingAction,
  toggleFindingAction,
}) {
  return (
    <div className="finding" key={index}>
      <span className={`dot ${finding.severity}`} aria-hidden="true" />
      <div>
        <h3> {finding.title} </h3>
        {finding.clause && (
          <p className="finding-clause">Пункт договора: {finding.clause}</p>
        )}
        {finding.quote && <blockquote>«{finding.quote}»</blockquote>}
        <p> {finding.description} </p>
        <b> Что сделать:</b> {finding.recommendation}
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
