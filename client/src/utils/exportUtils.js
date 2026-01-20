// Export utility functions for CSV, Excel, and PDF

// Export to CSV
export const exportToCSV = (data, filename = 'export', showNotification = null) => {
  if (!data || data.length === 0) {
    if (showNotification) {
      showNotification('No data to export', 'warning')
    }
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
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

// Export to Excel (using CSV format with .xlsx extension)
export const exportToExcel = (data, filename = 'export') => {
  // For now, we'll use CSV format
  // In production, you might want to use a library like xlsx
  exportToCSV(data, filename)
}

// Parse CSV file
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header and one data row'))
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })

        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Format data for student export
export const formatStudentsForExport = (students) => {
  return students.map(s => ({
    'Student ID': s.student_id,
    'First Name': s.first_name,
    'Last Name': s.last_name,
    'Email': s.email,
    'Phone': s.phone || '',
    'Address': s.address || '',
    'Date of Birth': s.date_of_birth || '',
    'Gender': s.gender || '',
    'Course': s.course || '',
    'Year of Study': s.year_of_study || '',
    'Room Number': s.room_number || 'N/A',
    'Status': s.status || 'active'
  }))
}

// Format data for fees export
export const formatFeesForExport = (fees) => {
  return fees.map(f => ({
    'Student ID': f.student_id || '',
    'Student Name': `${f.first_name || ''} ${f.last_name || ''}`.trim(),
    'Fee Type': f.fee_type || '',
    'Amount': f.amount || 0,
    'Due Date': f.due_date || '',
    'Paid Date': f.paid_date || '',
    'Status': f.status || 'pending',
    'Payment Method': f.payment_method || '',
    'Receipt Number': f.receipt_number || ''
  }))
}

// Format data for attendance export
export const formatAttendanceForExport = (attendance) => {
  return attendance.map(a => ({
    'Student ID': a.student_id || '',
    'Student Name': `${a.first_name || ''} ${a.last_name || ''}`.trim(),
    'Date': a.date || '',
    'Status': a.status || '',
    'Remarks': a.remarks || ''
  }))
}

