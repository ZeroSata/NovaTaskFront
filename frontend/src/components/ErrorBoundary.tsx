import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка интерфейса',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Nova UI error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">N</div>
            <div>
              <strong>nova</strong>
              <span>AI operations</span>
            </div>
          </div>
          <span className="section-label">NOVA / UI ERROR</span>
          <h1>Не удалось открыть Nova</h1>
          <p className="auth-copy">
            Интерфейс получил неожиданные данные или произошла ошибка рендера.
          </p>
          <pre className="error-box" style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.message}
          </pre>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </section>
      </main>
    )
  }
}
