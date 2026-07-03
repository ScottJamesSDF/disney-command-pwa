import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AreaSchema,
  AttractionTypeSchema,
  type Area,
  type Attraction,
  type ParkId,
} from '@/domain/entities/attraction'
import { AREA_NAMES } from '@/domain/constants/parks'
import { deriveGeo } from '../lib/deriveGeo'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'

const AddAttractionFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  area: AreaSchema,
  type: AttractionTypeSchema,
  description: z.string().min(1, 'Description is required'),
  durationMinutes: z.number().int().positive(),
  averageWaitMinutes: z.number().int().nonnegative(),
  thrillLevel: z.number().int().min(1).max(5),
  heightRequirement: z.string(),
  hasLightningLane: z.boolean(),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface AddAttractionDialogProps {
  park: ParkId
  areas: Area[]
  onClose: () => void
  onCreate: (attraction: Attraction) => void
}

export function AddAttractionDialog({ park, areas, onClose, onCreate }: AddAttractionDialogProps) {
  const form = useForm({
    resolver: zodResolver(AddAttractionFormSchema),
    defaultValues: {
      name: '',
      area: areas[0] ?? 'mainStreetUSA',
      type: 'ride' as const,
      description: '',
      durationMinutes: 5,
      averageWaitMinutes: 20,
      thrillLevel: 2,
      heightRequirement: '',
      hasLightningLane: false,
    },
  })

  function handleSubmit(values: z.infer<typeof AddAttractionFormSchema>) {
    const mapX = 0.5
    const mapY = 0.5
    const geo = deriveGeo(park, mapX, mapY)
    onCreate({
      id: `${slugify(values.name)}_${crypto.randomUUID().slice(0, 8)}`,
      name: values.name,
      park,
      area: values.area,
      type: values.type,
      description: values.description,
      averageWaitMinutes: values.averageWaitMinutes,
      currentWaitMinutes: values.averageWaitMinutes,
      hasLightningLane: values.hasLightningLane,
      lightningLaneAvailable: values.hasLightningLane,
      lightningLaneReturnTime: null,
      latitude: geo.latitude,
      longitude: geo.longitude,
      mapX,
      mapY,
      durationMinutes: values.durationMinutes,
      isOpen: true,
      tags: [],
      thrillLevel: values.thrillLevel,
      heightRequirement: values.heightRequirement || null,
      isGalaxysEdge: false,
      photoTip: null,
      walkFromHubMinutes: geo.walkFromHubMinutes,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Attraction</DialogTitle>
          <DialogDescription>
            It's placed at the center of the map — drag it into place once added.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Space Mountain" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {AREA_NAMES[area]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AttractionTypeSchema.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="averageWaitMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avg wait (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thrillLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thrill (1-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="heightRequirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height requirement (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='40" (102 cm)' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="hasLightningLane"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasLightningLane" />
                )}
              />
              <Label htmlFor="hasLightningLane">Has Lightning Lane</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Attraction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
