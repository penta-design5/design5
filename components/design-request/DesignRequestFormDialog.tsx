'use client'

import { useLayoutEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DesignRequestStatus } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2 } from 'lucide-react'
import { DesignRequestStatusBadge } from '@/components/design-request/DesignRequestStatusBadge'
import { DesignRequestRichTextEditor } from '@/components/design-request/DesignRequestRichTextEditor'
import { isDesignRequestContentEmpty } from '@/lib/design-request-content'

function dateToYmdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function apiDueToLocalDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

const baseSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  departmentTeam: z.string().min(1, '의뢰 부서/팀을 입력해주세요.'),
  dueDate: z.date({ required_error: '마감일을 선택해주세요.' }),
  content: z
    .string()
    .refine((s) => !isDesignRequestContentEmpty(s), '의뢰 내용을 입력해주세요.'),
})

const createSchema = baseSchema

/** 수정 시 상태는 API/목록(관리자)에서만 변경 — 폼에서는 제목·내용 등만 */
const editSchema = baseSchema

export type DesignRequestRow = {
  id: string
  title: string
  content: string
  departmentTeam: string
  dueDate: string
  status: DesignRequestStatus
  createdAt: string
  author: { id: string; name: string | null; email: string }
}

interface DesignRequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initial?: DesignRequestRow | null
  requesterLabel: string
  requesterEmail: string
  onSuccess: () => void
}

export function DesignRequestFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  requesterLabel,
  requesterEmail,
  onSuccess,
}: DesignRequestFormDialogProps) {
  const isEdit = mode === 'edit'

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '',
      departmentTeam: '',
      content: '',
    },
  })

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: '',
      departmentTeam: '',
      content: '',
    },
  })

  useLayoutEffect(() => {
    if (!open) return
    if (isEdit && initial) {
      editForm.reset({
        title: initial.title,
        departmentTeam: initial.departmentTeam,
        content: initial.content,
        dueDate: apiDueToLocalDate(initial.dueDate),
      })
    } else if (!isEdit) {
      createForm.reset({
        title: '',
        departmentTeam: '',
        content: '',
        dueDate: undefined,
      })
    }
  }, [open, isEdit, initial, createForm, editForm])

  const submitting = isEdit ? editForm.formState.isSubmitting : createForm.formState.isSubmitting

  async function onCreate(values: z.infer<typeof createSchema>) {
    const res = await fetch('/api/design-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: values.title,
        departmentTeam: values.departmentTeam,
        content: values.content,
        dueDate: dateToYmdLocal(values.dueDate),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || '등록에 실패했습니다.')
    }
    onOpenChange(false)
    onSuccess()
  }

  async function onEdit(values: z.infer<typeof editSchema>) {
    if (!initial) return
    const res = await fetch(`/api/design-requests/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: values.title,
        departmentTeam: values.departmentTeam,
        content: values.content,
        dueDate: dateToYmdLocal(values.dueDate),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || '수정에 실패했습니다.')
    }
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(e) => {
          const el = e.target as HTMLElement
          if (el.closest('[role="menu"]')) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          const el = e.target as HTMLElement
          if (el.closest('[role="menu"]')) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? '의뢰 수정' : '디자인 의뢰하기'}</DialogTitle>
        </DialogHeader>

        {!isEdit && (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(async (v) => {
                try {
                  await onCreate(v)
                } catch (e: unknown) {
                  createForm.setError('root', {
                    message: e instanceof Error ? e.message : '오류가 발생했습니다.',
                  })
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 제목</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="제목" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label>의뢰자</Label>
                <Input
                  readOnly
                  value={`${requesterLabel} (${requesterEmail})`}
                  className="bg-muted"
                />
              </div>
              <FormField
                control={createForm.control}
                name="departmentTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 부서/팀</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="부서 또는 팀명" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label>의뢰일</Label>
                <Input readOnly value="저장 시 자동 기록" className="bg-muted" />
              </div>
              <FormField
                control={createForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마감일</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="마감일 선택"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 내용</FormLabel>
                    <FormControl>
                      <DesignRequestRichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={submitting}
                        placeholder="내용을 입력해주세요."
                        aria-invalid={!!createForm.formState.errors.content}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {createForm.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.root.message}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  등록
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {isEdit && (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(async (v) => {
                try {
                  await onEdit(v)
                } catch (e: unknown) {
                  editForm.setError('root', {
                    message: e instanceof Error ? e.message : '오류가 발생했습니다.',
                  })
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 제목</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label>의뢰자</Label>
                <Input
                  readOnly
                  value={`${requesterLabel} (${requesterEmail})`}
                  className="bg-muted"
                />
              </div>
              <FormField
                control={editForm.control}
                name="departmentTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 부서/팀</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {initial && (
                <div className="grid gap-2">
                  <Label>의뢰일</Label>
                  <Input
                    readOnly
                    className="bg-muted"
                    value={new Date(initial.createdAt).toLocaleString('ko-KR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  />
                </div>
              )}
              <FormField
                control={editForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마감일</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {initial && (
                <div className="grid gap-2">
                  <Label>상태</Label>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <DesignRequestStatusBadge status={initial.status} className="mr-2.5" />
                      상태는 관리자만 목록에서 변경할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰 내용</FormLabel>
                    <FormControl>
                      <DesignRequestRichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={submitting}
                        aria-invalid={!!editForm.formState.errors.content}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.root.message}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  저장
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
