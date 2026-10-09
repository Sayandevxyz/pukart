'use client'

import React, { useState } from 'react'
import { BuyModal } from '@/components/listing/buy-modal'

export default function TestModalPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [meetupLocation, setMeetupLocation] = useState('Central Library Entrance')

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Modal Focus Trap Test Harness</h1>
      <button
        id="open-modal-btn"
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        Open Modal
      </button>
      <BuyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(e) => {
          e.preventDefault()
          setIsOpen(false)
        }}
        listingPrice={1500}
        meetupLocation={meetupLocation}
        setMeetupLocation={setMeetupLocation}
        actionLoading={false}
      />
    </main>
  )
}
