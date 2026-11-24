import { AlertDialog } from 'radix-ui'
import { TriangleAlert } from 'runeicons-react'
import { useState } from 'react'
import { getErrorMessage } from '../api/client'
import { AppIcon } from './ui/AppIcon'
import { Button } from './ui/Button'

type DeleteConfirmationDialogProps = {
  description: string
  itemName: string
  onConfirm: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
  variant?: 'default' | 'brutal'
}

export function DeleteConfirmationDialog({ description, itemName, onConfirm, onOpenChange, open, title, variant = 'default' }: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleConfirm() {
    setIsDeleting(true)
    setDeleteError('')
    try {
      await onConfirm()
    } catch (error) {
      setDeleteError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setDeleteError('')
    onOpenChange(nextOpen)
  }

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <AlertDialog.Content className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 border bg-[var(--bg-surface)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out] ${variant === 'brutal' ? 'project-brutal-dialog border-2 border-[var(--brutal-ink)] shadow-[7px_7px_0_var(--brutal-shadow)]' : 'rounded-lg border-[var(--border-strong)] shadow-[0_20px_60px_rgba(0,0,0,0.28)]'}`}>
          <div className="p-5">
            <div className={`mb-3 grid size-8 place-items-center bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)] ${variant === 'default' ? 'rounded-md' : 'border-2 border-[var(--brutal-ink)]'}`}><AppIcon icon={TriangleAlert} size={16} /></div>
            <AlertDialog.Title className="text-base font-semibold tracking-[-0.015em]">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{description}</AlertDialog.Description>
            <div className={`mt-3 border bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[11px] ${variant === 'brutal' ? 'border-2' : 'rounded-md'}`}>{itemName}</div>
            {deleteError ? <p className="mt-2 text-[11px] text-[var(--danger)]" role="alert">{deleteError}</p> : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-5 py-3">
            <AlertDialog.Cancel asChild><Button className={variant === 'brutal' ? 'project-brutal-dialog-button' : ''} size="small">Cancel</Button></AlertDialog.Cancel>
            <Button className={variant === 'brutal' ? 'project-brutal-dialog-button' : ''} loading={isDeleting} onClick={handleConfirm} size="small" variant="danger">Delete</Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
