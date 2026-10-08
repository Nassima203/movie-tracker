import { act, render, screen } from '@testing-library/react'
import { fakeUser } from '../../../tests/utils/renderWithAuth'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './hooks/useAuth'
import type { AuthUser } from './types'

type Listener = (user: AuthUser | null) => void

const { gatewayMock } = vi.hoisted(() => {
  const state: { listener: Listener | null } = { listener: null }
  const unsubscribe = vi.fn()
  return {
    gatewayMock: {
      state,
      unsubscribe,
      onChange: vi.fn((listener: Listener) => {
        state.listener = listener
        return unsubscribe
      }),
    },
  }
})

vi.mock('./authService', () => ({
  authGateway: { onChange: gatewayMock.onChange },
}))

function StatusProbe() {
  return <p>{useAuth().status}</p>
}

function emit(user: AuthUser | null) {
  act(() => {
    gatewayMock.state.listener?.(user)
  })
}

describe('AuthProvider', () => {
  it('stays loading until the initial session is known', () => {
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('follows the auth lifecycle', () => {
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    emit(null)
    expect(screen.getByText('anonymous')).toBeInTheDocument()

    emit(fakeUser)
    expect(screen.getByText('authenticated')).toBeInTheDocument()

    emit(null)
    expect(screen.getByText('anonymous')).toBeInTheDocument()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    unmount()

    expect(gatewayMock.unsubscribe).toHaveBeenCalled()
  })
})
