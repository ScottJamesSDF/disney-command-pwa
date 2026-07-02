import { Controller, type Control } from 'react-hook-form'
import { Trash2 } from 'lucide-react'

import type { Attraction } from '@/domain/entities/attraction'
import { AgeGroupSchema, ENERGY_LEVEL_ORDER, type Family } from '@/domain/entities/family'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

interface FamilyMemberFieldsetProps {
  control: Control<Family>
  index: number
  attractions: Attraction[]
  onRemove: () => void
}

function AttractionChecklist({
  control,
  name,
  attractions,
}: {
  control: Control<Family>
  name: `members.${number}.favoriteAttractions` | `members.${number}.dislikedAttractions`
  attractions: Attraction[]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {attractions.map((attraction) => {
            const checked = field.value.includes(attraction.id)
            return (
              <label key={attraction.id} className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    field.onChange(
                      next
                        ? [...field.value, attraction.id]
                        : field.value.filter((id) => id !== attraction.id),
                    )
                  }}
                />
                {attraction.name}
              </label>
            )
          })}
        </div>
      )}
    />
  )
}

export function FamilyMemberFieldset({
  control,
  index,
  attractions,
  onRemove,
}: FamilyMemberFieldsetProps) {
  return (
    <Card className="py-4">
      <CardContent className="space-y-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <Controller
            control={control}
            name={`members.${index}.name`}
            render={({ field }) => <Input placeholder="Name" className="max-w-xs" {...field} />}
          />
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove member">
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Age</Label>
            <Controller
              control={control}
              name={`members.${index}.age`}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (cm)</Label>
            <Controller
              control={control}
              name={`members.${index}.heightCm`}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Age group</Label>
            <Controller
              control={control}
              name={`members.${index}.ageGroup`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AgeGroupSchema.options.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Energy</Label>
            <Controller
              control={control}
              name={`members.${index}.energyLevel`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENERGY_LEVEL_ORDER.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`members.${index}.needsStroller`}
              render={({ field }) => (
                <Checkbox
                  id={`needsStroller-${index}`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor={`needsStroller-${index}`} className="text-xs">
              Needs stroller
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Avatar</Label>
            <Controller
              control={control}
              name={`members.${index}.avatarEmoji`}
              render={({ field }) => (
                <Input className="w-16" placeholder="🙂" {...field} value={field.value ?? ''} />
              )}
            />
          </div>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
            Ride preferences
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-status-go">Favorites</p>
              <AttractionChecklist
                control={control}
                name={`members.${index}.favoriteAttractions`}
                attractions={attractions}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-status-stop">Dislikes</p>
              <AttractionChecklist
                control={control}
                name={`members.${index}.dislikedAttractions`}
                attractions={attractions}
              />
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
