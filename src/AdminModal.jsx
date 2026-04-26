import React from "react";
import { Image } from "lucide-react";

const AdminModal = ({
  isMenuModalOpen,
  setIsMenuModalOpen,
  menuForm,
  setMenuForm,
  handleSaveMenu,
  handleImageUpload,
  MENU_CATEGORIES
}) => {
  if (!isMenuModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center"
      onClick={() => setIsMenuModalOpen(false)}
    >
      <div
        className="bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-gray-700 pb-2">
          {menuForm.id ? "Edit Menu Item" : "Add New Menu Item"}
        </h3>

        <form onSubmit={handleSaveMenu} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              id="name"
              value={menuForm.name}
              onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              id="desc"
              value={menuForm.desc}
              onChange={(e) => setMenuForm(prev => ({ ...prev, desc: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-300 mb-1">Upload Image</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Image className="w-5 h-5" />
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            {menuForm.imageUrl && (
              <img
                src={menuForm.imageUrl}
                alt="Preview"
                className="w-32 h-32 object-cover mt-2 rounded-lg"
              />
            )}
          </div>

          {/* Price, Category, Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                id="price"
                value={menuForm.price}
                onChange={(e) => setMenuForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                id="category"
                value={menuForm.category}
                onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                {MENU_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace("-", " ")}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-sm font-medium text-gray-300 mb-1">Stock Status</label>
              <label className="inline-flex items-center cursor-pointer p-2 bg-gray-700 rounded-lg border border-gray-600">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={menuForm.isOutOfStock}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, isOutOfStock: e.target.checked }))}
                />
                <div className="relative w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className={`ml-3 text-sm font-medium ${menuForm.isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
                  {menuForm.isOutOfStock ? 'OOS' : 'In Stock'}
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={() => setIsMenuModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
            >
              {menuForm.id ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;