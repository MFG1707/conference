import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CSVExportData {
  [key: string]: string | number | boolean | null | undefined
}

export function exportToCSV(data: CSVExportData[], filename: string) {
  if (!data || data.length === 0) {
    console.error("No data provided for CSV export")
    return
  }

  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(item => 
      Object.values(item)
        .map(value => 
          value === null || value === undefined ? '' : String(value)
        )
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}