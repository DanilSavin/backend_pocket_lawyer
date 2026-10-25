export async function analyzeDocument(file) {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/documents/analyze', {
    method: 'POST',
    body,
  })
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Сервер вернул некорректный ответ. Повторите попытку.')
  }
  if (!response.ok)
    throw new Error(payload.message || 'Не удалось обработать документ.')
  return payload
}
export async function downloadReport(result) {
  const response = await fetch('/api/documents/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result),
  })
  if (
    !response.ok ||
    !response.headers.get('Content-Type')?.includes('application/pdf')
  ) {
    throw new Error('Не удалось сформировать PDF-отчёт.')
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = 'zaklyuchenie-karmannogo-yurista.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
