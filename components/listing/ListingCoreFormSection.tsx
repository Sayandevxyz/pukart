'use client'

import React from 'react'
import {
  MobilityRateField,
  LocationAndPhoneFields,
  CategoryConditionTypeFields,
  ListingTitleField,
  ListingDescriptionField,
} from './ListingFormFields'
import { ListingPriceFields } from './ListingPriceFields'
import type { useListingFormState } from './useListingFormState'

export interface ListingCoreFormSectionProps {
  idPrefix: string
  form: ReturnType<typeof useListingFormState>
  aiButton?: React.ReactNode
  priceInsight?: React.ReactNode
  suggestPriceButton?: React.ReactNode
}

export function ListingCoreFormSection({
  idPrefix,
  form,
  aiButton,
  priceInsight,
  suggestPriceButton,
}: ListingCoreFormSectionProps) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-foreground">Listing Information</h2>

        <ListingTitleField
          idPrefix={idPrefix}
          title={form.title}
          setTitle={form.setTitle}
          placeholder={form.formOptions.titlePlaceholder}
        />

        <CategoryConditionTypeFields
          idPrefix={idPrefix}
          category={form.category}
          handleCategoryChange={form.handleCategoryChange}
          condition={form.condition}
          setCondition={form.setCondition}
          type={form.type}
          setType={form.setType}
          formOptions={form.formOptions}
        />

        <ListingDescriptionField
          idPrefix={idPrefix}
          description={form.description}
          setDescription={form.setDescription}
          placeholder={form.formOptions.descriptionPlaceholder}
          aiButton={aiButton}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Price & Campus Meetup</h2>
          {suggestPriceButton}
        </div>

        <ListingPriceFields
          idPrefix={idPrefix}
          price={form.price}
          setPrice={form.setPrice}
          originalPrice={form.originalPrice}
          setOriginalPrice={form.setOriginalPrice}
        />

        {priceInsight}

        <MobilityRateField
          idPrefix={idPrefix}
          category={form.category}
          type={form.type}
          dailyRentPrice={form.dailyRentPrice}
          setDailyRentPrice={form.setDailyRentPrice}
        />

        <LocationAndPhoneFields
          idPrefix={idPrefix}
          location={form.location}
          setLocation={form.setLocation}
          phone={form.phone}
          setPhone={form.setPhone}
        />
      </div>
    </>
  )
}
