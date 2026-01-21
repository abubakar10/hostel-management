import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Filter, X, Package, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Inventory = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity: '',
    unit: 'pieces',
    location: '',
    condition: 'good',
    purchase_date: '',
    purchase_price: '',
    supplier: ''
  })

  useEffect(() => {
    fetchInventory()
  }, [categoryFilter])

  const fetchInventory = async () => {
    try {
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {}
      const response = await api.get('/api/inventory', { params })
      setInventory(response.data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.put(`/api/inventory/${editingItem.id}`, formData)
        showSuccess('Inventory item updated successfully')
      } else {
        await api.post('/api/inventory', formData)
        showSuccess('Inventory item added successfully')
      }
      fetchInventory()
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving inventory item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      item_name: item.item_name || '',
      category: item.category || '',
      quantity: item.quantity || '',
      unit: item.unit || 'pieces',
      location: item.location || '',
      condition: item.condition || 'good',
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price || '',
      supplier: item.supplier || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this inventory item?',
      async () => {
        try {
          await api.delete(`/api/inventory/${id}`)
          fetchInventory()
          showSuccess('Inventory item deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting inventory item')
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      quantity: '',
      unit: 'pieces',
      location: '',
      condition: 'good',
      purchase_date: '',
      purchase_price: '',
      supplier: ''
    })
    setEditingItem(null)
  }

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower) ||
      item.supplier?.toLowerCase().includes(searchLower)
    )
  })

  const categories = [...new Set(inventory.map(i => i.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track and manage hostel inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Item Name</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Quantity</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Condition</th>
                <th className="table-header-cell">Purchase Price</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <AnimatePresence>
                {filteredInventory.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${parseInt(item.quantity) < 10 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  >
                    <td className="table-cell font-medium">
                      <div className="flex items-center gap-2">
                        {item.item_name}
                        {parseInt(item.quantity) < 10 && (
                          <AlertTriangle size={16} className="text-yellow-600" title="Low stock" />
                        )}
                      </div>
                    </td>
                    <td className="table-cell">{item.category || '-'}</td>
                    <td className="table-cell">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="table-cell">{item.location || '-'}</td>
                    <td className="table-cell capitalize">{item.condition || '-'}</td>
                    <td className="table-cell">
                      {item.purchase_price ? `RS ${parseFloat(item.purchase_price).toLocaleString()}` : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                      placeholder="e.g., furniture, electronics"
                      list="categories"
                    />
                    <datalist id="categories">
                      <option value="Furniture" />
                      <option value="Electronics" />
                      <option value="Cleaning" />
                      <option value="Kitchen" />
                      <option value="Bedding" />
                      <option value="Other" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="input-field"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input-field"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="liters">Liters</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input-field"
                      placeholder="Room number or area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="input-field"
                    >
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price (RS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Inventory

