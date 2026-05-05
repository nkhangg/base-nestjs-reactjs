import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const defaults = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  }
  return render(<ConfirmDialog {...defaults} {...props} />)
}

describe('ConfirmDialog', () => {
  describe('rendering', () => {
    it('renders title and description when open', () => {
      renderDialog({ title: 'Xoá file', description: 'Bạn có chắc không?' })
      expect(screen.getByText('Xoá file')).toBeInTheDocument()
      expect(screen.getByText('Bạn có chắc không?')).toBeInTheDocument()
    })

    it('renders default title when not provided', () => {
      // 'Xác nhận' appears in both title and default confirm button — use heading role
      renderDialog()
      expect(screen.getByRole('heading', { name: 'Xác nhận' })).toBeInTheDocument()
    })

    it('renders custom confirm and cancel labels', () => {
      renderDialog({ confirmLabel: 'Delete', cancelLabel: 'Go back' })
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Go back')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      renderDialog({ title: 'Title only' })
      // Should not throw or render empty description element
      expect(screen.queryByRole('paragraph')).toBeNull()
    })

    it('does not render when open is false', () => {
      renderDialog({ open: false, title: 'Hidden dialog' })
      expect(screen.queryByText('Hidden dialog')).toBeNull()
    })
  })

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      renderDialog({ onConfirm, confirmLabel: 'Confirm' })
      fireEvent.click(screen.getByText('Confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn()
      renderDialog({ onClose, cancelLabel: 'Cancel' })
      fireEvent.click(screen.getByText('Cancel'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm when cancel is clicked', () => {
      const onConfirm = vi.fn()
      renderDialog({ onConfirm, cancelLabel: 'Cancel' })
      fireEvent.click(screen.getByText('Cancel'))
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables cancel button when loading', () => {
      renderDialog({ loading: true, cancelLabel: 'Cancel' })
      expect(screen.getByText('Cancel').closest('button')).toBeDisabled()
    })

    it('disables confirm button when loading', () => {
      renderDialog({ loading: true, confirmLabel: 'Confirm' })
      expect(screen.getByText('Confirm').closest('button')).toBeDisabled()
    })
  })

  describe('variants', () => {
    it.each(['default', 'danger', 'warning', 'info', 'success'] as const)(
      'renders without error for variant=%s',
      (variant) => {
        expect(() =>
          renderDialog({ variant, title: `${variant} dialog` }),
        ).not.toThrow()
        expect(screen.getByText(`${variant} dialog`)).toBeInTheDocument()
      },
    )
  })

  describe('custom icon', () => {
    it('renders custom icon node when provided', () => {
      renderDialog({ icon: <span data-testid="custom-icon">★</span> })
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })
})
