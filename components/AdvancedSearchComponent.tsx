import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Search, Filter, X, Calendar, User, Tag } from 'lucide-react-native';

interface SearchFilters {
  query: string;
  status: string[];
  priority: string[];
  dateRange: {
    start: string;
    end: string;
  };
  assignedTo: string;
  tags: string[];
}

interface AdvancedSearchComponentProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  placeholder?: string;
  showFilters?: boolean;
  hideSearchInput?: boolean;
}

export const AdvancedSearchComponent: React.FC<
  AdvancedSearchComponentProps
> = ({ onSearch, onClear, placeholder = 'Buscar...', showFilters = true, hideSearchInput = false }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: [],
    dateRange: { start: '', end: '' },
    assignedTo: '',
    tags: [],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: 'nuevo', label: 'Nuevo', color: '#3b82f6' },
    { value: 'asignado', label: 'Asignado', color: '#f59e0b' },
    { value: 'en_proceso', label: 'En Proceso', color: '#8b5cf6' },
    { value: 'resuelto', label: 'Resuelto', color: '#10b981' },
    { value: 'cerrado', label: 'Cerrado', color: '#6b7280' },
  ];

  const priorityOptions = [
    { value: 'baja', label: 'Baja', color: '#10b981' },
    { value: 'media', label: 'Media', color: '#f59e0b' },
    { value: 'alta', label: 'Alta', color: '#ef4444' },
    { value: 'urgente', label: 'Urgente', color: '#dc2626' },
  ];

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      status: [],
      priority: [],
      dateRange: { start: '', end: '' },
      assignedTo: '',
      tags: [],
    });
    onClear();
  };

  const toggleArrayFilter = (
    array: string[],
    value: string,
    setter: (arr: string[]) => void
  ) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Search Input and Filter Button */}
      <View style={styles.searchContainer}>
        {!hideSearchInput && (
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={filters.query}
              onChangeText={text => updateFilters('query', text)}
              onSubmitEditing={handleSearch}
            />
            {filters.query.length > 0 && (
              <TouchableOpacity onPress={() => updateFilters('query', '')}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {showFilters && (
          <TouchableOpacity
            style={[
              styles.filterButton,
              showAdvanced && styles.filterButtonActive,
              hideSearchInput && styles.filterButtonFullWidth,
            ]}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter size={20} color={showAdvanced ? '#ffffff' : '#1e40af'} />
            {hideSearchInput && (
              <Text style={[styles.filterButtonText, showAdvanced && styles.filterButtonTextActive]}>
                Filtros
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Advanced Filters */}
      {showAdvanced && showFilters && (
        <View style={styles.advancedFilters}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Estado:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterOptions}
            >
              {statusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    filters.status.includes(option.value) && {
                      backgroundColor: option.color,
                      borderColor: option.color,
                    },
                  ]}
                  onPress={() =>
                    toggleArrayFilter(filters.status, option.value, arr =>
                      updateFilters('status', arr)
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.status.includes(option.value) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Prioridad:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterOptions}
            >
              {priorityOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    filters.priority.includes(option.value) && {
                      backgroundColor: option.color,
                      borderColor: option.color,
                    },
                  ]}
                  onPress={() =>
                    toggleArrayFilter(filters.priority, option.value, arr =>
                      updateFilters('priority', arr)
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.priority.includes(option.value) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Rango de fechas:</Text>
            <View style={styles.dateRange}>
              <TextInput
                style={styles.dateInput}
                placeholder="Fecha inicio"
                placeholderTextColor="#9ca3af"
                value={filters.dateRange.start}
                onChangeText={text =>
                  updateFilters('dateRange', {
                    ...filters.dateRange,
                    start: text,
                  })
                }
              />
              <Text style={styles.dateSeparator}>-</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="Fecha fin"
                placeholderTextColor="#9ca3af"
                value={filters.dateRange.end}
                onChangeText={text =>
                  updateFilters('dateRange', {
                    ...filters.dateRange,
                    end: text,
                  })
                }
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterButtonFullWidth: {
    flex: 1,
    width: 'auto',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  advancedFilters: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  filterOptions: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateSeparator: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  searchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1e40af',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
