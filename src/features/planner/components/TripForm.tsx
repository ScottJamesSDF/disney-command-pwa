import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'

import { TripSchema, type ParkDay, type Trip } from '@/domain/entities/trip'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { useSaveTrip } from '../hooks/useSaveTrip'
import { ParkDayEditorDialog } from './ParkDayEditorDialog'
import { ParkDaySummaryRow } from './ParkDaySummaryRow'

function isoDateToInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function inputValueToIsoDate(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString()
}

interface EditorState {
  parkDay: ParkDay | null
  index: number | null
}

export function TripForm({ trip }: { trip: Trip }) {
  const saveTrip = useSaveTrip()
  const [editorState, setEditorState] = useState<EditorState | null>(null)

  // No explicit `useForm<Trip>` generic — see the note in ParkDayEditorDialog.tsx.
  const form = useForm({
    resolver: zodResolver(TripSchema),
    defaultValues: trip,
  })

  // `keyName` must differ from "id" — ParkDay already has its own `id` field, and react-hook-form's
  // default `keyName` ("id") silently overwrites it otherwise.
  const parkDays = useFieldArray({ control: form.control, name: 'parkDays', keyName: '_fieldKey' })

  function handleSubmit(values: Trip) {
    saveTrip.mutate(values)
  }

  function handleParkDaySave(parkDay: ParkDay) {
    if (editorState?.index != null) {
      parkDays.update(editorState.index, parkDay)
    } else {
      parkDays.append(parkDay)
    }
    setEditorState(null)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trip name</FormLabel>
                <FormControl>
                  <Input placeholder="Our Disney Trip" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={isoDateToInputValue(field.value)}
                      onChange={(e) => field.onChange(inputValueToIsoDate(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={isoDateToInputValue(field.value)}
                      onChange={(e) => field.onChange(inputValueToIsoDate(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hotelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel</FormLabel>
                <FormControl>
                  <Input placeholder="Disney's Grand Floridian Resort & Spa" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Park Days</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setEditorState({ parkDay: null, index: null })}
              >
                <Plus className="size-4" /> Add Park Day
              </Button>
            </div>
            {parkDays.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No park days planned yet.</p>
            )}
            {parkDays.fields.map((field, index) => (
              <ParkDaySummaryRow
                key={field._fieldKey}
                parkDay={field}
                onEdit={() => setEditorState({ parkDay: field, index })}
                onRemove={() => parkDays.remove(index)}
              />
            ))}
          </div>

          <Button type="submit" disabled={saveTrip.isPending}>
            {saveTrip.isPending ? 'Saving…' : 'Save Trip'}
          </Button>
        </form>
      </Form>

      {editorState && (
        <ParkDayEditorDialog
          parkDay={editorState.parkDay}
          onClose={() => setEditorState(null)}
          onSave={handleParkDaySave}
        />
      )}
    </>
  )
}
