import { useEffect, useState } from 'react'
const analysisStages = [
  'Изучаем содержание документа',
  'Выделяем стороны, сроки и ключевые обязательства',
  'Проверяем ответственность, платежи и расторжение',
  'Готовим заключение по сильным сторонам и рискам',
]
export default function AnalysisProgress() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(
      () => setStage((n) => Math.min(n + 1, analysisStages.length - 1)),
      2400,
    )
    return () => window.clearInterval(timer)
  }, [])
  return (
    <section className="analysis-progress" aria-live="polite">
      <div className="progress-mark" aria-hidden="true">
        <span className="scan-sheet" />
      </div>

      <div>
        <p className="progress-kicker">ЮРИДИЧЕСКИЙ АНАЛИЗ В РАБОТЕ</p>

        <h2>{analysisStages[stage]}</h2>

        <p className="progress-note">
          Анализ может занять несколько минут. Пока ИИ готовит ответ, здесь
          показаны направления проверки.
        </p>

        <ol>
          {analysisStages.map((item, index) => (
            <li
              className={
                index < stage ? 'done' : index === stage ? 'active' : ''
              }
              key={item}
            >
              {item}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
