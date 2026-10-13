import { AlertDialog } from 'radix-ui'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'

type DeleteConfirmationDialogProps = {
  description: string
  itemName: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export function DeleteConfirmationDialog({ description, itemName, onConfirm, onOpenChange, open, title }: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog.Root onOpenChange={onOpenChange} open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="p-5">
            <div className="mb-3 grid size-8 place-items-center rounded-md bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"><AlertTriangle aria-hidden="true" size={16} /></div>
            <AlertDialog.Title className="text-base font-semibold tracking-[-0.015em]">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{description}</AlertDialog.Description>
            <div className="mt-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[11px]">{itemName}</div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-5 py-3">
            <AlertDialog.Cancel asChild><Button size="small">Cancel</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button className="border-transparent bg-[var(--danger)] text-white hover:opacity-90" onClick={onConfirm} size="small">Delete</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
