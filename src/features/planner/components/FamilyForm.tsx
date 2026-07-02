import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { FamilySchema, type Family, type FamilyMember } from '@/domain/entities/family'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { useSaveFamily } from '../hooks/useSaveFamily'
import { FamilyMemberFieldset } from './FamilyMemberFieldset'

function emptyMember(): FamilyMember {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: '',
    age: 10,
    heightCm: 130,
    ageGroup: 'child',
    energyLevel: 'high',
    favoriteAttractions: [],
    dislikedAttractions: [],
    needsStroller: false,
    stepsToday: 0,
    ridesCompleted: 0,
    lastHydrationReminder: now,
    lastRestBreak: now,
  }
}

export function FamilyForm({ family }: { family: Family }) {
  const { attractionRepository } = useRepositories()
  const saveFamily = useSaveFamily()

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.all(),
    queryFn: () => attractionRepository.getAllAttractions(),
  })

  // No explicit `useForm<Family>` generic — see the note in ParkDayEditorDialog.tsx.
  const form = useForm({
    resolver: zodResolver(FamilySchema),
    defaultValues: family,
  })

  // `keyName` must differ from "id" — FamilyMember already has its own `id` field.
  const members = useFieldArray({ control: form.control, name: 'members', keyName: '_fieldKey' })

  function handleSubmit(values: Family) {
    saveFamily.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family name</FormLabel>
              <FormControl>
                <Input placeholder="The Johnson Family" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Members</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => members.append(emptyMember())}
            >
              <Plus className="size-4" /> Add Member
            </Button>
          </div>
          {members.fields.map((field, index) => (
            <FamilyMemberFieldset
              key={field._fieldKey}
              control={form.control}
              index={index}
              attractions={attractionsQuery.data ?? []}
              onRemove={() => members.remove(index)}
            />
          ))}
        </div>

        <Button type="submit" disabled={saveFamily.isPending}>
          {saveFamily.isPending ? 'Saving…' : 'Save Family'}
        </Button>
      </form>
    </Form>
  )
}
