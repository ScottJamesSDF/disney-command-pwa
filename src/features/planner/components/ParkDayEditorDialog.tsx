import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from 'lucide-react'

import type { Attraction, ParkId } from '@/domain/entities/attraction'
import type { Family } from '@/domain/entities/family'
import { ParkDaySchema, type ParkDay, type TimeOfDay } from '@/domain/entities/trip'
import { getParksVisited } from '@/domain/rules/tripRules'
import { AREA_NAMES, PARK_NAMES } from '@/domain/constants/parks'
import { generateItinerary } from '@/application/planner/generateItinerary'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Separator } from '@/shared/components/ui/separator'

function timeOfDayToInputValue(time: TimeOfDay): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

function inputValueToTimeOfDay(value: string): TimeOfDay {
  const [hour, minute] = value.split(':').map(Number)
  return { hour: hour || 0, minute: minute || 0 }
}

function isoDateToInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function inputValueToIsoDate(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString()
}

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalValueToIso(value: string): string {
  return new Date(value).toISOString()
}

/** Groups attractions by park, preserving each park's first-seen order — used to render the
 * Planned Attractions picker as one list grouped (not filtered) by park. */
function groupAttractionsByPark(attractions: Attraction[]): [ParkId, Attraction[]][] {
  const groups = new Map<ParkId, Attraction[]>()
  for (const attraction of attractions) {
    const group = groups.get(attraction.park)
    if (group) {
      group.push(attraction)
    } else {
      groups.set(attraction.park, [attraction])
    }
  }
  return [...groups.entries()]
}

function emptyParkDay(): ParkDay {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    parkOpenTime: { hour: 9, minute: 0 },
    parkCloseTime: { hour: 22, minute: 0 },
    arrivalTime: { hour: 9, minute: 0 },
    plannedAttractions: [],
    diningReservations: [],
    entertainment: [],
  }
}

interface ParkDayEditorDialogProps {
  parkDay: ParkDay | null
  family: Family
  excludedAttractionIds: Set<string>
  onClose: () => void
  onSave: (parkDay: ParkDay) => void
}

export function ParkDayEditorDialog({
  parkDay,
  family,
  excludedAttractionIds,
  onClose,
  onSave,
}: ParkDayEditorDialogProps) {
  const { attractionRepository } = useRepositories()
  const defaultValues = parkDay ?? emptyParkDay()

  // No explicit `useForm<ParkDay>` generic — letting it infer from `zodResolver(ParkDaySchema)`
  // avoids a TS "two different types with this name exist" clash between the manually-imported
  // `ParkDay` alias and the resolver's own zod-inferred type (structurally identical, but treated
  // as distinct instantiations when both are specified).
  const form = useForm({
    resolver: zodResolver(ParkDaySchema),
    defaultValues,
  })

  // Unfiltered, catalog-wide — attractions are grouped by park in the picker below, never filtered
  // to a single "current" park. Matches the pattern already used by FamilyForm's favorite/disliked
  // attraction picker.
  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.all(),
    queryFn: () => attractionRepository.getAllAttractions(),
  })
  const groupedAttractions = groupAttractionsByPark(attractionsQuery.data ?? [])

  // `keyName` must differ from "id" — DiningReservation/EntertainmentEvent already have their own
  // `id` field, and react-hook-form's default `keyName` ("id") silently overwrites it otherwise.
  const plannedAttractions = useFieldArray({
    control: form.control,
    name: 'plannedAttractions',
    keyName: '_fieldKey',
  })
  const diningReservations = useFieldArray({
    control: form.control,
    name: 'diningReservations',
    keyName: '_fieldKey',
  })
  const entertainment = useFieldArray({
    control: form.control,
    name: 'entertainment',
    keyName: '_fieldKey',
  })

  // Derived, not stored — reflects whatever parks the currently-planned attractions actually
  // belong to, so it's always consistent with the plan and updates live as rows are added/removed.
  const parksVisited = getParksVisited(form.watch('plannedAttractions'), attractionsQuery.data ?? [])

  function handleSubmit(values: ParkDay) {
    onSave({
      ...values,
      plannedAttractions: values.plannedAttractions.map((p, i) => ({ ...p, plannedOrder: i })),
    })
  }

  function moveAttraction(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= plannedAttractions.fields.length) return
    plannedAttractions.swap(index, target)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{parkDay ? 'Edit Park Day' : 'Add Park Day'}</DialogTitle>
          <DialogDescription>
            Plan attractions, dining, and entertainment for this day.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={timeOfDayToInputValue(field.value)}
                        onChange={(e) => field.onChange(inputValueToTimeOfDay(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parkOpenTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Park Opens</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={timeOfDayToInputValue(field.value)}
                        onChange={(e) => field.onChange(inputValueToTimeOfDay(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parkCloseTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Park Closes</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={timeOfDayToInputValue(field.value)}
                        onChange={(e) => field.onChange(inputValueToTimeOfDay(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Planned Attractions</h3>
                  {parksVisited.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {parksVisited.length > 1
                        ? `Park Hopping: ${parksVisited.map((p) => PARK_NAMES[p]).join(' + ')}`
                        : PARK_NAMES[parksVisited[0]]}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={!attractionsQuery.data?.length}
                    title="Replaces the current list with a ranked auto-plan"
                    onClick={() => {
                      const result = generateItinerary({
                        parkDay: form.getValues(),
                        family,
                        liveAttractions: attractionsQuery.data ?? [],
                        excludedAttractionIds,
                      })
                      plannedAttractions.replace(result)
                    }}
                  >
                    <Sparkles className="size-4" /> Auto-Plan Day
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={!attractionsQuery.data?.length}
                    onClick={() => {
                      const first = attractionsQuery.data?.[0]
                      if (!first) return
                      plannedAttractions.append({
                        attractionId: first.id,
                        attractionName: first.name,
                        plannedOrder: plannedAttractions.fields.length,
                        isCompleted: false,
                        completedAt: null,
                        usedLightningLane: false,
                        isSkipped: false,
                      })
                    }}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              </div>
              {plannedAttractions.fields.map((field, index) => (
                <div key={field._fieldKey} className="flex items-center gap-2">
                  <Controller
                    control={form.control}
                    name={`plannedAttractions.${index}.attractionId`}
                    render={({ field: attractionField }) => (
                      <Select
                        value={attractionField.value}
                        onValueChange={(value) => {
                          attractionField.onChange(value)
                          const attraction = attractionsQuery.data?.find((a) => a.id === value)
                          if (attraction) {
                            form.setValue(
                              `plannedAttractions.${index}.attractionName`,
                              attraction.name,
                            )
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        {/* Grouped by park, never filtered — every attraction in the catalog is
                            always mounted (same Radix mount-timing reasoning as the old Park
                            select: a value whose item never rendered can't display and gets
                            silently reset). Which park(s) a day belongs to is derived from what's
                            actually picked here, not chosen up front. */}
                        <SelectContent>
                          {groupedAttractions.map(([park, attractions]) => (
                            <SelectGroup key={park}>
                              <SelectLabel>{PARK_NAMES[park]}</SelectLabel>
                              {attractions.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name}
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    — {AREA_NAMES[a.area]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <div className="flex items-center gap-1">
                    <Controller
                      control={form.control}
                      name={`plannedAttractions.${index}.usedLightningLane`}
                      render={({ field: llField }) => (
                        <Checkbox checked={llField.value} onCheckedChange={llField.onChange} />
                      )}
                    />
                    <Label className="text-xs text-muted-foreground">LL</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveAttraction(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveAttraction(index, 1)}
                    disabled={index === plannedAttractions.fields.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => plannedAttractions.remove(index)}
                    aria-label="Remove attraction"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </section>

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Dining Reservations</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() =>
                    diningReservations.append({
                      id: crypto.randomUUID(),
                      restaurantName: '',
                      restaurantId: crypto.randomUUID(),
                      reservationTime: new Date().toISOString(),
                      partySize: 2,
                      isConfirmed: true,
                      isMobileOrder: false,
                      isCompleted: false,
                    })
                  }
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {diningReservations.fields.map((field, index) => (
                <div key={field._fieldKey} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                  <Input
                    placeholder="Restaurant name"
                    {...form.register(`diningReservations.${index}.restaurantName`)}
                  />
                  <Controller
                    control={form.control}
                    name={`diningReservations.${index}.reservationTime`}
                    render={({ field: timeField }) => (
                      <Input
                        type="datetime-local"
                        className="w-48"
                        value={isoToDatetimeLocalValue(timeField.value)}
                        onChange={(e) => timeField.onChange(datetimeLocalValueToIso(e.target.value))}
                      />
                    )}
                  />
                  <Input
                    type="number"
                    className="w-20"
                    min={1}
                    {...form.register(`diningReservations.${index}.partySize`, { valueAsNumber: true })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => diningReservations.remove(index)}
                    aria-label="Remove reservation"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </section>

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Entertainment</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() =>
                    entertainment.append({
                      id: crypto.randomUUID(),
                      name: '',
                      showTime: new Date().toISOString(),
                      location: '',
                      durationMinutes: 15,
                      recommendedArrivalMinutesBefore: 20,
                      isCompleted: false,
                    })
                  }
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {entertainment.fields.map((field, index) => (
                <div key={field._fieldKey} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                  <Input placeholder="Show name" {...form.register(`entertainment.${index}.name`)} />
                  <Input placeholder="Location" {...form.register(`entertainment.${index}.location`)} />
                  <Controller
                    control={form.control}
                    name={`entertainment.${index}.showTime`}
                    render={({ field: timeField }) => (
                      <Input
                        type="datetime-local"
                        className="w-48"
                        value={isoToDatetimeLocalValue(timeField.value)}
                        onChange={(e) => timeField.onChange(datetimeLocalValueToIso(e.target.value))}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => entertainment.remove(index)}
                    aria-label="Remove entertainment"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Park Day</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
