import Hero from './components/Hero'
import UploadForm from './components/UploadForm'
import AnalysisProgress from './components/AnalysisProgress'
import AnalysisResult from './components/AnalysisResult'
import ContactFooter from './components/ContactFooter'
import useDocumentAnalysis from './hooks/useDocumentAnalysis'
export default function App() {
  const analysis = useDocumentAnalysis()
  return (
    <main>
      <Hero />
      <section className="panel">
        <UploadForm {...analysis} />
        {analysis.loading && <AnalysisProgress />}
        {analysis.result && <AnalysisResult result={analysis.result} />}
      </section>
      <ContactFooter />
    </main>
  )
}
