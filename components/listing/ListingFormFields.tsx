'use client'

import React from 'react'
import { FilterSelect } from '@/components/ui/FilterSelect'

export {
  MobilityRateField,
  LocationAndPhoneFields,
  type MobilityRateFieldProps,
  type LocationAndPhoneFieldsProps,
} from './ListingLocationFields'

export interface CategoryConditionTypeFieldsProps {
  idPrefix: string
  category: string
  handleCategoryChange: (val: string) => void
  condition: string
  setCondition: (val: string) => void
  type: string
  setType: (val: string) => void
  formOptions: {
    conditionLabel: string
    conditions: { value: string; label: string }[]
    typeLabel: string
    types: { value: string; label: string }[]
  }
}

export function CategoryConditionTypeFields({
  idPrefix,
  category,
  handleCategoryChange,
  condition,
  setCondition,
  type,
  setType,
  formOptions,
}: CategoryConditionTypeFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label
          htmlFor={`${idPrefix}-category`}
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Category <span className="text-destructive">*</span>
        </label>
        <select
          id={`${idPrefix}-category`}
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent"
        >
          <option value="Books">Books & Course Notes</option>
          <option value="Cycles">Bicycles & Gear</option>
          <option value="Scooty">Scooty & Two-Wheelers</option>
          <option value="Electronics">Laptops, Phones & Tech</option>
          <option value="Hostel">Hostel Essentials & Furniture</option>
          <option value="Lab">Lab Equipment & Lab Coats</option>
          <option value="Other">Miscellaneous</option>
        </select>
      </div>

      <FilterSelect
        id={`${idPrefix}-condition`}
        label={formOptions.conditionLabel}
        value={condition}
        onChange={setCondition}
        options={formOptions.conditions}
        vertical
      />

      <FilterSelect
        id={`${idPrefix}-type`}
        label={formOptions.typeLabel}
        value={type}
        onChange={setType}
        options={formOptions.types}
        vertical
      />
    </div>
  )
}

export function ListingTitleField({
  idPrefix,
  title,
  setTitle,
  placeholder,
}: {
  idPrefix: string
  title: string
  setTitle: (val: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label
        htmlFor={`${idPrefix}-title`}
        className="block text-xs font-bold uppercase tracking-wider text-foreground"
      >
        Item Title <span className="text-destructive">*</span>
      </label>
      <input
        id={`${idPrefix}-title`}
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent transition-colors"
      />
    </div>
  )
}

export function ListingDescriptionField({
  idPrefix,
  description,
  setDescription,
  placeholder,
  aiButton,
}: {
  idPrefix: string
  description: string
  setDescription: (val: string) => void
  placeholder: string
  aiButton?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-description`}
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Description <span className="text-destructive">*</span>
        </label>
        {aiButton}
      </div>
      <textarea
        id={`${idPrefix}-description`}
        required
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-accent transition-colors"
      />
    </div>
  )
}
