
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';

interface SortableThProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  options: string[]; // List of unique values for this column
  selectedValues: string[]; // Currently selected filter values
  onFilter: (values: string[]) => void;
  className?: string;
}

const SortableTh: React.FC<SortableThProps> = ({ 
  label, 
  sortKey, 
  currentSort, 
  onSort, 
  options,
  selectedValues,
  onFilter,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isSorted = currentSort.key === sortKey;
  const isFiltered = selectedValues.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onFilter(selectedValues.filter(v => v !== val));
    } else {
      onFilter([...selectedValues, val]);
    }
  };

  const clearFilter = () => {
    onFilter([]);
    setIsOpen(false);
  };

  return (
    <th className={`px-4 py-3 align-top font-semibold text-gray-600 text-xs uppercase tracking-wider ${className}`}>
      <div className="flex items-center justify-between space-x-2">
        {/* Sort Button */}
        <button 
          onClick={() => onSort(sortKey)}
          className={`flex items-center hover:text-brand-600 focus:outline-none transition-colors group ${isSorted ? 'text-brand-700 font-bold' : ''}`}
        >
          <span>{label}</span>
          <span className={`ml-1 ${isSorted ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-400'}`}>
            {isSorted ? (
              currentSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </span>
        </button>

        {/* Filter Button */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={toggleDropdown}
            className={`p-1 rounded transition-all duration-200 ${
                isFiltered || isOpen
                ? 'text-brand-600 bg-brand-50 ring-1 ring-brand-200 shadow-sm' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <Filter size={14} fill={isFiltered ? "currentColor" : "none"} />
          </button>

          {/* Absolute Position Dropdown */}
          {isOpen && (
             <div 
                ref={dropdownRef}
                className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 flex flex-col overflow-hidden animate-fade-in-down"
             >
               <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Filter {label}</span>
                 {isFiltered && (
                   <button onClick={clearFilter} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                   </button>
                 )}
               </div>
               <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar bg-white">
                  {options.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3 text-center italic">No options</p>
                  ) : (
                    options.map((opt, idx) => (
                      <label key={idx} className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors group select-none">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedValues.includes(opt) ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white group-hover:border-brand-400'}`}>
                            {selectedValues.includes(opt) && <ArrowDown size={10} className="text-white rotate-180" />} 
                        </div>
                        <input 
                          type="checkbox" 
                          checked={selectedValues.includes(opt)}
                          onChange={() => toggleValue(opt)}
                          className="hidden"
                        />
                        <span className={`text-sm truncate ${selectedValues.includes(opt) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{opt}</span>
                      </label>
                    ))
                  )}
               </div>
             </div>
          )}
        </div>
      </div>
    </th>
  );
};

export default SortableTh;
