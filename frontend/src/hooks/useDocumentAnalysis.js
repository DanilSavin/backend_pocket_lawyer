import { useState } from 'react'
import { analyzeDocument } from '../api/documents'
export default function useDocumentAnalysis() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null
    setResult(null)
    setError('')
    setFile(null)
    if (!selected) return
    if (!/\.(pdf|docx|txt)$/i.test(selected.name)) {
      setError('Выберите PDF, DOCX или TXT.')
    } else if (!selected.size || selected.size > 40 * 1024 * 1024) {
      setError('Выберите непустой файл размером до 40 МБ.')
    } else {
      setFile(selected)
    }
  }
  async function submit(event) {
    event.preventDefault()
    if (loading || !file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await analyzeDocument(file))
    } catch (e) {
      setError(e.message || 'Не удалось обработать документ.')
    } finally {
      setLoading(false)
    }
  }
  return {
    file,
    result,
    error,
    loading,
    handleFileChange,
    submit,
  }
}
