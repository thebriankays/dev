'use client'

import React, { useEffect } from 'react'
import { ColorPicker as ReactColorPicker, useColor, IColor } from 'react-color-palette'
import { useField } from '@payloadcms/ui'
import 'react-color-palette/css'

/* ------------------------------------------------------------------ *
 *  Derive a nice fallback label from the field path                  *
 * ------------------------------------------------------------------ */
const fallbackFromPath = (path: string): string =>
  path
    .split('.')
    .pop() // last segment
    ?.replace(/([A-Z])/g, ' $1') // camel -> camel _
    .replace(/^./, (c) => c.toUpperCase()) ?? path // cap first

type Props = {
  path: string
  label?: string
}

const ColorPickerClient: React.FC<Props> = ({ path, label }) => {
  /* Payload binding -------------------------------------------------- */
  const { value = '#5620cb', setValue } = useField<string>({ path })
  const [color, setColor] = useColor(value || '#5620cb')

  /* keep picker in sync with CMS value */
  useEffect(() => {
    if (value && value !== color.hex) {
      setColor({ ...color, hex: value })
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (newColor: IColor) => {
    setColor(newColor)
    setValue(newColor.hex)
  }

  /* ------------------------------------------------------------------ */
  /*  UI                                                                */
  /* ------------------------------------------------------------------ */
  const displayLabel = label || fallbackFromPath(path)

  return (
    <div
      className="color-picker-container"
      style={{
        marginBottom: '1rem',
        maxWidth: '456px',
        color: 'var(--theme-elevation-800, #fff)' /* Payload dark-theme friendly */,
      }}
    >
      <label
        htmlFor={path}
        style={{
          display: 'block',
          marginBottom: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        {displayLabel}
      </label>

      <ReactColorPicker color={color} onChange={handleChange} />
    </div>
  )
}

export default ColorPickerClient