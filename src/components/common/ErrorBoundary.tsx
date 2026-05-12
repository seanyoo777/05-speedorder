import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? 'Unknown error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SpeedOrder ErrorBoundary]', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-so-border bg-so-surface p-4 text-sm text-red-300">
            <p className="font-medium">패널을 불러오지 못했습니다.</p>
            <p className="mt-1 text-so-muted">{this.state.message}</p>
            <button
              type="button"
              className="mt-3 rounded-md bg-so-accent px-3 py-1.5 text-xs font-medium text-white"
              onClick={() => this.setState({ hasError: false, message: undefined })}
            >
              다시 시도
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
