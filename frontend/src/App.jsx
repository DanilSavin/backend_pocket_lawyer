import { useRef } from 'react'
import Hero from './components/Hero'
import UploadForm from './components/UploadForm'
import AnalysisProgress from './components/AnalysisProgress'
import AnalysisResult from './components/AnalysisResult'
import ContactFooter from './components/ContactFooter'
import useDocumentAnalysis from './hooks/useDocumentAnalysis'
export default function App() {
  const analysis = useDocumentAnalysis()
  const upload = useRef(null)
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-icon">▤</span>
          <span>
            Карманный
            <br />
            юрист
          </span>
        </a>
        <nav aria-label="Навигация">
          <a className="nav-active" href="#workspace">
            Разбор документа
          </a>
          <a href="#how-it-works">Как это работает</a>
          <a href="#contact">Обратная связь</a>
        </nav>
        <p className="sidebar-note">Внимание к каждой детали</p>
      </aside>
      <main id="workspace">
        <header className="workspace-header">
          <span>ПРОСТРАНСТВО ДЛЯ АНАЛИЗА</span>
          <button
            className="secondary"
            disabled={analysis.loading}
            onClick={() => {
              upload.current?.scrollIntoView({ behavior: 'smooth' })
              upload.current?.querySelector('input')?.click()
            }}
          >
            + Новый документ
          </button>
        </header>
        <Hero />
        <section ref={upload} className="upload-section">
          <UploadForm {...analysis} />
        </section>
        {analysis.loading && <AnalysisProgress />}
        {analysis.result && (
          <AnalysisResult result={analysis.result} file={analysis.file} />
        )}
        <section className="how-it-works" id="how-it-works">
          <p className="eyebrow">ОТ ФАЙЛА К ЯСНОСТИ</p>
          <h2>Три шага к понятному договору</h2>
          <div className="steps">
            {[
              [
                '01',
                'Загрузите документ',
                'Выберите договор в PDF, DOCX или TXT.',
              ],
              [
                '02',
                'Получите разбор',
                'Изучите обязательства, риски и сильные стороны.',
              ],
              [
                '03',
                'Проверьте детали',
                'Сверьте цитаты с документом и сохраните отчёт.',
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span className="step-number">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <ContactFooter />
      </main>
    </div>
  )
}
