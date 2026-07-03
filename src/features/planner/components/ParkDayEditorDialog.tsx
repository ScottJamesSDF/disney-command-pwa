import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from 'lucide-react'

import type { Family } from '@/domain/entities/family'
import { ParkDaySchema, type ParkDay, type TimeOfDay } from '@/domain/entities/trip'
import { PARK_NAMES } from '@/domain/constants/parks'
import type { DestinationId } from '@/domain/entities/destination'
import {
  DESTINATION_NAMES,
  DESTINATION_PARKS,
  PARK_TO_DESTINATION,
} from '@/domain/constants/destinations'
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

function emptyParkDay(): ParkDay {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    park: 'magicKingdom',
    parkOpenTime: { hour: 9, minute: 0 },
    parkCloseTime: { hour: 22, minute: 0 },
    arrivalTime: { hour: 9, minute: 0 },
    plannedAttractions: [],
    diningReservations: [],
    entertainment: [],
    hasParkHopper: false,
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

  const [destination, setDestination] = useState<DestinationId>(
    PARK_TO_DESTINATION[defaultValues.park],
  )
  const selectedPark = form.watch('park')

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.live(selectedPark),
    queryFn: () => attractionRepository.getLiveAttractions(selectedPark),
  })

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

  function handleDestinationChange(next: DestinationId) {
    setDestination(next)
    const availableParks = DESTINATION_PARKS[next]
    if (!availableParks.includes(form.getValues('park'))) {
      form.setValue('park', availableParks[0])
    }
  }

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
            <div className="grid grid-cols-2 gap-4">
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

              <div className="grid gap-2">
                <Label>Destination</Label>
                <Select value={destination} onValueChange={handleDestinationChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DESTINATION_NAMES).map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormField
              control={form.control}
              name="park"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Park</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    {/* All parks are always rendered here (not filtered by destination) — Radix
                        Select only registers a SelectItem's display label once it has actually
                        mounted, so a value whose item was never rendered (e.g. because it belonged
                        to a destination-filtered-out list) can't be displayed and gets silently
                        reset. Always mounting every item avoids that; Destination is a "jump to
                        this resort's first park" convenience, not a hard filter on this list. */}
                    <SelectContent>
                      {Object.entries(DESTINATION_PARKS).map(([destId, parks]) => (
                        <SelectGroup key={destId}>
                          <SelectLabel>{DESTINATION_NAMES[destId as DestinationId]}</SelectLabel>
                          {parks.map((park) => (
                            <SelectItem key={park} value={park}>
                              {PARK_NAMES[park]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
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

            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="hasParkHopper"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasParkHopper" />
                )}
              />
              <Label htmlFor="hasParkHopper">Park hopper this day</Label>
            </div>

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Planned Attractions</h3>
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
                        <SelectContent>
                          {attractionsQuery.data?.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
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
