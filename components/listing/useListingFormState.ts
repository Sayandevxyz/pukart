'use client'

import { useState, useMemo } from 'react'
import { getFormOptionsForCategory } from '@/lib/constants/categories'

export function useListingFormState() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Books')
  const [condition, setCondition] = useState('good')
  const [type, setType] = useState('sell')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [location, setLocation] = useState('Pondicherry University')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [dailyRentPrice, setDailyRentPrice] = useState('350')

  const formOptions = useMemo(() => getFormOptionsForCategory(category), [category])

  function handleCategoryChange(newCat: string) {
    setCategory(newCat)
    const opts = getFormOptionsForCategory(newCat)
    setType(opts.defaultType)
    setCondition(opts.defaultCondition)
  }

  function validateListingForm(imagesCount: number, showToast: (msg: string) => void): number | null {
    if (imagesCount === 0) {
      showToast('Please upload at least 1 image of your item')
      return null
    }

    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) {
      showToast('Enter a valid price in INR')
      return null
    }
    return priceNum
  }

  function getPayload(images: string[]) {
    return {
      title,
      description,
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      condition,
      type,
      location,
      phone: phone.trim() || undefined,
      images,
      imageUrl: images[0],
      dailyRentPrice:
        (['Cycles', 'Scooty', 'Bikes'].includes(category) || type === 'rent') && dailyRentPrice
          ? Number(dailyRentPrice)
          : undefined,
    }
  }

  return {
    title,
    setTitle,
    category,
    setCategory,
    condition,
    setCondition,
    type,
    setType,
    price,
    setPrice,
    originalPrice,
    setOriginalPrice,
    location,
    setLocation,
    phone,
    setPhone,
    description,
    setDescription,
    dailyRentPrice,
    setDailyRentPrice,
    formOptions,
    handleCategoryChange,
    validateListingForm,
    getPayload,
  }
}
