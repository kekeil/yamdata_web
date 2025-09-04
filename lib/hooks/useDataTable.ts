"use client"
import { useState, useEffect, useMemo } from 'react';

interface UseDataTableOptions<T> {
  data: T[];
  initialSortField?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  initialRowsPerPage?: number;
  filterFunction?: (item: T, searchTerm: string) => boolean;
}

interface UseDataTableResult<T> {
  displayData: T[];
  totalItems: number;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  sortField: keyof T | null;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  
  // Actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setRowsPerPage: (rows: number) => void;
  setSortField: (field: keyof T) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  resetFilters: () => void;
}

/**
 * Hook pour gérer les tables de données avec tri, pagination et filtrage
 */
export function useDataTable<T>({
  data,
  initialSortField,
  initialSortDirection = 'asc',
  initialRowsPerPage = 10,
  filterFunction
}: UseDataTableOptions<T>): UseDataTableResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [sortField, setSortField] = useState<keyof T | null>(initialSortField || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Réinitialiser la page courante si les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchTerm, rowsPerPage]);
  
  // Filtrer les données selon le terme de recherche
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !filterFunction) {
      return data;
    }
    
    return data.filter(item => filterFunction(item, searchTerm.toLowerCase().trim()));
  }, [data, searchTerm, filterFunction]);
  
  // Trier les données
  const sortedData = useMemo(() => {
    if (!sortField) {
      return filteredData;
    }
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);
  
  // Calculer les données à afficher selon la pagination
  const displayData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);
  
  // Calculer le nombre total de pages
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  
  // Fonction pour aller à une page spécifique
  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };
  
  // Fonction pour aller à la page suivante
  const nextPage = () => {
    setPage(currentPage + 1);
  };
  
  // Fonction pour aller à la page précédente
  const prevPage = () => {
    setPage(currentPage - 1);
  };
  
  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSortField(initialSortField || null);
    setSortDirection(initialSortDirection);
    setCurrentPage(1);
  };
  
  return {
    displayData,
    totalItems: sortedData.length,
    currentPage,
    rowsPerPage,
    totalPages,
    sortField,
    sortDirection,
    searchTerm,
    
    setPage,
    nextPage,
    prevPage,
    setRowsPerPage,
    setSortField,
    setSortDirection,
    setSearchTerm,
    resetFilters
  };
} 