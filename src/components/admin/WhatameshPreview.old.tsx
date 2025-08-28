'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormFields, useForm } from '@payloadcms/ui'
import { Gradient } from 'whatamesh'
import type { GroupFieldClientComponent } from 'payload'
import GradientPresetSelector from '../GradientPresetSelector/GradientPresetSelector'

// Helper to generate random hex colors
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 