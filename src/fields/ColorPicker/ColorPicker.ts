import type { Field } from 'payload'

interface ColorPickerFieldProps {
  name?: string
  label?: string
  defaultValue?: string
  admin?: Record<string, any>
}

export const colorPickerField = ({
  name = 'color',
  label = 'Color Picker',
  defaultValue,
  admin = {},
}: ColorPickerFieldProps = {}): Field => {
  return {
    name,
    label,
    type: 'text',
    defaultValue,
    admin: {
      components: {
        Field: '@/fields/ColorPicker/ColorPickerClient',
      },
      ...admin,
    },
  }
}