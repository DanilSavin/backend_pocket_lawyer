import { useEffect, useRef, useState } from 'react'
const SUPPORT_EMAIL = 'sdm260493@gmail.com'
export default function ContactFooter() {
  const [emailCopied, setEmailCopied] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setError('')
      setEmailCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setEmailCopied(false), 2000)
    } catch {
      setError('Не удалось скопировать почту. Скопируйте адрес вручную.')
    }
  }
  return (
    <footer className="contact-footer">
      <div className="contact-badge">ЕСТЬ ВОПРОСЫ?</div>

      <div className="contact-content">
        <h2>ПОГОВОРИМ.</h2>

        <p>
          Вопросы, предложения или нашли ошибку? Напишите нам — мы читаем каждое
          обращение.
        </p>

        <button
          type="button"
          className="contact-email"
          onClick={copySupportEmail}
        >
          {emailCopied ? '✓ Почта скопирована' : `✉ ${SUPPORT_EMAIL}`}
        </button>
        <p role="status">{error}</p>
      </div>
    </footer>
  )
}
